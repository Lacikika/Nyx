// Utility: lookup.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readUser } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lookup')
    .setDescription('Lookup all moderation and event info for a user')
    .addUserOption(option =>
      option.setName('target').setDescription('User to lookup').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('target');
    const guildId = interaction.guild.id;
    // Fetch profile
    const profile = await readUser('profiles', user.id, guildId);
    // Fetch logs
    const logs = (await readUser('logs', user.id, guildId)).entries || [];
    const embed = new EmbedBuilder()
      .setTitle(`Profile: ${user.tag}`)
      .setThumbnail(user.displayAvatarURL())
      .setColor('Blue')
      .setDescription(profile ? `Joined: ${profile.joined_at ? new Date(profile.joined_at).toLocaleString() : 'Unknown'}\nLast Seen: ${profile.last_seen ? new Date(profile.last_seen).toLocaleString() : 'Unknown'}` : 'No profile found.')
      .addFields(
        { name: 'Total Commands', value: String(profile?.total_commands || 0), inline: true },
        { name: 'Total Messages', value: String(profile?.total_messages || 0), inline: true },
        { name: 'Bans', value: String(profile?.total_bans || 0), inline: true },
        { name: 'Kicks', value: String(profile?.total_kicks || 0), inline: true },
        { name: 'Warns', value: String(profile?.total_warns || 0), inline: true },
        { name: 'Mutes', value: String(profile?.total_mutes || 0), inline: true },
        { name: 'Purges', value: String(profile?.total_purges || 0), inline: true },
        { name: 'Tickets', value: String(profile?.total_tickets || 0), inline: true },
        { name: 'Fun Cmds', value: String(profile?.total_entertainment || 0), inline: true },
        { name: 'Errors', value: String(profile?.total_errors || 0), inline: true },
        { name: 'XP', value: String(profile?.xp || 0), inline: true },
        { name: 'Level', value: String(profile?.level || 0), inline: true },
        { name: 'Money', value: String(profile?.money || 0), inline: true },
        { name: 'Last Work', value: profile?.last_work ? new Date(profile.last_work).toLocaleString() : 'Never', inline: true },
        { name: 'User ID', value: user.id, inline: true },
        { name: 'Username', value: user.username, inline: true },
        { name: 'Discriminator', value: user.discriminator, inline: true },
        { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true }
      );
    // Add Discord info
    let member;
    try {
      member = await interaction.guild.members.fetch(user.id);
    } catch {}
    if (member) {
      embed.addFields(
        { name: 'Display Name', value: member.displayName, inline: true },
        { name: 'Nickname', value: member.nickname || 'None', inline: true },
        { name: 'Joined Server', value: member.joinedAt ? new Date(member.joinedAt).toLocaleString() : 'Unknown', inline: true },
        { name: 'Roles', value: member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => `<@&${r.id}>`).join(', ') || 'None', inline: false },
        { name: 'Permissions', value: member.permissions && member.permissions.toArray().length ? member.permissions.toArray().map(p => `\`${p}\``).join(', ') : 'None', inline: false },
        { name: 'Status', value: member.presence && member.presence.status ? member.presence.status.charAt(0).toUpperCase() + member.presence.status.slice(1) : 'Offline', inline: true },
        { name: 'Activity', value: member.presence && member.presence.activities && member.presence.activities.length ? member.presence.activities.map(a => `${a.type} - ${a.name}`).join('\n') : 'None', inline: false },
        { name: 'Boosting', value: member.premiumSince ? new Date(member.premiumSince).toLocaleString() : 'Not Boosting', inline: true },
        { name: 'Voice Channel', value: member.voice && member.voice.channel ? `<#${member.voice.channel.id}>` : 'Not in Voice', inline: true },
        { name: 'Avatar', value: `[Link](${member.displayAvatarURL()})`, inline: true },
        { name: 'Banner', value: member.user.banner ? `[Link](${member.user.bannerURL({ size: 512 })})` : 'No Banner', inline: true },
        { name: 'Accent Color', value: member.user.accentColor ? `#${member.user.accentColor.toString(16).padStart(6, '0')}` : 'None', inline: true },
        { name: 'Flags', value: member.user.flags && member.user.flags.toArray().length ? member.user.flags.toArray().map(f => `\`${f}\``).join(', ') : 'None', inline: true }
      );
    }
    if (logs.length) {
      logs.slice(0, 5).forEach(log => {
        embed.addFields({
          name: `${log.event_type}: ${log.reason}`,
          value: `By: <@${log.warned_by || log.user_id}> in <#${log.channel_id || 'N/A'}> on ${new Date(log.date).toLocaleString()}`,
          inline: false
        });
      });
      if (logs.length > 5) embed.addFields({ name: '...', value: `And ${logs.length - 5} more...` });
    }
    await interaction.reply({ embeds: [embed], flag: 64 });
  },
};
