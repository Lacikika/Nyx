const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Collect command data
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (command.data) {
        commands.push(command.data.toJSON());
    }
}

// List of guild IDs where you want to deploy commands
const guildIds = ['1278320499361054811', '1303724015361327114' ]; // Add your guild IDs here, ha a végén vagy nme kell vesző  

// Initialize the REST client
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// Deploy commands to each guild
(async () => {
    try {
        console.log('Started refreshing guild-specific application (/) commands.');

        for (const guildId of guildIds) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
                { body: commands }
            );
            console.log(`Successfully reloaded commands for guild ${guildId}`);
        }
        
        console.log('Successfully reloaded guild-specific application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
