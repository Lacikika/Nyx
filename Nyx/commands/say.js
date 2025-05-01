const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say') // Ensure the name is provided
        .setDescription('Repeats the message back to you')
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The message to repeat')
                .setRequired(true)), // Ensure you have required options if needed
    async execute(interaction) {
        const message = interaction.options.getString('message');
        await interaction.reply(message); // Respond with the provided message
    },
};
