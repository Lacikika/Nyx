const fs = require('fs').promises;
const path = require('path');

const baseDir = path.join(__dirname, '../data');

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
}

function getUserFile(type, userId, guildId) {
  return path.join(baseDir, type, `${guildId}_${userId}.json`);
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

async function appendUserLog(type, userId, guildId, log) {
  const logs = await readUser(type, userId, guildId);
  if (!Array.isArray(logs.entries)) logs.entries = [];
  logs.entries.unshift(log);
  await writeUser(type, userId, guildId, logs);
}

module.exports = { readUser, writeUser, appendUserLog };
