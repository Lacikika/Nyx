const { SlashCommandBuilder } = require('discord.js');
const { loadCredits } = require('../data/creditUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('credit_megtekint')
        .setDescription('Megtekintheted az aktuális kreditjeidet.'),
    async execute(interaction) {
        const credits = loadCredits();
        const userId = interaction.user.id;
        const userCredits = credits[userId] || 0;
        await interaction.reply(`${interaction.user.tag}, jelenlegi kreditjeid: ${userCredits}`);
    },
};
