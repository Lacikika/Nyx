// Entry point for the Discord bot
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const config = require('./config');
const fs = require('fs');
const { addXp } = require('../utils/rank');
const { readUser, writeUser } = require('../utils/jsondb');
let fetch;
(async () => {
  fetch = (await import('node-fetch')).default;
})();
require('dotenv').config();

const client = new Client({
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

// Dynamically load events
const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// --- Logging helpers ---
client.logGuildChange = async function(guildId, embed, actionType) {
  // Always log to the guild's log channel if set
  const config = await readUser('guilds', guildId, guildId);
  if (config && config.logChannel) {
    try {
      const channel = await client.channels.fetch(config.logChannel);
      if (channel && channel.isTextBased()) {
        // Audit log integráció
        let auditInfo = '';
        if (actionType && channel.guild && channel.guild.fetchAuditLogs) {
          try {
            const logs = await channel.guild.fetchAuditLogs({ type: actionType, limit: 1 });
            const entry = logs.entries.first();
            if (entry) {
              auditInfo = `\n**Audit log:** ${entry.executor?.tag || entry.executor?.id} (${entry.action})`; 
            }
          } catch {}
        }
        if (auditInfo) embed.setDescription((embed.data.description || '') + auditInfo);
        await channel.send({ embeds: [embed] });
      }
    } catch (e) { if (dev) console.error('[LOG GUILD CHANGE ERROR]', e); }
  }
};

client.logAllMessagesToConsole = function(message) {
  // Log every message the bot can see (including DMs)
  const location = message.guild ? `[${message.guild.name} #${message.channel.name}]` : '[DM]';
  console.log(`[MSG] ${location} ${message.author?.tag || message.author?.id}: ${message.content}`);
};

// Helper: log to channel
client.logToChannel = async function(embed) {
  if (dev) console.log('[LOG TO CHANNEL]', embed?.data?.title || '', embed?.data?.description || '', embed);
  if (!config.logChannelId) return;
  try {
    const channel = await client.channels.fetch(config.logChannelId);
    if (channel && channel.isTextBased()) {
      await channel.send({ embeds: [embed] });
    }
  } catch (e) { if (dev) console.error('[LOG TO CHANNEL ERROR]', e); }
}

// Helper: log to channel (uses guild config)
client.logToGuildChannel = async function(guildId, embed) {
  if (dev) console.log('[LOG TO GUILD CHANNEL]', guildId, embed?.data?.title || '', embed?.data?.description || '', embed);
  embed.setFooter({ text: '⛏️ by Laci 🛠️' });
  const config = await readUser('guilds', guildId, guildId);
  if (!config.logChannel) return;
  try {
    const channel = await client.channels.fetch(config.logChannel);
    if (channel && channel.isTextBased()) {
      await channel.send({ embeds: [embed] });
    }
  } catch (e) { if (dev) console.error('[LOG TO GUILD CHANNEL ERROR]', e); }
}

// Only handle slash commands
client.on('interactionCreate', async interaction => {
  if (dev) console.log('[INTERACTION]', interaction.commandName, interaction.user?.tag, interaction.options?.data);
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
    // Log every command usage
    const embed = new EmbedBuilder()
      .setTitle('Command Used')
      .setDescription(`/${interaction.commandName} by <@${interaction.user.id}>`)
      .setColor('Blurple')
      .setTimestamp();
    client.logToChannel(embed);
  } catch (error) {
    const embed = new EmbedBuilder()
      .setTitle('Command Error')
      .setDescription(`Error in /${interaction.commandName}: ${error.message || error}`)
      .setColor('Red')
      .setTimestamp();
    if (error.stack) embed.addFields({ name: 'Stack', value: '```' + error.stack.slice(0, 1000) + '```' });
    client.logToChannel(embed);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: `There was an error executing this command.\n${error.message || error}`, flags: 64 });
      }
    } catch (err) {
      // Silently ignore errors like Unknown interaction
    }
  }
});

