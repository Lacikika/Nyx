// Warn command
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption(option =>
      option.setName('target').setDescription('User to warn').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for warning').setRequired(false)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      const embed = new EmbedBuilder()
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to warn members.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
    const user = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    let auditLog = null;
    try {
      const fetched = await interaction.guild.fetchAuditLogs({ limit: 1 });
      auditLog = fetched.entries.first() || null;
    } catch {}
    const embed = new EmbedBuilder()
      .setTitle('User Warned')
      .setDescription(`${user.tag} has been warned.`)
      .addFields({ name: 'Reason', value: reason })
      .setColor('Orange');
    await interaction.reply({ embeds: [embed] });
  },
};
