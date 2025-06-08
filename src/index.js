// Entry point for the Discord bot
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const config = require('./config');
const fs = require('fs');
const { addXp } = require('../utils/rank');
const { readUser, writeUser } = require('../utils/jsondb');
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

const dev = true; // Set to true to enable debug logging

client.commands = new Collection();

// Dynamically load commands
const commandFolders = fs.readdirSync('./src/commands');
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    client.commands.set(command.data.name, command);
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
    client.logToGuildChannel(newGuild.id, embed);
  }
});

client.on('roleCreate', async role => {
  if (dev) console.log('[ROLE CREATE]', role.name, role.id);
  const embed = new EmbedBuilder()
    .setTitle('Role Created')
    .setDescription(`Role **${role.name}** created.`)
    .setColor('Green')
    .setTimestamp();
  client.logToGuildChannel(role.guild.id, embed);
});

client.on('roleDelete', async role => {
  if (dev) console.log('[ROLE DELETE]', role.name, role.id);
  const embed = new EmbedBuilder()
    .setTitle('Role Deleted')
    .setDescription(`Role **${role.name}** deleted.`)
    .setColor('Red')
    .setTimestamp();
  client.logToGuildChannel(role.guild.id, embed);
});

client.on('roleUpdate', async (oldRole, newRole) => {
  if (dev) console.log('[ROLE UPDATE]', oldRole.name, '->', newRole.name);
  if (oldRole.name !== newRole.name) {
    const embed = new EmbedBuilder()
      .setTitle('Role Renamed')
      .setDescription(`Role renamed from **${oldRole.name}** to **${newRole.name}**`)
      .setColor('Orange')
      .setTimestamp();
    client.logToGuildChannel(newRole.guild.id, embed);
  }
});

client.on('channelCreate', async channel => {
  if (dev) console.log('[CHANNEL CREATE]', channel.name, channel.id);
  const embed = new EmbedBuilder()
    .setTitle('Channel Created')
    .setDescription(`Channel <#${channel.id}> created.`)
    .setColor('Green')
    .setTimestamp();
  if (channel.guild) client.logToGuildChannel(channel.guild.id, embed);
});

client.on('channelDelete', async channel => {
  if (dev) console.log('[CHANNEL DELETE]', channel.name, channel.id);
  const embed = new EmbedBuilder()
    .setTitle('Channel Deleted')
    .setDescription(`Channel **${channel.name}** deleted.`)
    .setColor('Red')
    .setTimestamp();
  if (channel.guild) client.logToGuildChannel(channel.guild.id, embed);
});

client.on('channelUpdate', async (oldChannel, newChannel) => {
  if (dev) console.log('[CHANNEL UPDATE]', oldChannel.name, '->', newChannel.name);
  if (oldChannel.name !== newChannel.name) {
    const embed = new EmbedBuilder()
      .setTitle('Channel Renamed')
      .setDescription(`Channel renamed from **${oldChannel.name}** to **${newChannel.name}**`)
      .setColor('Orange')
      .setTimestamp();
    if (newChannel.guild) client.logToGuildChannel(newChannel.guild.id, embed);
  }
});

// Listen for messages to award XP
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;
  if (dev) console.log('[MESSAGE]', message.author?.tag, message.content);
  // Award random XP (e.g. 10-20 per message) with role bonus
  const xp = Math.floor(Math.random() * 11) + 10;
  const { level, leveledUp, bonus } = await addXp(message.author.id, message.guild.id, xp, client);
  if (leveledUp) {
    // Award coins for level up
    const coins = level * 100;
    const profile = await readUser('profiles', message.author.id, message.guild.id);
    profile.money = (profile.money || 0) + coins;
    await writeUser('profiles', message.author.id, message.guild.id, profile);
    try {
      await message.channel.send({ content: `🎉 <@${message.author.id}> leveled up to **${level}** and earned **${coins} coins**!` });
    } catch {}
  }
  const embed = new EmbedBuilder()
    .setTitle('Message Sent')
    .setDescription(`**${message.author.tag}**: ${message.content}`)
    .setColor('Blue')
    .setTimestamp();
  client.logToGuildChannel(message.guild.id, embed);
});

client.login(config.token);
