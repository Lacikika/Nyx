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
  // Never log tokens or secrets (matches strings longer than 50 chars)
  if (!str) return str;
  return str.replace(/([A-Za-z0-9_\-]{50,})/g, '[REDACTED]');
}

// --- Asynchronous Log Management ---

const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB

class LogStream {
  constructor(filePath) {
    this.filePath = filePath;
    this.stream = null;
    this.size = 0;
    this.rotating = false;
    this.queue = [];
    this.initialized = false;

    this.init();
  }

  async init() {
    try {
      const dir = path.dirname(this.filePath);
      // Ensure directory exists
      await fs.promises.mkdir(dir, { recursive: true });

      // Get current size if file exists
      try {
        const stat = await fs.promises.stat(this.filePath);
        this.size = stat.size;
      } catch {
        this.size = 0;
      }

      this.openStream();
      this.initialized = true;
      this.processQueue();
    } catch (err) {
      console.error(`[LOGGER] Failed to initialize log stream for ${this.filePath}:`, err);
    }
  }

  openStream() {
    this.stream = fs.createWriteStream(this.filePath, { flags: 'a' });
    this.stream.on('error', (err) => {
      console.error(`[LOGGER] Stream error for ${this.filePath}:`, err);
    });
  }

  write(msg) {
    this.queue.push(msg);
    if (this.initialized && !this.rotating) {
      this.processQueue();
    }
  }

  processQueue() {
    while (this.queue.length > 0) {
      if (this.rotating) return;

      if (this.size >= MAX_LOG_SIZE) {
        this.rotate();
        return;
      }

      const msg = this.queue.shift();
      const data = msg + '\n';
      const len = Buffer.byteLength(data);

      // If stream is not writable (e.g. error or closed), try to reopen
      if (!this.stream || this.stream.destroyed) {
          this.openStream();
      }

      this.stream.write(data);
      this.size += len;
    }
  }

  async rotate() {
    if (this.rotating) return;
    this.rotating = true;

    try {
      if (this.stream) {
        await new Promise((resolve) => this.stream.end(resolve));
      }

      const oldPath = this.filePath + '.old';
      try {
        await fs.promises.unlink(oldPath);
      } catch (e) {
        // Ignore if file doesn't exist
      }

      await fs.promises.rename(this.filePath, oldPath);

      this.size = 0;
      this.openStream();
    } catch (err) {
      console.error(`[LOGGER] Rotation failed for ${this.filePath}:`, err);
      // Try to recover by reopening stream for current file
      this.size = 0; // Reset size assumption to avoid infinite loop
      this.openStream();
    } finally {
      this.rotating = false;
      this.processQueue();
    }
  }
}

const logStreams = new Map();

function getLogStream(filePath) {
  if (!logStreams.has(filePath)) {
    logStreams.set(filePath, new LogStream(filePath));
  }
  return logStreams.get(filePath);
}

function logToFile(filePath, msg) {
  getLogStream(filePath).write(msg);
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
