// Warn command
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readUser, writeUser } = require('../../../utils/jsondb');

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
    const guildId = interaction.guild.id;
    // Log warning to user log file
    const logEntry = {
      event_type: 'WARN',
      reason,
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: reason,
      date: Date.now()
    };
    // Append to user log
    const { appendUserLog } = require('../../../utils/jsondb');
    await appendUserLog('logs', user.id, guildId, logEntry, user.username);
    // Update user profile stats
    const profile = await readUser('profiles', user.id, guildId);
    profile.total_warns = (profile.total_warns || 0) + 1;
    profile.last_seen = Date.now();
    await writeUser('profiles', user.id, guildId, profile);
    const embed = new EmbedBuilder()
      .setTitle('User Warned')
      .setDescription(`${user.tag} has been warned.`)
      .addFields({ name: 'Reason', value: reason })
      .setColor('Orange');
    await interaction.reply({ embeds: [embed] });
  },
};
