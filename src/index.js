// Entry point for the Discord bot
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const config = require('./config');
const fs = require('fs');
const { readUser, writeUser, appendLog } = require('../utils/mysql');
const logger = require('../utils/logger');


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
  if (dev) console.log('[INTERACTION]', interaction.commandName, interaction.user?.tag, interaction.options?.data);
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
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

// --- Send bot start embed notification to all servers ---
client.once('ready', async () => {
  try {
    const embed = new EmbedBuilder()
      .setTitle('Bot Started')
      .setDescription('The bot is now online and ready!')
      .setColor(0x3b82f6)
      .setTimestamp()
      .setFooter({ text: 'Nyx Bot', iconURL: client.user.displayAvatarURL() });
    let count = 0;
    for (const [guildId, guild] of client.guilds.cache) {
      // Try to get logChannel from config or guild config
      let logChannelId = config.logChannelId;
      try {
        const guildConfig = await readUser('guilds', guildId, guildId);
        if (guildConfig && guildConfig.config && guildConfig.config.logChannel) {
          logChannelId = guildConfig.config.logChannel;
        }
      } catch {}
      if (logChannelId) {
        try {
          const channel = await client.channels.fetch(logChannelId);
          if (channel && channel.isTextBased()) {
            await channel.send({ embeds: [embed] });
            count++;
          }
        } catch {}
      }
    }
    console.log(`[BOTSTART] Embed sent to ${count} server log channels.`);
  } catch (e) {
    console.error('[BOTSTART EMBED ERROR]', e);
  }
});

// --- Automatikus parancs regisztráció (induláskor) ---
if (process.env.AUTO_REGISTER_COMMANDS === 'true') {
  const { exec } = require('child_process');
  exec('node ./scripts/register-commands.js', (err, stdout, stderr) => {
    if (err) {
      console.error('[COMMAND REGISTER ERROR]', err);
    } else {
      console.log('[COMMAND REGISTER]', stdout);
      if (stderr) console.error('[COMMAND REGISTER STDERR]', stderr);
    }
  });
}

// --- GLOBAL ERROR HANDLING: Never exit the bot on error ---
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
  if (config.errorLogChannel) {
    (async () => {
      try {
        const channel = await client.channels.fetch(config.errorLogChannel);
        if (channel && channel.isTextBased()) {
          await channel.send({ content: `**[UNCAUGHT EXCEPTION]**\n\n${err?.stack || err}` });
        }
      } catch (e) { console.error('[ERRORLOG SEND ERROR]', e); }
    })();
  }
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
  if (config.errorLogChannel) {
    (async () => {
      try {
        const channel = await client.channels.fetch(config.errorLogChannel);
        if (channel && channel.isTextBased()) {
          await channel.send({ content: `**[UNHANDLED REJECTION]**\n\n${reason?.stack || reason}` });
        }
      } catch (e) { console.error('[ERRORLOG SEND ERROR]', e); }
    })();
  }
});

