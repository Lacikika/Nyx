// Mute command (role-based)
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a member in the server')
    .addUserOption(option =>
      option.setName('target').setDescription('User to mute').setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
      const embed = new EmbedBuilder()
        .setTitle('Nincs jogosultság')
        .setDescription('Nincs jogosultságod a némításhoz.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
    const member = interaction.options.getMember('target');
    if (!member.moderatable) {
      const embed = new EmbedBuilder()
        .setTitle('Némítás sikertelen')
        .setDescription('Ezt a felhasználót nem tudom némítani.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
    await member.timeout(60 * 60 * 1000, 'Némítva parancs által');
    // Log mute to user log and update profile
    const guildId = interaction.guild.id;
    await appendUserLog('logs', member.id, guildId, {
      event_type: 'MUTE',
      reason: 'Némítva parancs által',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    }, member.user.username);
    const profile = await readUser('profiles', member.id, guildId);
    profile.total_mutes = (profile.total_mutes || 0) + 1;
    profile.last_seen = Date.now();
    await writeUser('profiles', member.id, guildId, profile);
    // Log to channel
    const embed = new EmbedBuilder()
      .setTitle('Felhasználó némítva')
      .setDescription(`${member.user.tag} le lett némítva 1 órára.`)
      .setColor('Orange');
    interaction.client.logToGuildChannel(guildId, embed);
    await interaction.reply({ embeds: [embed] });
  },
};
