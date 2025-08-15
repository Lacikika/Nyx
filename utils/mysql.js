const mysql = require('mysql2/promise');
const config = require('../src/config');
const logger = require('./logger');

let pool;

try {
  pool = mysql.createPool({
    ...config.mysql,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  logger.info('[MySQL] Connection pool created successfully.');

} catch (error) {
  logger.error('[MySQL] Failed to create connection pool:', error);
  process.exit(1); // Exit if we can't connect to the DB
}

/**
 * A helper function to safely parse JSON.
 * @param {string} jsonString The string to parse.
 * @param {*} defaultValue The default value to return on failure.
 * @returns {object | any} The parsed object or the default value.
 */
function safeJsonParse(jsonString, defaultValue = null) {
  if (!jsonString || typeof jsonString !== 'string') {
    return defaultValue;
  }
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Replicates the functionality of jsondb.readUser by fetching from different tables.
 * @param {string} type The type of data to read ('profiles', 'guilds').
 * @param {string} userId The user's ID.
 * @param {string} guildId The guild's ID.
 * @returns {Promise<object>} The user or guild data.
 */
async function readUser(type, userId, guildId) {
  if (type === 'profiles') {
    const [rows] = await pool.execute('SELECT * FROM users WHERE userId = ? AND guildId = ?', [userId, guildId]);
    if (rows.length > 0) {
      // Safely parse JSON fields
      rows[0].warnings = safeJsonParse(rows[0].warnings, []);
      return rows[0];
    }
    return null; // Return null if not found
  }

  if (type === 'guilds') {
    const [rows] = await pool.execute('SELECT * FROM guilds WHERE guildId = ?', [guildId]);
     if (rows.length > 0) {
      // Safely parse JSON fields
      rows[0].config = safeJsonParse(rows[0].config, {});
      return rows[0];
    }
    return null;
  }

  return null;
}

/**
 * Replicates the functionality of jsondb.writeUser.
 * @param {string} type The type of data to write ('profiles', 'guilds').
 * @param {string} userId The user's ID.
 * @param {string} guildId The guild's ID.
 * @param {object} data The data to write.
 */
async function writeUser(type, userId, guildId, data) {
  if (type === 'profiles') {
    const { xp = 0, level = 0, warnings = [] } = data;
    await pool.execute(
      `INSERT INTO users (userId, guildId, xp, level, warnings)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE xp = VALUES(xp), level = VALUES(level), warnings = VALUES(warnings)`,
      [userId, guildId, xp, level, JSON.stringify(warnings)]
    );
  }

  if (type === 'guilds') {
    const { config = {} } = data;
    await pool.execute(
      `INSERT INTO guilds (guildId, config)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE config = VALUES(config)`,
      [guildId, JSON.stringify(config)]
    );
  }
}

/**
 * Appends a log entry to the logs table.
 * @param {object} logData The data for the log entry.
 */
async function appendLog({ guildId, userId, type, moderatorId, reason, log_data = {} }) {
  await pool.execute(
    `INSERT INTO logs (guildId, userId, type, moderatorId, reason, log_data)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [guildId, userId, type, moderatorId, reason, JSON.stringify(log_data)]
  );
}

/**
 * Reads all logs for a specific guild.
 * @param {string} guildId The guild's ID.
 * @returns {Promise<Array>} An array of log entries.
 */
async function readGuildLogs(guildId) {
  const [rows] = await pool.execute('SELECT * FROM logs WHERE guildId = ? ORDER BY timestamp DESC', [guildId]);
  return rows.map(row => ({
    ...row,
    log_data: safeJsonParse(row.log_data, {})
  }));
}

/**
 * Reads all logs for a specific user across all guilds.
 * @param {string} userId The user's ID.
 * @returns {Promise<Array>} An array of log entries.
 */
async function readGlobalUserLogs(userId) {
  const [rows] = await pool.execute('SELECT * FROM logs WHERE userId = ? ORDER BY timestamp DESC', [userId]);
  return rows.map(row => ({
    ...row,
    log_data: safeJsonParse(row.log_data, {})
  }));
}

/**
 * Searches logs with advanced filtering.
 * @param {object} filters The filters to apply.
 * @returns {Promise<Array>} An array of matching log entries.
 */
async function searchMetadata(filters = {}) {
    let query = 'SELECT * FROM logs WHERE 1=1';
    const params = [];

    if (filters.q) {
        query += ' AND (userId LIKE ? OR guildId LIKE ? OR moderatorId LIKE ? OR reason LIKE ?)';
        const searchQuery = `%${filters.q}%`;
        params.push(searchQuery, searchQuery, searchQuery, searchQuery);
    }
    if (filters.date_from) {
        query += ' AND timestamp >= ?';
        params.push(filters.date_from);
    }
    if (filters.date_to) {
        query += ' AND timestamp <= ?';
        params.push(filters.date_to);
    }
    if (filters.type) {
        query += ' AND type = ?';
        params.push(filters.type);
    }

    query += ' ORDER BY timestamp DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
}

/**
 * Fetches a single record from a table by its ID.
 * @param {string} type The type of record ('logs', 'users', 'guilds').
 * @param {number|string} id The ID of the record.
 * @returns {Promise<object>} The record object.
 */
async function getRecordById(type, id) {
    let tableName;
    let idColumn;

    switch (type) {
        case 'logs':
            tableName = 'logs';
            idColumn = 'id';
            break;
        case 'users':
            tableName = 'users';
            idColumn = 'id';
            break;
        case 'guilds':
            tableName = 'guilds';
            idColumn = 'guildId';
            break;
        default:
            throw new Error('Invalid record type specified.');
    }

    const [rows] = await pool.execute(`SELECT * FROM ?? WHERE ?? = ?`, [tableName, idColumn, id]);

    if (rows.length > 0) {
        const record = rows[0];
        // Safely parse any JSON columns
        if (record.warnings) record.warnings = safeJsonParse(record.warnings, []);
        if (record.config) record.config = safeJsonParse(record.config, {});
        if (record.log_data) record.log_data = safeJsonParse(record.log_data, {});
        return record;
    }
    return null;
}

async function getWebpanelUser(username) {
    const [rows] = await pool.execute('SELECT * FROM webpanel_users WHERE username = ?', [username]);
    return rows.length > 0 ? rows[0] : null;
}

async function setWebpanelUser(username, hash) {
    await pool.execute(
        'INSERT INTO webpanel_users (username, hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE hash = VALUES(hash)',
        [username, hash]
    );
}

module.exports = {
  pool, // Export the pool for direct access if needed
  readUser,
  writeUser,
  appendLog,
  readGuildLogs,
  readGlobalUserLogs,
  searchMetadata,
  getWebpanelUser,
  setWebpanelUser,
};