// --- Console commands: restart, stop, say ---
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', async (input) => {
  const cmd = input.trim();
  if (cmd === 'restart') {
    console.log('[BOT] Restarting...');
    process.exit(2);
  } else if (cmd === 'stop') {
    console.log('[BOT] Stopping...');
    process.exit(0);
  } else if (cmd.startsWith('say ')) {
    const msg = cmd.slice(4).trim();
    if (!msg) return console.log('[BOT] Nincs üzenet.');
    try {
      if (config.logChannelId) {
        const channel = await client.channels.fetch(config.logChannelId);
        if (channel && channel.isTextBased()) {
          await channel.send(msg);
          console.log('[BOT] Üzenet elküldve a log csatornába.');
        } else {
          console.log('[BOT] A log csatorna nem szöveges típusú.');
        }
      } else {
        console.log('[BOT] Nincs beállítva logChannelId a configban.');
      }
    } catch (e) {
      console.error('[BOT] Nem sikerült elküldeni az üzenetet:', e);
    }
  } else if (cmd.startsWith('broadcast ')) {
    const type = cmd.slice(10).trim().toLowerCase();
    let message;
    if (type === 'stop') {
      message = ':octagonal_sign: **A bot teljesen leáll!** Minden funkció szünetel.';
    } else if (type === 'dev') {
      message = ':hammer_and_wrench: **A bot fejlesztési módban van!** Előfordulhatnak hibák vagy újraindítások.';
    } else if (type === 'restart') {
      message = ':arrows_counterclockwise: **A bot újraindul!** Kérjük, várj néhány másodpercet.';
    } else if (type === 'update') {
      message = ':rocket: **A bot frissült!** Új funkciók vagy hibajavítások érkeztek.';
    } else if (type === 'online') {
      message = ':green_circle: **A bot ismét online!** Minden funkció elérhető.';
    } else if (type === 'offline') {
      message = ':red_circle: **A bot jelenleg offline!** Funkciók nem elérhetők.';
    } else if (type === 'custom') {
      rl.question('Add meg az üzenetet: ', async (customMsg) => {
        if (!customMsg) return console.log('[BOT] Nincs üzenet.');
        try {
          const guilds = client.guilds.cache;
          let count = 0;
          for (const [guildId] of guilds) {
            const guildConfig = await readUser('guilds', guildId, guildId);
            if (guildConfig && guildConfig.config && guildConfig.config.logChannel) {
              try {
                const channel = await client.channels.fetch(guildConfig.config.logChannel);
                if (channel && channel.isTextBased()) {
                  await channel.send(customMsg);
                  count++;
                }
              } catch {}
            }
          }
          console.log(`[BOT] Custom broadcast elküldve ${count} szerver log csatornájába.`);
        } catch (e) {
          console.error('[BOT] Custom broadcast hiba:', e);
        }
      });
      return;
    } else {
      return console.log('[BOT] Ismeretlen broadcast típus. Használat: broadcast <stop|dev|restart|update|online|offline|custom>');
    }
    try {
      const guilds = client.guilds.cache;
      let count = 0;
      for (const [guildId] of guilds) {
        const guildConfig = await readUser('guilds', guildId, guildId);
        if (guildConfig && guildConfig.config && guildConfig.config.logChannel) {
          try {
            const channel = await client.channels.fetch(guildConfig.config.logChannel);
            if (channel && channel.isTextBased()) {
              await channel.send(message);
              count++;
            }
          } catch {}
        }
      }
      console.log(`[BOT] Broadcast elküldve ${count} szerver log csatornájába.`);
    } catch (e) {
      console.error('[BOT] Broadcast hiba:', e);
    }
  } else if (cmd === 'guilds') {
    // List all guilds
    for (const [id, guild] of client.guilds.cache) {
      console.log(`[GUILD] ${guild.name} (${id})`);
    }
  } else if (cmd.startsWith('users ')) {
    // List users in a guild
    const guildId = cmd.slice(6).trim();
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return console.log('[BOT] Nincs ilyen guild.');
    try {
      await guild.members.fetch();
      for (const [id, member] of guild.members.cache) {
        console.log(`[USER] ${member.user.tag} (${id})`);
      }
    } catch (e) {
      console.error('[BOT] Nem sikerült lekérni a tagokat:', e);
    }
  } else if (cmd.startsWith('eval ')) {
    // Evaluate JS code
    const code = cmd.slice(5);
    try {
      // eslint-disable-next-line no-eval
      const result = await eval(code);
      console.log('[EVAL]', result);
    } catch (e) {
      console.error('[EVAL ERROR]', e);
    }
  } else if (cmd === 'help') {
    console.log('[BOT] Konzol parancsok:');
    console.log('  restart                - Bot újraindítása');
    console.log('  stop                   - Bot leállítása');
    console.log('  say <üzenet>           - Üzenet küldése a log csatornába');
    console.log('  broadcast <stop|dev|restart|update|online|offline|custom> - Üzenet minden szerver log csatornájába');
    console.log('      stop      - Teljes leállás');
    console.log('      dev       - Fejlesztési mód');
    console.log('      restart   - Újraindítás');
    console.log('      update    - Frissítés');
    console.log('      online    - Bot online');
    console.log('      offline   - Bot offline');
    console.log('      custom    - Egyedi üzenet (bekérés)');
    console.log('  guilds                 - Szerverek listázása');
    console.log('  users <guildId>        - Felhasználók listázása egy szerveren');
    console.log('  eval <js>              - JavaScript kód futtatása (veszélyes!)');
    console.log('  help                   - Ez a lista');
  } else {
    console.log('[BOT] Ismeretlen parancs:', cmd);
  }
});

// Start the webpanel if enabled (default: always enabled)
try {
  const { startWebPanel } = require('../webpanel/webpanel');
  startWebPanel(50249);
  logger.info('[WEBPANEL] Web panel started on http://116.202.112.154:50249/');
} catch (e) {
  logger.warn('[WEBPANEL] Could not start web panel:', e.message);
}
