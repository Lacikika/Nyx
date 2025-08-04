
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('./logger');

// Load encryption key from .key file (hex, 32 bytes = 64 hex chars)
const keyPath = path.join(__dirname, '../.key');
let key = null;
try {
  // Read all non-comment lines, join, remove whitespace, and validate length
  const raw = require('fs').readFileSync(keyPath, 'utf8')
    .split('\n')
    .filter(line => !line.trim().startsWith('#'))
    .join('')
    .replace(/\s/g, '');
  if (/^[a-fA-F0-9]{64}$/.test(raw)) {
    key = raw;
  } else {
    throw new Error('Invalid key in .key file (must be 64 hex chars for 32 bytes)');
  }
} catch (e) {
  console.warn('[ESCROW] No .key file found or invalid key, data will be stored unencrypted!');
}

function encrypt(text) {
  if (!key) return Buffer.from(text, 'utf8');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

function decrypt(buffer) {
  if (!key) return buffer.toString('utf8');
  const iv = buffer.slice(0, 16);
  const data = buffer.slice(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(data);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

const baseDir = path.join(__dirname, '../data');
const MAX_DATA_SIZE = 8 * 1024 * 1024 * 1024; // 8 GB
const INTERACTION_ESTIMATED_SIZE = 512; // bytes per log entry (conservative estimate)

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error(`Failed to create directory: ${error.message}`);
  }
}

function getUserFile(type, userId, guildId) {
  return path.join(baseDir, type, `${guildId}_${userId}.json`);
}

// Guild-based logging: logs are stored in data/logs/{guildId}.json
function getGuildLogFile(guildId) {
  return path.join(baseDir, 'logs', `${guildId}.json`);
}

/**
 * Reads and decrypts a user-specific JSON file.
 * @param {string} type - The type of data (e.g., 'profiles', 'logs').
 * @param {string} userId - The user's ID.
 * @param {string} guildId - The guild's ID.
 * @returns {Promise<object>} The parsed JSON data, or an empty object if the file doesn't exist or is invalid.
 */
async function readUser(type, userId, guildId) {
  const filePath = getUserFile(type, userId, guildId);
  try {
    const buf = await fs.readFile(filePath);
    const data = decrypt(Buffer.isBuffer(buf) ? buf : Buffer.from(buf));
    return JSON.parse(data);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error(`[JSONDB] Error reading or parsing ${filePath}:`, error);
    }
    return {};
  }
}

/**
 * Encrypts and writes data to a user-specific JSON file.
 * @param {string} type - The type of data (e.g., 'profiles', 'logs').
 * @param {string} userId - The user's ID.
 * @param {string} guildId - The guild's ID.
 * @param {object} data - The data to write.
 */
async function writeUser(type, userId, guildId, data) {
  await ensureDir(path.join(baseDir, type));
  const enc = encrypt(JSON.stringify(data, null, 2));
  await fs.writeFile(getUserFile(type, userId, guildId), enc);
}

/**
 * Appends a log entry to the guild's log file.
 * @param {string} guildId - The guild's ID.
 * @param {object} log - The log entry to append.
 */
async function appendGuildLog(guildId, log) {
  await ensureDir(path.join(baseDir, 'logs'));
  const filePath = getGuildLogFile(guildId);
  let data = { entries: [] };
  try {
    const buf = await fs.readFile(filePath);
    data = JSON.parse(decrypt(Buffer.isBuffer(buf) ? buf : Buffer.from(buf)));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error(`[JSONDB] Error reading or parsing ${filePath}:`, error);
    }
  }
  data.entries.unshift(log);
  const enc = encrypt(JSON.stringify(data, null, 2));
  await fs.writeFile(filePath, enc);
}

/**
 * Fetches all logs for a guild.
 * @param {string} guildId - The guild's ID.
 * @returns {Promise<Array<object>>} An array of log entries.
 */
async function readGuildLogs(guildId) {
  const filePath = getGuildLogFile(guildId);
  try {
    const buf = await fs.readFile(filePath);
    const data = decrypt(Buffer.isBuffer(buf) ? buf : Buffer.from(buf));
    return JSON.parse(data).entries || [];
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error(`[JSONDB] Error reading or parsing ${filePath}:`, error);
    }
    return [];
  }
}

/**
 * Fetches all logs for a user across all guilds.
 * @param {string} userId - The user's ID.
 * @returns {Promise<Array<object>>} An array of log entries.
 */
