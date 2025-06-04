// Entry point for the Discord bot
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const config = require('./config');
const fs = require('fs');
const { addXp } = require('../utils/rank');
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
  if (!config.logChannelId) return;
  try {
    const channel = await client.channels.fetch(config.logChannelId);
    if (channel && channel.isTextBased()) {
      await channel.send({ embeds: [embed] });
    }
  } catch (e) { /* fail silently */ }
}

// Only handle slash commands
client.on('interactionCreate', async interaction => {
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

// Listen for messages to award XP
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;
  // Award random XP (e.g. 10-20 per message) with role bonus
  const xp = Math.floor(Math.random() * 11) + 10;
  const { level, leveledUp, bonus } = await addXp(message.author.id, message.guild.id, xp, client);
  if (leveledUp) {
    // Award coins for level up
    const coins = level * 100;
    await require('./utils/db').pool.query('UPDATE nyx.user_profiles SET money = COALESCE(money,0) + $1 WHERE user_id = $2 AND guild_id = $3', [coins, message.author.id, message.guild.id]);
    try {
      await message.channel.send({ content: `🎉 <@${message.author.id}> leveled up to **${level}** and earned **${coins} coins**!` });
    } catch {}
  }
});

client.login(config.token);
