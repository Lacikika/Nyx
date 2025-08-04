// Entry point for the Discord bot
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const config = require('./config');
const fs = require('fs');
const { readUser, writeUser, appendUserLog, appendGuildLog } = require('../utils/jsondb');
const logger = require('../utils/logger');
const t = require('../utils/locale');


// Attach after client is defined
let client;
let fetch;
(async () => {
  fetch = (await import('node-fetch')).default;
})();
require('dotenv').config();

client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ]
});

const dev = false; // Set to true to enable debug logging

client.commands = new Collection();
client.cooldowns = new Collection();

// Dynamically load commands
const commandFolders = fs.readdirSync('./src/commands');
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    if (command && command.data && command.data.name) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[COMMAND LOAD WARNING] Skipped file: ./commands/${folder}/${file} (missing .data.name)`);
    }
  }
}

// Dynamically load events (including moderation)
const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// --- Logging helpers removed ---

// Only handle slash commands
client.on('interactionCreate', async interaction => {
  if (dev) logger.debug('[INTERACTION]', interaction.commandName, interaction.user?.tag, interaction.options?.data);
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // Cooldown logic
  const { cooldowns } = client;

  if (!cooldowns.has(command.data.name)) {
    cooldowns.set(command.data.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.data.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;

  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return interaction.reply({ content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.data.name}\` command.`, ephemeral: true });
    }
  }

  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

  try {
    await command.execute(interaction);
  } catch (error) {
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: `There was an error executing this command.\n${error.message || error}`, flags: 64 });
      }
    } catch (err) {
      // Silently ignore errors like Unknown interaction
    }
  }
});

client.login(config.token);

// --- Automatikus parancs regisztráció (induláskor) ---
if (process.env.AUTO_REGISTER_COMMANDS === 'true') {
  const { exec } = require('child_process');
  exec('node ./scripts/register-commands.js', (err, stdout, stderr) => {
    if (err) {
      logger.error('[COMMAND REGISTER ERROR]', err);
    } else {
      logger.info('[COMMAND REGISTER]', stdout);
      if (stderr) logger.error('[COMMAND REGISTER STDERR]', stderr);
    }
  });
}

// --- GLOBAL ERROR HANDLING: Never exit the bot on error ---
process.on('uncaughtException', (err) => {
  logger.error('[UNCAUGHT EXCEPTION]', err);
  if (config.errorLogChannel) {
    (async () => {
      try {
        const channel = await client.channels.fetch(config.errorLogChannel);
        if (channel && channel.isTextBased()) {
          await channel.send({ content: `**[UNCAUGHT EXCEPTION]**\n\n${err?.stack || err}` });
        }
      } catch (e) { logger.error('[ERRORLOG SEND ERROR]', e); }
    })();
  }
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[UNHANDLED REJECTION]', reason);
  if (config.errorLogChannel) {
    (async () => {
      try {
        const channel = await client.channels.fetch(config.errorLogChannel);
        if (channel && channel.isTextBased()) {
          await channel.send({ content: `**[UNHANDLED REJECTION]**\n\n${reason?.stack || reason}` });
        }
      } catch (e) { logger.error('[ERRORLOG SEND ERROR]', e); }
    })();
  }
});

// Initialize console commands
require('./console').initialize(client);

// Escrow all existing data files on startup (one-time migration)
try {
  const { escrowDir } = require('../webpanel/escrow_existing');
  const dataDir = require('path').join(__dirname, '../data');
  escrowDir(dataDir);
  logger.info('[ESCROW] All existing data files escrowed (encrypted)');
} catch (e) {
  logger.warn('[ESCROW] Could not escrow existing data:', e.message);
}

// Start the webpanel if enabled (default: always enabled)
try {
  const { startWebPanel } = require('../webpanel/webpanel');
  startWebPanel(50249);
  logger.info('[WEBPANEL] Web panel started on http://116.202.112.154:50249/');
} catch (e) {
  logger.warn('[WEBPANEL] Could not start web panel:', e.message);
}
