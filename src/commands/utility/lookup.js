// Utility: lookup.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readUser, appendUserLog } = require('../../../utils/jsondb.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lookup')
    .setDescription('🔎 Lookup all moderation and event info for a user')
    .addUserOption(option =>
      option.setName('target').setDescription('User to lookup').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('target');
    const guildId = interaction.guild.id;

    // Fetch profile and logs
    const profile = await readUser('profiles', user.id, guildId);
    const logs = (await readUser('logs', user.id, guildId)).entries || [];

    // Helper to safely format timestamps
    const formatTimestamp = (ms, style = 'F', fallback = 'Unknown') => {
      if (typeof ms === 'number' && !isNaN(ms) && ms > 0) {
        return `<t:${Math.floor(ms/1000)}:${style}>`;
      }
      return fallback;
    };

    // Main Embed
    const embed = new EmbedBuilder()
      .setTitle(`🔎 User Lookup: ${user.tag}`)
      .setThumbnail(user.displayAvatarURL())
      .setColor(profile ? 0x3498db : 0x95a5a6)
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    // Profile Section
    embed.addFields(
      { name: '🗓️ Joined', value: formatTimestamp(profile?.joined_at), inline: true },
      { name: '🕒 Last Seen', value: formatTimestamp(profile?.last_seen, 'R'), inline: true },
      { name: '💬 Messages', value: String(profile?.total_messages ?? 0), inline: true },
      { name: '⚡ Commands', value: String(profile?.total_commands ?? 0), inline: true },
      { name: '🎮 Fun Cmds', value: String(profile?.total_entertainment ?? 0), inline: true },
      { name: '💰 Money', value: String(profile?.money ?? 0), inline: true },
      { name: '⭐ Level', value: String(profile?.level ?? 0), inline: true },
      { name: '🏆 XP', value: String(profile?.xp ?? 0), inline: true },
      { name: '🛠️ Last Work', value: formatTimestamp(profile?.last_work, 'R', 'Never'), inline: true },
    );
    embed.addFields({ name: '\u200B', value: '━━━━━━━━━━━━━━', inline: false });

    // Moderation Section
    embed.addFields(
      { name: '🚫 Bans', value: String(profile?.total_bans ?? 0), inline: true },
      { name: '👢 Kicks', value: String(profile?.total_kicks ?? 0), inline: true },
      { name: '⚠️ Warns', value: String(profile?.total_warns ?? 0), inline: true },
      { name: '🔇 Mutes', value: String(profile?.total_mutes ?? 0), inline: true },
      { name: '🧹 Purges', value: String(profile?.total_purges ?? 0), inline: true },
      { name: '🎫 Tickets', value: String(profile?.total_tickets ?? 0), inline: true },
      { name: '❌ Errors', value: String(profile?.total_errors ?? 0), inline: true }
    );
    embed.addFields({ name: '\u200B', value: '━━━━━━━━━━━━━━', inline: false });
    
    // Logs Section
    if (logs.length) {
      embed.addFields({ name: String('📜 Recent Logs'), value: String('\u200B') });
      logs.slice(0, 5).forEach(log => {
        // Defensive: ensure all values are valid strings for Discord.js
        const eventType = (log && typeof log.event_type === 'string') ? log.event_type : 'Unknown';
        const reason = (log && typeof log.reason === 'string') ? log.reason : (log && log.reason != null ? String(log.reason) : 'No reason');
        const warnedBy = (log && log.warned_by != null) ? String(log.warned_by) : (log && log.user_id != null ? String(log.user_id) : 'N/A');
        const channelId = (log && log.channel_id != null) ? String(log.channel_id) : 'N/A';
        let logDate = 'Unknown';
        if (log && log.date != null && !isNaN(Number(log.date)) && Number(log.date) > 0) {
          logDate = formatTimestamp(Number(log.date), 'F', 'Unknown');
        }
        embed.addFields({
          name: String(`• ${eventType} — ${reason}`),
          value: String(`By: <@${warnedBy}> in <#${channelId}>\n${logDate}`),
          inline: false
        });
      });
      if (logs.length > 5) embed.addFields({ name: String('...'), value: String(`And ${logs.length - 5} more...`) });
    }

    // Log lookup command usage
    await appendUserLog('logs', interaction.user.id, interaction.guild.id, {
      event_type: 'LOOKUP',
      reason: 'Used lookup command',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    });

    // Reply
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
