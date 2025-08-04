// Main configuration for the Discord bot
require('dotenv').config();

module.exports = {
  token: process.env.BOT_TOKEN,
  databaseUrl: process.env.DATABASE_URL,
  clientId: process.env.CLIENT_ID,
  errorLogChannel: process.env.ERROR_LOG_CHANNEL,
  language: process.env.BOT_LANGUAGE || 'en',
  webpanelPassword: process.env.WEBPANEL_PASSWORD,
  bannedWords: ['badword1', 'badword2'],
  // Add other config options as needed
};
