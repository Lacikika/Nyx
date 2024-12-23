const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping') // Set the name of the command
        .setDescription('Replies with Pong!'), // Set the command description
    
    async execute(interaction) {
        await interaction.reply('Pong!'); // Reply with "Pong!"
    },
};
