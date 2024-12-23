const { SlashCommandBuilder } = require('discord.js');
const { loadCredits, saveCredits } = require('../data/creditUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('credit_noveles')
        .setDescription('Növeli egy felhasználó kreditjét.')
        .addUserOption(option => option.setName('felhasznalo').setDescription('A felhasználó').setRequired(true))
        .addIntegerOption(option => option.setName('mennyiseg').setDescription('Kredit mennyiség').setRequired(true)),
    async execute(interaction) {
        const credits = loadCredits();
        const targetUser = interaction.options.getUser('felhasznalo');
        const amount = interaction.options.getInteger('mennyiseg');
        credits[targetUser.id] = (credits[targetUser.id] || 0) + amount;
        saveCredits(credits);
        await interaction.reply(`${targetUser.tag} kreditjeit növeltük ${amount}-al.`);
    },
};
