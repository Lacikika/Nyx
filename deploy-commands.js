const { REST, Routes } = require('discord.js');
const fs = require('fs');
const { getConfig } = require('./utils.js');

const config = getConfig();

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Collect command data
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (command.data) {
        commands.push(command.data.toJSON());
    }
}

// List of guild IDs from config
const guildIds = config.guildIds || [];

// Initialize the REST client
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// Deploy commands to each guild
(async () => {
    try {
        console.log('Started refreshing guild-specific application (/) commands.');

        for (const guildId of guildIds) {
            await rest.put(
                Routes.applicationGuildCommands(config.clientId, guildId),
                { body: commands }
            );
            console.log(`Successfully reloaded commands for guild ${guildId}`);
        }
        
        console.log('Successfully reloaded guild-specific application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
