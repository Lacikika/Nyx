// Main configuration for the Discord bot
require('dotenv').config();

module.exports = {
  token: process.env.BOT_TOKEN,
  databaseUrl: process.env.DATABASE_URL,
  clientId: process.env.CLIENT_ID,
  errorLogChannel: process.env.ERROR_LOG_CHANNEL,

  // MySQL database configuration
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'nyx'
  },

  // Add other config options as needed
};
