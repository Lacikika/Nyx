const botConfig = require("../../config.js");
// Warn command
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readUser, writeUser } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Tag figyelmeztetese  ')
    .addUserOption(option =>
      option.setName('target').setDescription('User to warn').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for warning').setRequired(false)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      const embed = new EmbedBuilder()
        .setTitle('Nincs jogosultság')
        .setDescription('Ehhez a parancshoz Kick Members vagy Admin jogosultság szükséges.')
        .setColor(botConfig.customization.embedColors.error);
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
    const user = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'Nincs megadva indok';
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
      .setTitle('Felhasználó figyelmeztetve')
      .setDescription(`${user.tag} figyelmeztetést kapott.`)
      .addFields({ name: 'Indok', value: reason })
      .setColor(botConfig.customization.embedColors.moderation)
      .setFooter({ text: botConfig.customization.footer.text, iconURL: botConfig.customization.footer.iconURL || undefined });
    await interaction.reply({ embeds: [embed] });
  },
};
