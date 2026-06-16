// Main configuration for the Discord bot
require('dotenv').config();

const fs = require('fs');
const path = require('path');

let botConfig = {};
try {
  const configPath = path.join(__dirname, '../config.json');
  if (fs.existsSync(configPath)) {
    const fileContent = fs.readFileSync(configPath, 'utf8');
    botConfig = JSON.parse(fileContent);
  }
} catch (error) {
  console.error('[CONFIG] Failed to load config.json:', error);
}

// Fallback defaults
const defaultConfig = {
  customization: {
    embedColors: {
      primary: "#5865F2",
      success: "#2ECC71",
      error: "#ED4245",
      warning: "#FEE75C",
      info: "#3498DB",
      moderation: "#E67E22",
      rank: "#FFD700"
    },
    footer: {
      text: "Nyx Discord Bot",
      iconURL: ""
    }
  },
  commands: {
    categories: {
      moderation: true,
      utility: true,
      entertainment: true
    }
  }
};

// Deep merge
function mergeDeep(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], mergeDeep(target[key], source[key]));
    }
  }
  return { ...target, ...source };
}

const finalConfig = mergeDeep(defaultConfig, botConfig);

module.exports = {
  token: process.env.BOT_TOKEN,
  databaseUrl: process.env.DATABASE_URL,
  clientId: process.env.CLIENT_ID,
  errorLogChannel: process.env.ERROR_LOG_CHANNEL,
  ...finalConfig
};
