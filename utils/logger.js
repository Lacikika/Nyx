// utils/logger.js
// Egységes, átlátható logoló rendszer minden Discord eseményhez
const fs = require('fs');
const path = require('path');
const { readUser } = (() => {
  try {
    return require('./jsondb');
  } catch {
    return {};
  }
})();

const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  EVENT: 'EVENT',
  DEBUG: 'DEBUG',
};

const ERROR_LOG_PATH = path.join(__dirname, '../data/error.log');
const AUDIT_LOG_PATH = path.join(__dirname, '../data/audit.log');

function getTimestamp() {
  return new Date().toISOString();
}

function redactSensitive(str) {
  // Never log tokens or secrets
  if (!str) return str;
  return str.replace(/([A-Za-z0-9_\-]{20,})/g, '[REDACTED]');
}

function logToFile(filePath, msg) {
  try {
    fs.appendFileSync(filePath, msg + '\n');
  } catch {}
}

function log(level, message, data = null, opts = {}) {
  let logMsg = `[${getTimestamp()}] [${level}] ${redactSensitive(message)}`;
  if (data && typeof data === 'object') {
    logMsg += '\n' + JSON.stringify(data, null, 2);
  } else if (data) {
    logMsg += ' ' + redactSensitive(data);
  }
  // Console output
  console.log(logMsg);
  // Error log file
  if (level === LOG_LEVELS.ERROR || level === LOG_LEVELS.WARN) {
    logToFile(ERROR_LOG_PATH, logMsg);
  }
  // Audit log file (for admin/mod events)
  if (opts.audit) {
    logToFile(AUDIT_LOG_PATH, logMsg);
  }
}

// --- Activity reporting ---
const activityStats = {
  EVENT: 0,
  INFO: 0,
  WARN: 0,
  ERROR: 0,
  DEBUG: 0
};

function countActivity(level) {
  if (activityStats[level] !== undefined) activityStats[level]++;
}

async function getGuildCount() {
  try {
    const guildDir = path.join(__dirname, '../data/guilds');
    const files = await fs.promises.readdir(guildDir);
    return files.filter(f => f.endsWith('.json')).length;
  } catch {
    return 'N/A';
  }
}

async function getBadWordsCount() {
  try {
    const badwords = JSON.parse(await fs.promises.readFile(path.join(__dirname, '../data/badwords.json'), 'utf8'));
    return Array.isArray(badwords) ? badwords.length : 'N/A';
  } catch {
    return 'N/A';
  }
}

async function getRandomFunFact() {
  const facts = [
    'Did you know? The logger has logged thousands of events!',
    'Fun fact: Logging is cool. 😎',
    'Tip: You can add more bad words in badwords.json!',
    'Pro tip: Use /help for bot commands.',
    'Joke: Why do programmers prefer dark mode? Because light attracts bugs!',
    'Bot uptime is your friend. Restart me sometimes!'
  ];
  return facts[Math.floor(Math.random() * facts.length)];
}

async function printActivityReport() {
  const now = new Date();
  const time = now.toLocaleString();
  const guildCount = await getGuildCount();
  const badWordsCount = await getBadWordsCount();
  const funFact = await getRandomFunFact();
  console.log('='.repeat(48));
  console.log(`[LOGGER] Activity report @ ${time}`);
  for (const level of Object.keys(activityStats)) {
    console.log(`  ${level}: ${activityStats[level]}`);
  }
  console.log(`  Guild configs: ${guildCount}`);
  console.log(`  Bad words in filter: ${badWordsCount}`);
  console.log(`  Fun: ${funFact}`);
  console.log('='.repeat(48));
}

setInterval(printActivityReport, 60 * 60 * 1000); // every hour

function info(message, data, opts) {
  countActivity(LOG_LEVELS.INFO);
  log(LOG_LEVELS.INFO, message, data, opts);
}

function warn(message, data, opts) {
  countActivity(LOG_LEVELS.WARN);
  log(LOG_LEVELS.WARN, message, data, opts);
}

function error(message, data, opts) {
  countActivity(LOG_LEVELS.ERROR);
  log(LOG_LEVELS.ERROR, message, data, opts);
}

function event(message, data, opts) {
  countActivity(LOG_LEVELS.EVENT);
  log(LOG_LEVELS.EVENT, message, data, opts);
}

function debug(message, data, opts) {
  countActivity(LOG_LEVELS.DEBUG);
  log(LOG_LEVELS.DEBUG, message, data, opts);
}

// --- Audit log helper for admin/mod actions ---
function audit(message, data) {
  log(LOG_LEVELS.EVENT, message, data, { audit: true });
}

module.exports = {
  log,
  info,
  warn,
  error,
  event,
  debug,
  audit,
  LOG_LEVELS,
};
