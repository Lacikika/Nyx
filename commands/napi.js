const { SlashCommandBuilder } = require('discord.js');
const { loadCredits, saveCredits } = require('../data/creditUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('napi')
        .setDescription('Szerezd meg a napi bónuszt!'),
    async execute(interaction) {
        const credits = loadCredits();
        const dailyBonus = 100;
        const userId = interaction.user.id;

        credits[userId] = (credits[userId] || 0) + dailyBonus;
        saveCredits(credits);
        await interaction.reply(`Megkaptad a napi ${dailyBonus} kreditet!`);
    },
};
