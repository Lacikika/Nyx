require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { addRxPlugin, createRxDatabase } = require('rxdb/plugins/core');
const { RxDBDevModePlugin } = require('rxdb/plugins/dev-mode');
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');
const { wrappedValidateAjvStorage } = require('rxdb/plugins/validate-ajv');
const { EmbedBuilder } = require('discord.js');

addRxPlugin(RxDBDevModePlugin);

let dbInstance = null;

/**
 * Initializes the database instance for the bot.
 * @returns {Promise<Object>} The initialized database instance.
 */
async function initializeDatabase() {
    if (dbInstance) {
        return dbInstance;
    }

    dbInstance = await createRxDatabase({
        name: 'nyx_database',
        storage: wrappedValidateAjvStorage({
            storage: getRxStorageMemory()
        }),
        ignoreDuplicate: true
    });

    await dbInstance.addCollections({
        todos: {
            schema: {
                version: 0,
                primaryKey: 'id',
                type: 'object',
                properties: {
                    id: { type: 'string', maxLength: 100 },
                    name: { type: 'string' },
                    done: { type: 'boolean' },
                    timestamp: { type: 'string', format: 'date-time' }
                },
                required: ['id', 'name', 'done', 'timestamp']
            }
        },
        blockedUsers: {
            schema: {
                version: 0,
                primaryKey: 'id',
                type: 'object',
                properties: {
                    id: { type: 'string', maxLength: 100 },
                    reason: { type: 'string' }
                },
                required: ['id']
            }
        },
        privilegedUsers: {
            schema: {
                version: 0,
                primaryKey: 'id',
                type: 'object',
                properties: {
                    id: { type: 'string', maxLength: 100 }
                },
                required: ['id']
            }
        }
    });

    return dbInstance;
}

/**
 * Logs a message to the console and a log file.
 * @param {string} kind - The type of log (e.g., 'I', 'W', 'E').
 * @param {string} message - The log message.
 * @param {string} username - The username associated with the log.
 */
function log(kind, message, username) {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC', hour12: false });
    logMessage(`[ ${kind} ] ${username} | ${message}`);

    if (kind === 'W') {
        console.warn(`[ ${timestamp} ][ WARNING ] ${username} | ${message}`);
    } else if (kind === 'E') {
        console.error(`[ ${timestamp} ][ ERROR ] ${username} | ${message}`);
    } else if (kind === 'I') {
        console.log(`[ ${timestamp} ][ INFO ] ${username} | ${message}`);
    } else {
        console.log(`[ ${timestamp} ][ ${kind} ] ${username} | ${message}`);
    }
}

const logFilePath = (process.env.LOG_FILE_PATH || 'bot.log');
/**
 * Appends a log message to the log file.
 * @param {string} message - The log message to append.
 */
function logMessage(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`, 'utf8');
}

const configPath = path.join(__dirname, 'config.json');
/**
 * Retrieves the bot's configuration from the config file.
 * @returns {Object} The configuration object.
 */
function getConfig() {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({ ownerId: '', appealChannelId: '' }, null, 2));
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/**
 * Creates a Discord embed message.
 * @param {string} title - The title of the embed.
 * @param {string} description - The description of the embed.
 * @param {number} [color=0x0099ff] - The color of the embed.
 * @returns {EmbedBuilder} The created embed.
 */
function createEmbed(title, description, color = 0x0099ff) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color);
}

/**
 * Retrieves the log channel ID from the configuration.
 * @returns {string|null} The log channel ID or null if not set.
 */
function getlogchannel() {
    const config = getConfig();
    return config.logChannelId || null;
}

/**
 * Sets the log channel ID in the configuration.
 * @param {string} channelId - The ID of the log channel to set.
 */
function setlogchannel(channelId) {
    const config = getConfig();
    config.logChannelId = channelId;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

module.exports = { log, logMessage, initializeDatabase, getConfig, createEmbed, getlogchannel, setlogchannel };