// Log role, channel, and guild changes
client.on('guildUpdate', async (oldGuild, newGuild) => {
  if (dev) console.log('[GUILD UPDATE]', oldGuild.name, '->', newGuild.name);
  if (oldGuild.name !== newGuild.name) {
    const embed = new EmbedBuilder()
      .setTitle('Guild Name Changed')
      .setDescription(`Guild name changed from **${oldGuild.name}** to **${newGuild.name}**`)
      .setColor('Orange')
      .setTimestamp();
    client.logGuildChange(newGuild.id, embed);
  }
});

client.on('roleCreate', async role => {
  if (dev) console.log('[ROLE CREATE]', role.name, role.id);
  const embed = new EmbedBuilder()
    .setTitle('Role Created')
    .setDescription(`Role **${role.name}** created.`)
    .setColor('Green')
    .setTimestamp();
  client.logGuildChange(role.guild.id, embed);
});

client.on('roleDelete', async role => {
  if (dev) console.log('[ROLE DELETE]', role.name, role.id);
  const embed = new EmbedBuilder()
    .setTitle('Role Deleted')
    .setDescription(`Role **${role.name}** deleted.`)
    .setColor('Red')
    .setTimestamp();
  client.logGuildChange(role.guild.id, embed);
});

client.on('roleUpdate', async (oldRole, newRole) => {
  if (dev) console.log('[ROLE UPDATE]', oldRole.name, '->', newRole.name);
  if (oldRole.name !== newRole.name) {
    const embed = new EmbedBuilder()
      .setTitle('Role Renamed')
      .setDescription(`Role renamed from **${oldRole.name}** to **${newRole.name}**`)
      .setColor('Orange')
      .setTimestamp();
    client.logGuildChange(newRole.guild.id, embed);
  }
});

client.on('channelCreate', async channel => {
  if (dev) console.log('[CHANNEL CREATE]', channel.name, channel.id);
  const embed = new EmbedBuilder()
    .setTitle('Channel Created')
    .setDescription(`Channel <#${channel.id}> created.`)
    .setColor('Green')
    .setTimestamp();
  if (channel.guild) client.logGuildChange(channel.guild.id, embed);
});

client.on('channelDelete', async channel => {
  if (dev) console.log('[CHANNEL DELETE]', channel.name, channel.id);
  const embed = new EmbedBuilder()
    .setTitle('Channel Deleted')
    .setDescription(`Channel **${channel.name}** deleted.`)
    .setColor('Red')
    .setTimestamp();
  if (channel.guild) client.logGuildChange(channel.guild.id, embed);
});

client.on('channelUpdate', async (oldChannel, newChannel) => {
  if (dev) console.log('[CHANNEL UPDATE]', oldChannel.name, '->', newChannel.name);
  if (oldChannel.name !== newChannel.name) {
    const embed = new EmbedBuilder()
      .setTitle('Channel Renamed')
      .setDescription(`Channel renamed from **${oldChannel.name}** to **${newChannel.name}**`)
      .setColor('Orange')
      .setTimestamp();
    if (newChannel.guild) client.logGuildChange(newChannel.guild.id, embed);
  }
});

