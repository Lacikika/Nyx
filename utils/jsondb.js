const fs = require('fs').promises;
const path = require('path');

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

async function readUser(type, userId, guildId) {
  try {
    const data = await fs.readFile(getUserFile(type, userId, guildId), 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeUser(type, userId, guildId, data) {
  await ensureDir(path.join(baseDir, type));
  await fs.writeFile(getUserFile(type, userId, guildId), JSON.stringify(data, null, 2));
}

// Append a log entry to the guild's log file
async function appendGuildLog(guildId, log) {
  await ensureDir(path.join(baseDir, 'logs'));
  let data = { entries: [] };
  try {
    data = JSON.parse(await fs.readFile(getGuildLogFile(guildId), 'utf8'));
  } catch {}
  data.entries.unshift(log);
  await fs.writeFile(getGuildLogFile(guildId), JSON.stringify(data, null, 2));
}

// Fetch all logs for a guild
async function readGuildLogs(guildId) {
  try {
    const data = await fs.readFile(getGuildLogFile(guildId), 'utf8');
    return JSON.parse(data).entries || [];
  } catch {
    return [];
  }
}

// Fetch all logs for a user across all guilds
async function readGlobalUserLogs(userId) {
  const logsDir = path.join(baseDir, 'logs');
  let allLogs = [];
  try {
    const files = await fs.readdir(logsDir);
    for (const file of files) {
      const filePath = path.join(logsDir, file);
      const stat = await fs.stat(filePath);
      if (stat.isFile()) {
        const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
        if (Array.isArray(data.entries)) {
          allLogs.push(...data.entries.filter(e => e.userId === userId));
        }
      }
    }
  } catch {}
  return allLogs;
}

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

async function getInteractionCapacity() {
  return Math.floor(MAX_DATA_SIZE / INTERACTION_ESTIMATED_SIZE);
}

// Patch appendUserLog to also log to the guild log file
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
