// Warn command
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendLog } = require('../../../utils/mysql');

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
        .setColor('Red');
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
    const user = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'Nincs megadva indok';
    const guildId = interaction.guild.id;

    // Log the warning
    await appendLog({
      guildId: guildId,
      userId: user.id,
      type: 'WARN',
      moderatorId: interaction.user.id,
      reason: reason,
    });

    // Update user profile with the new warning
    let profile = await readUser('profiles', user.id, guildId);
    if (!profile) {
      profile = { userId: user.id, guildId: guildId, xp: 0, level: 0, warnings: [] };
    }
    if (!profile.warnings) {
        profile.warnings = [];
    }
    profile.warnings.push({ reason: reason, by: interaction.user.id, date: new Date().toISOString() });

    await writeUser('profiles', user.id, guildId, profile);

    const embed = new EmbedBuilder()
      .setTitle('Felhasználó figyelmeztetve')
      .setDescription(`${user.tag} figyelmeztetést kapott.`)
      .addFields({ name: 'Indok', value: reason })
      .setColor('Orange')
      .setFooter({ text: `Figyelmeztetések száma: ${profile.warnings.length}` });
    await interaction.reply({ embeds: [embed] });
  },
};
