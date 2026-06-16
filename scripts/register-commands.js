// scripts/register-commands.js
const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const config = require('../src/config.js');

const commands = [];
const commandFolders = fs.readdirSync('./src/commands');
for (const folder of commandFolders) {
  if (config.commands && config.commands.categories && config.commands.categories[folder] === false) {
    console.log(`[COMMAND REGISTER] Skipping category: ${folder} (disabled in config)`);
    continue;
  }
  const commandFiles = fs.readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`../src/commands/${folder}/${file}`);
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }
}

const clientId = process.env.CLIENT_ID || config.clientId;
const botToken = process.env.BOT_TOKEN || config.token;

if (!clientId) {
    console.error('CLIENT_ID is not set in the environment variables. Please check your .env file.');
    process.exit(1);
}

if (!botToken) {
    console.error('BOT_TOKEN is not set in the environment variables. Please check your .env file.');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(botToken);
const registeredNames = commands.map(cmd => `/${cmd.name || cmd.toJSON().name}`);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );
    console.log('Successfully reloaded application (/) commands.');
    console.log(`Registered commands (${registeredNames.length}):`);
    registeredNames.forEach((cmd, idx) => console.log(` ${idx + 1}.`, cmd));
  } catch (error) {
    console.error(error);
  }
})();
