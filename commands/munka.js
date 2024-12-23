const { SlashCommandBuilder } = require('discord.js');
const { loadCredits, saveCredits } = require('../data/creditUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('munka')
        .setDescription('Dolgozz, hogy kreditet szerezz!'),
    async execute(interaction) {
        const credits = loadCredits();
        const earnings = Math.floor(Math.random() * 100) + 1;
        const userId = interaction.user.id;
        credits[userId] = (credits[userId] || 0) + earnings;
        saveCredits(credits);
        await interaction.reply(`Dolgoztál és ${earnings} kreditet szereztél!`);
    },
};
