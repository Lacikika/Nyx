const mysql = require('mysql2');
require('dotenv').config();
const fs = require('fs');

function log(kind, message, username,) {
    const timestamp = new Date().toISOString();

    if (kind === 'W') {
        console.warn(`[ ${timestamp} ][ WARNING ] ${username} | ${message}`);

    } else if (kind === 'E') {
        console.error(`[ ${timestamp} ][ ERROR ] ${username} | ${message}`);

    } else if (kind === 'I') {
        console.log(`[ ${timestamp} ][ INFO ] ${username} | ${message}`);
    }    
    else    {
        console.log(`[ ${timestamp} ][ ${kind} ] ${username} | ${message}`);
    }
} 


// Create a connection to the database
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST ,
    user: process.env.MYSQL_USER ,
    password: process.env.MYSQL_PASSWORD ,
    database: process.env.MYSQL_DATABASE ,
});

// Connect to the database
connection.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    
});

// Increment user activity
function incrementUserActivity(userId) {
    const query = `INSERT INTO user_activity (user_id, message_count) VALUES (?, 1)
                   ON DUPLICATE KEY UPDATE message_count = message_count + 1`;
    connection.query(query, [userId], (err) => {
        if (err) {
            console.error('Error incrementing user activity:', err);
        }
    });
}


// Get user activity
function getUserActivity(userId, callback) {
    const query = `SELECT message_count FROM user_activity WHERE user_id = ?`;
    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user activity:', err);
            callback(0);
            return;
        }
        const messageCount = results.length > 0 ? results[0].message_count : 0;
        callback(messageCount);
    });
}

const logFilePath = (process.env.LOG_FILE_PATH || 'bot.log');
function logMessage(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`, 'utf8');
}


function getLogChannel(guildId) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT channel_id AS logChannelId FROM log_channels WHERE guild_id = ?';
        connection.query(query, [guildId], (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return reject(err);
            }
            if (results.length > 0) {
                const channelId = results[0].logChannelId;
                resolve(channelId);
            } else {
                resolve(null);
            }
        });
    });
}

function setlogchannel(guildId, channelId) {
    const query = `INSERT INTO log_channels (guild_id, channel_id) VALUES (?, ?)
                   ON DUPLICATE KEY UPDATE channel_id = VALUES(channel_id)`; // Update the channel_id if the guild_id already exists
    connection.query(query, [guildId, channelId], (err) => {
        if (err) {
            console.error('Error saving log channel:', err);
        }
    });
}


module.exports = { log, incrementUserActivity, getUserActivity, logMessage, getLogChannel, setlogchannel };