// Listen for messages to award XP and moderate
client.on('messageCreate', async message => {
  client.logAllMessagesToConsole(message);
  if (message.author.bot || !message.guild) return;
  if (dev) console.log('[MESSAGE]', message.author?.tag, message.content);

  // --- Auto-moderation: Check message with free text moderation API ---
  try {
    const resp = await fetch('https://api.sightengine.com/1.0/text/check.json?lang=en&mode=standard&api_user=1404875704&api_secret=UbMDBaF2SsaY9jg8nH7bwuGAktwjPNsB', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        text: message.content
      })
    });
    const data = await resp.json();
    if (dev) console.log('[AUTOMOD API RESULT]', JSON.stringify(data));
    // If inappropriate (profanity, personal, sexual, etc.), just delete the message
    const hasProfanity = data.profanity && Array.isArray(data.profanity.matches) && data.profanity.matches.length > 0;
    const hasSexual = data.sexual && Array.isArray(data.sexual.matches) && data.sexual.matches.length > 0;
    const hasInsult = data.insult && Array.isArray(data.insult.matches) && data.insult.matches.length > 0;
    let hasPersonal = false;
    if (data.personal && Array.isArray(data.personal.matches) && data.personal.matches.length > 0) {
      // Csak akkor törölj, ha NEM csak @here vagy @everyone a találat
      const nonMention = data.personal.matches.filter(m => m.match !== '@here' && m.match !== '@everyone');
      if (nonMention.length > 0) hasPersonal = true;
    }
    if (hasProfanity || hasPersonal || hasSexual || hasInsult) {
      try { await message.delete(); } catch {}
      return;
    }
  } catch (e) {
    if (dev) console.error('[AUTOMOD ERROR]', e);
  }

  // Award random XP (e.g. 10-20 per message) with role bonus
  const xp = Math.floor(Math.random() * 11) + 10;
  const { level, leveledUp, bonus } = await addXp(message.author.id, message.guild.id, xp, client);
  if (leveledUp) {
    const profile = await readUser('profiles', message.author.id, message.guild.id);
    profile.money = (0)
    await writeUser('profiles', message.author.id, message.guild.id, profile);
    try {
      await message.channel.send({ content: `🎉 <@${message.author.id}> leveled up to **${level}**!` });
    } catch {}
  }
  const embed = new EmbedBuilder()
    .setTitle('Message Sent')
    .setDescription(`**${message.author.tag}**: ${message.content}`)
    .setColor('Blue')
    .setTimestamp();
  client.logToGuildChannel(message.guild.id, embed);
});

// Log message deletions
client.on('messageDelete', async message => {
  if (!message.guild) return;
  // Only log if the deleted message was not sent by a bot
  if (message.author?.bot) return;
  if (dev) console.log('[MESSAGE DELETE]', message.author?.tag, message.content);
  const embed = new EmbedBuilder()
    .setTitle('Üzenet törölve')
    .setDescription(`Felhasználó: <@${message.author?.id || 'ismeretlen'}>\nCsatorna: <#${message.channel.id}>\nTartalom: ${message.content || '*nincs tartalom*'}`)
    .setColor('Red')
    .setTimestamp();
  client.logGuildChange(message.guild.id, embed);
});

// Log role creation (now: Rang létrehozva)
client.on('roleCreate', async role => {
  if (dev) console.log('[ROLE CREATE]', role.name, role.id);
  const embed = new EmbedBuilder()
    .setTitle('Rang létrehozva')
    .setDescription(`Rang: **${role.name}** (ID: ${role.id})`)
    .setColor('Green')
    .setTimestamp();
  client.logGuildChange(role.guild.id, embed);
}
);


// Log member role changes (now: Rang változás)
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (!oldMember.guild) return;
  const oldRoles = new Set(oldMember.roles.cache.keys());
  const newRoles = new Set(newMember.roles.cache.keys());
  const added = [...newRoles].filter(x => !oldRoles.has(x));
  const removed = [...oldRoles].filter(x => !newRoles.has(x));
  if (added.length > 0 || removed.length > 0) {
    let desc = '';
    if (added.length > 0) desc += `Hozzáadott rang(ok): ${added.map(rid => `<@&${rid}>`).join(', ')}\n`;
    if (removed.length > 0) desc += `Eltávolított rang(ok): ${removed.map(rid => `<@&${rid}>`).join(', ')}\n`;
    const embed = new EmbedBuilder()
      .setTitle('Rang változás')
      .setDescription(`Felhasználó: <@${newMember.id}>\n${desc}`)
      .setColor('Blue')
      .setTimestamp();
    client.logGuildChange(newMember.guild.id, embed);
  }
});

