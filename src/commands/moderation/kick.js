// Example moderation command: kick.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(option =>
      option.setName('target').setDescription('User to kick').setRequired(true)),
  async execute(interaction) {
    const member = interaction.options.getMember('target');
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      const embed = new EmbedBuilder()
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to kick members.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    if (!member.kickable) {
      const embed = new EmbedBuilder()
        .setTitle('Kick Failed')
        .setDescription('I cannot kick this user.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    await member.kick();
    // Log kick to user log and update profile
    const guildId = interaction.guild.id;
    await appendUserLog('logs', member.id, guildId, {
      event_type: 'KICK',
      reason: 'Kicked by command',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    });
    const profile = await readUser('profiles', member.id, guildId);
    profile.total_kicks = (profile.total_kicks || 0) + 1;
    profile.last_seen = Date.now();
    await writeUser('profiles', member.id, guildId, profile);
    // Log to channel
    const embed = new EmbedBuilder()
      .setTitle('User Kicked')
      .setDescription(`${member.user.tag} was kicked.`)
      .setColor('Orange');
    interaction.client.logToGuildChannel(guildId, embed);
    await interaction.reply({ embeds: [embed] });
  },
};
