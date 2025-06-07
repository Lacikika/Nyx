// Ban command
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(option =>
      option.setName('target').setDescription('User to ban').setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      const embed = new EmbedBuilder()
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to ban members.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
    const member = interaction.options.getMember('target');
    if (!member.bannable) {
      const embed = new EmbedBuilder()
        .setTitle('Ban Failed')
        .setDescription('I cannot ban this user.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
    await member.ban();
    // Log ban to user log and update profile
    const guildId = interaction.guild.id;
    await appendUserLog('logs', member.id, guildId, {
      event_type: 'BAN',
      reason: 'Banned by command',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    });
    const profile = await readUser('profiles', member.id, guildId);
    profile.total_bans = (profile.total_bans || 0) + 1;
    profile.last_seen = Date.now();
    await writeUser('profiles', member.id, guildId, profile);
    // Log to channel
    const embed = new EmbedBuilder()
      .setTitle('User Banned')
      .setDescription(`${member.user.tag} was banned.`)
      .setColor('Orange');
    interaction.client.logToGuildChannel(guildId, embed);
    await interaction.reply({ embeds: [embed] });
  },
};
