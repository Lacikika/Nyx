// Example moderation command: kick.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { appendLog } = require('../../../utils/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Tag kirugasa a szerverrol  ')
    .addUserOption(option =>
      option.setName('target').setDescription('User to kick').setRequired(true))
    .addStringOption(option =>
        option.setName('reason').setDescription('Reason for kick').setRequired(false)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      const embed = new EmbedBuilder()
        .setTitle('Nincs jogosultság')
        .setDescription('Ehhez a parancshoz Kick Members vagy Admin jogosultság szükséges.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    const member = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') || 'Nincs megadva indok';

    if (!member) {
        return interaction.reply({ content: 'Nem található a felhasználó.', ephemeral: true });
    }

    if (!member.kickable) {
      const embed = new EmbedBuilder()
        .setTitle('Kirúgás sikertelen')
        .setDescription('Ezt a felhasználót nem tudom kirúgni.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    await member.kick(reason);

    // Log the kick
    await appendLog({
        guildId: interaction.guild.id,
        userId: member.id,
        type: 'KICK',
        moderatorId: interaction.user.id,
        reason: reason,
    });

    const embed = new EmbedBuilder()
      .setTitle('Felhasználó kirúgva')
      .setDescription(`${member.user.tag} ki lett rúgva.`)
      .addFields({ name: 'Indok', value: reason })
      .setColor('Orange')
      .setFooter({ text: '⛏️ by Laci 🛠️' });

    await interaction.reply({ embeds: [embed] });
  },
};
