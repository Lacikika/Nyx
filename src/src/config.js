// Main configuration for the Discord bot
require('dotenv').config();

module.exports = {
  token: process.env.BOT_TOKEN,
  databaseUrl: process.env.DATABASE_URL,
  clientId: process.env.CLIENT_ID,
  // Add other config options as needed
};
