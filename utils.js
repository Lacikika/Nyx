require('dotenv').config();
const fs = require('fs');

function log(kind, message, username) {
    const timestamp = new Date().toISOString();
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
function logMessage(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`, 'utf8');
}

module.exports = { log, logMessage };