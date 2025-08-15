// Ban command
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { appendLog } = require('../../../utils/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Tag kitiltasa a szerverrol  ')
    .addUserOption(option =>
      option.setName('target').setDescription('User to ban').setRequired(true))
    .addStringOption(option =>
        option.setName('reason').setDescription('Reason for ban').setRequired(false)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      const embed = new EmbedBuilder()
        .setTitle('Nincs jogosultság')
        .setDescription('Ehhez a parancshoz Ban Members vagy Admin jogosultság szükséges.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    const member = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') || 'Nincs megadva indok';

    if (!member) {
        return interaction.reply({ content: 'Nem található a felhasználó.', ephemeral: true });
    }

    if (!member.bannable) {
      const embed = new EmbedBuilder()
        .setTitle('Kitiltás sikertelen')
        .setDescription('Ezt a felhasználót nem tudom kitiltani.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await member.ban({ reason: reason });

    // Log the ban
    await appendLog({
      guildId: interaction.guild.id,
      userId: member.id,
      type: 'BAN',
      moderatorId: interaction.user.id,
      reason: reason,
    });

    const embed = new EmbedBuilder()
      .setTitle('Felhasználó kitiltva')
      .setDescription(`${member.user.tag} ki lett tiltva.`)
      .setColor('Orange')
      .addFields({ name: 'Indok', value: reason })
      .setFooter({ text: '⛏️ by Laci 🛠️' });

    await interaction.reply({ embeds: [embed] });
  },
};
