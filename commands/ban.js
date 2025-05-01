const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createEmbed } = require('../utils.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Kitilt egy adott felhasználót a szerverről.')
        .addUserOption(option =>
            option.setName('felhasználó')
                .setDescription('A kitiltandó felhasználó')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('indok')
                .setDescription('A kitiltás oka')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('felhasználó');
        const reason = interaction.options.getString('indok') || 'Nem adott meg indokot.';

        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({
                embeds: [createEmbed('Hozzáférés megtagadva', 'Nincs jogod kitiltani másokat.', 0xff0000)],
                ephemeral: true,
            });
        }

        const botMember = await interaction.guild.members.fetchMe();
        if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({
                embeds: [createEmbed('Hiba', 'Nincs jogosultságom kitiltani tagokat.', 0xff0000)],
                ephemeral: true,
            });
        }

        try {
            const member = await interaction.guild.members.fetch(user.id);

            if (!member) {
                return interaction.reply({
                    embeds: [createEmbed('Hiba', 'A megadott felhasználó nem található a szerveren.', 0xff0000)],
                    ephemeral: true,
                });
            }

            await user.send(`Szia ${user.username},\nKi lettél tiltva a szerverről. Indok: ${reason}`)
                .catch(error => console.log(`Nem sikerült üzenetet küldeni ${user.tag} számára.`));

            await member.ban({ reason });
            await interaction.reply({
                embeds: [createEmbed('Siker', `✅ ${user.tag} sikeresen kitiltva a szerverről. Indok: ${reason}`, 0x00ff00)],
            });
        } catch (error) {
            console.error('Hiba történt a kitiltás során:', error);
            interaction.reply({
                embeds: [createEmbed('Hiba', 'Hiba történt a felhasználó kitiltásakor.', 0xff0000)],
                ephemeral: true,
            });
        }
    },
};
