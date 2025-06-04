// Utility: lookup.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../../../utils/db');

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
    const profileRes = await pool.query('SELECT * FROM nyx.user_profiles WHERE user_id = $1 AND guild_id = $2', [user.id, guildId]);
    const profile = profileRes.rows[0];
    // Fetch logs
    const res = await pool.query(
      'SELECT * FROM nyx.user_logs WHERE user_id = $1 AND guild_id = $2 ORDER BY date DESC',
      [user.id, guildId]
    );
    const logs = res.rows;
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
        { name: 'Errors', value: String(profile?.total_errors || 0), inline: true }
      );
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
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
