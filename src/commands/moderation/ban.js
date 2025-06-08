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
    }, member.user.username);
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

    // Moderation help embed
    const helpEmbed = new EmbedBuilder()
      .setTitle('🛠️ Nyx Moderation Commands')
      .setDescription('Manage your server with style!')
      .setColor(0xED4245)
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/1828/1828843.png')
      .addFields(
        { name: '🔨 Ban', value: 'Ban a member from the server', inline: true },
        { name: '👢 Kick', value: 'Kick a member from the server', inline: true },
        { name: '🔇 Mute', value: 'Mute a member in the server', inline: true },
        { name: '⚠️ Warn', value: 'Warn a member', inline: true },
        { name: '🧹 Purge', value: 'Delete messages in bulk', inline: true },
        { name: '👥 KickRole', value: 'Kick all members with a specific role', inline: true }
      )
      .setFooter({ text: 'Use moderation commands responsibly!' })
      .setTimestamp();
    await interaction.reply({ embeds: [helpEmbed], flags: 64 });
  },
};