async function readGlobalUserLogs(userId) {
  const logsDir = path.join(baseDir, 'logs');
  let allLogs = [];
  try {
    const files = await fs.readdir(logsDir);
    for (const file of files) {
      const filePath = path.join(logsDir, file);
      try {
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
          const buf = await fs.readFile(filePath);
          const data = JSON.parse(decrypt(Buffer.isBuffer(buf) ? buf : Buffer.from(buf)));
          if (Array.isArray(data.entries)) {
            allLogs.push(...data.entries.filter(e => e.userId === userId));
          }
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          logger.error(`[JSONDB] Error reading or parsing ${filePath}:`, error);
        }
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error(`[JSONDB] Error reading directory ${logsDir}:`, error);
    }
  }
  return allLogs;
}

/**
 * Calculates the total size of the data directory.
 * @returns {Promise<number>} The total size in bytes.
 */
async function getTotalDataSize() {
  async function getDirSize(dir) {
    let size = 0;
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          size += await getDirSize(filePath);
        } else {
          size += stat.size;
        }
      }
    } catch {}
    return size;
  }
  return await getDirSize(baseDir);
}

/**
 * Enforces the data limit by removing the oldest log entries if the total data size exceeds the limit.
 */
async function enforceDataLimit() {
  const totalSize = await getTotalDataSize();
  if (totalSize < MAX_DATA_SIZE) return;
  // Find all log files and sort by oldest entry
  const logsDir = path.join(baseDir, 'logs');
  let logFiles = [];
  try {
    const files = await fs.readdir(logsDir);
    for (const file of files) {
      const filePath = path.join(logsDir, file);
      const stat = await fs.stat(filePath);
      if (stat.isFile()) {
        const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
        if (Array.isArray(data.entries) && data.entries.length > 0) {
          logFiles.push({ filePath, oldest: data.entries[data.entries.length - 1]?.date || 0 });
        }
      }
    }
  } catch {}
  // Sort by oldest log entry (oldest first)
  logFiles.sort((a, b) => a.oldest - b.oldest);
  // Remove oldest entries until under limit
  let removed = 0;
  for (const log of logFiles) {
    if (totalSize - removed < MAX_DATA_SIZE) break;
    try {
      const data = JSON.parse(await fs.readFile(log.filePath, 'utf8'));
      if (Array.isArray(data.entries) && data.entries.length > 0) {
        data.entries.pop(); // Remove oldest
        await fs.writeFile(log.filePath, JSON.stringify(data, null, 2));
        removed += INTERACTION_ESTIMATED_SIZE;
      }
    } catch {}
  }
  if (removed > 0) {
    console.warn(`[DATA MGMT] Data limit exceeded. Removed ~${(removed / 1024 / 1024) | 0} MB of oldest log entries.`);
  }
}

/**
 * Gets the estimated interaction capacity based on the max data size.
 * @returns {Promise<number>} The estimated number of interactions that can be stored.
 */
async function getInteractionCapacity() {
  return Math.floor(MAX_DATA_SIZE / INTERACTION_ESTIMATED_SIZE);
}

/**
 * Appends a log entry for a user and also logs to the guild log file.
 * @param {string} type - The type of data.
 * @param {string} userId - The user's ID.
 * @param {string} guildId - The guild's ID.
 * @param {object} log - The log entry.
 * @param {string} [username=null] - The user's username.
 * @param {object} [extra={}] - Extra data to add to the log entry.
 */
async function appendUserLog(type, userId, guildId, log, username = null, extra = {}) {
  await enforceDataLimit();
  const logs = await readUser(type, userId, guildId);
  if (!Array.isArray(logs.entries)) logs.entries = [];
  // Add username and extra info to log
  const logEntry = {
    ...log,
    userId,
    guildId,
    username: username || log.username || 'Unknown',
    ...extra,
    timestamp: new Date().toISOString()
  };
  logs.entries.unshift(logEntry);
  await writeUser(type, userId, guildId, logs);
  await appendGuildLog(guildId, logEntry); // Also log to the guild log file
  // Indicator: print current usage and capacity
  const totalSize = await getTotalDataSize();
  const percent = ((totalSize / MAX_DATA_SIZE) * 100).toFixed(2);
  const capacity = await getInteractionCapacity();
  const used = Math.floor(totalSize / INTERACTION_ESTIMATED_SIZE);
  // Log to console in a readable way
  console.log('[USER LOG]', JSON.stringify(logEntry, null, 2));
  console.log(
    `[DATA MGMT] Data usage: ${(totalSize / 1024 / 1024).toFixed(2)} MB / 8192 MB (${percent}%). Interactions stored: ${used} / ${capacity}`
  );
}

module.exports = {
  readUser,
  writeUser,
  appendUserLog,
  getTotalDataSize,
  getInteractionCapacity,
  appendGuildLog,
  readGuildLogs,
  readGlobalUserLogs
};