client.login(config.token);

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
    } else {
      return console.log('[BOT] Ismeretlen broadcast típus. Használat: broadcast <stop|dev|restart>');
    }
    try {
      const guilds = client.guilds.cache;
      let count = 0;
      for (const [guildId] of guilds) {
        const config = await readUser('guilds', guildId, guildId);
        if (config && config.logChannel) {
          try {
            const channel = await client.channels.fetch(config.logChannel);
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
    console.log('  broadcast <stop|dev|restart> - Üzenet minden szerver log csatornájába');
    console.log('  guilds                 - Szerverek listázása');
    console.log('  users <guildId>        - Felhasználók listázása egy szerveren');
    console.log('  eval <js>              - JavaScript kód futtatása (veszélyes!)');
    console.log('  help                   - Ez a lista');
  } else if (cmd.startsWith('db ')) {
    const args = cmd.slice(3).trim().split(' ');
    const sub = args[0];
    const type = args[1];
    const guildId = args[2];
    const userId = args[3];
    const json = args.slice(4).join(' ');
    const baseDir = require('path').join(__dirname, '../data');
    const fsPromises = require('fs').promises;
    if (sub === 'list') {
      // db list <type>
      if (!type) return console.log('Használat: db list <type>');
      try {
        const files = await fsPromises.readdir(require('path').join(baseDir, type));
        console.log(`[DB] ${type} fájlok:`, files);
      } catch (e) {
        console.error('[DB] Nem sikerült listázni:', e);
      }
    } else if (sub === 'get') {
      // db get <type> <guildId> <userId>
      if (!type || !guildId || !userId) return console.log('Használat: db get <type> <guildId> <userId>');
      try {
        const data = await readUser(type, userId, guildId);
        console.dir(data, { depth: 5 });
      } catch (e) {
        console.error('[DB] Nem sikerült lekérni:', e);
      }
    } else if (sub === 'set') {
      // db set <type> <guildId> <userId> <json>
      if (!type || !guildId || !userId || !json) return console.log('Használat: db set <type> <guildId> <userId> <json>');
      try {
        const obj = JSON.parse(json);
        await writeUser(type, userId, guildId, obj);
        console.log('[DB] Sikeres mentés.');
      } catch (e) {
        console.error('[DB] Nem sikerült menteni:', e);
      }
    } else if (sub === 'delete') {
      // db delete <type> <guildId> <userId>
      if (!type || !guildId || !userId) return console.log('Használat: db delete <type> <guildId> <userId>');
      try {
        const file = require('path').join(baseDir, type, `${guildId}_${userId}.json`);
        await fsPromises.unlink(file);
        console.log('[DB] Fájl törölve.');
      } catch (e) {
        console.error('[DB] Nem sikerült törölni:', e);
      }
    } else if (sub === 'raw') {
      // db raw <type> <guildId> <userId>
      if (!type || !guildId || !userId) return console.log('Használat: db raw <type> <guildId> <userId>');
      try {
        const file = require('path').join(baseDir, type, `${guildId}_${userId}.json`);
        const raw = await fsPromises.readFile(file, 'utf8');
        console.log(raw);
      } catch (e) {
        console.error('[DB] Nem sikerült olvasni:', e);
      }
    } else if (sub === 'help') {
      console.log('[BOT] DB parancsok:');
      console.log('  db list <type>                  - Fájlok listázása (pl. profiles, guilds, logs)');
      console.log('  db get <type> <guildId> <userId>    - Adat lekérdezése (objektum)');
      console.log('  db set <type> <guildId> <userId> <json> - Adat beállítása (JSON string)');
      console.log('  db delete <type> <guildId> <userId>     - Fájl törlése');
      console.log('  db raw <type> <guildId> <userId>       - Fájl tartalom (nyers JSON)');
      console.log('  db help                               - Ez a lista');
    } else {
      console.log('[BOT] Ismeretlen db parancs. Írd be: db help');
    }
  } else {
    console.log('[BOT] Ismeretlen parancs:', cmd);
  }
});
