const { SlashCommandBuilder } = require('discord.js');
const { loadCredits, saveCredits } = require('../data/creditUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rablas')
        .setDescription('Próbálj meg rabolni egy felhasználótól!')
        .addUserOption(option => option.setName('celozott').setDescription('A célzott felhasználó').setRequired(true)),
    async execute(interaction) {
        const credits = loadCredits();
        const target = interaction.options.getUser('celozott');
        const userId = interaction.user.id;

        if (Math.random() > 0.5) {
            const stolenAmount = Math.floor(Math.random() * 50) + 1;
            credits[target.id] = (credits[target.id] || 0) - stolenAmount;
            credits[userId] = (credits[userId] || 0) + stolenAmount;
            await interaction.reply(`Sikeresen elraboltál ${stolenAmount} kreditet ${target.tag}-tól!`);
        } else {
            await interaction.reply('A rablás sikertelen volt, elkaptak!');
        }

        saveCredits(credits);
    },
};
