// Warn command (with PostgreSQL integration)
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logUserEvent } = require('../../../utils/db');

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
    // Fetch audit log entry for warn (if available, e.g. MODERATION_ACTION)
    let auditLog = null;
    try {
      const fetched = await interaction.guild.fetchAuditLogs({ limit: 1 });
      auditLog = fetched.entries.first() || null;
    } catch {}
    await logUserEvent({
      userId: user.id,
      guildId: interaction.guild.id,
      eventType: 'WARN',
      reason,
      warnedBy: interaction.user.id,
      channelId: interaction.channel.id,
      messageId: interaction.id,
      messageContent: reason,
      auditLog
    });
    const embed = new EmbedBuilder()
      .setTitle('User Warned')
      .setDescription(`${user.tag} has been warned.`)
      .addFields({ name: 'Reason', value: reason })
      .setColor('Orange');
    await interaction.reply({ embeds: [embed] });
  },
};
