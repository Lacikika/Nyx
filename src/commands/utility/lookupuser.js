// Utility: lookupuser.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readGlobalUserLogs } = require('../../../utils/jsondb.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lookupuser')
    .setDescription('🔎 View all moderation and event logs for a user (global)')
    .addUserOption(option =>
      option.setName('target').setDescription('User to lookup').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('target');
    const logs = await readGlobalUserLogs(user.id);
    if (!logs.length) {
      return interaction.reply({ content: 'No logs found for this user.', ephemeral: true });
    }
    let page = 0;
    const pageSize = 5;
    const getPageEmbed = (page) => {
      const embed = new EmbedBuilder()
        .setTitle(`🔎 Global Logs: ${user.tag}`)
        .setDescription(`All logs for this user across all servers:`)
        .setColor(0x3498db)
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: `Page ${page + 1} / ${Math.ceil(logs.length / pageSize)}` })
        .setTimestamp();
      const slice = logs.slice(page * pageSize, (page + 1) * pageSize);
      slice.forEach((log, i) => {
        embed.addFields({
          name: `• ${log.event_type || log.action || 'Unknown'} — ${log.reason || log.message_content || 'No reason'}`,
          value: `Guild: ${log.guildId || 'Unknown'} | Channel: <#${log.channel_id || 'N/A'}>\n${log.timestamp || log.date || 'Unknown'}`,
          inline: false
        });
      });
      return embed;
    };
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev').setLabel('Previous').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Secondary)
    );
    const reply = await interaction.reply({ embeds: [getPageEmbed(page)], components: [row], ephemeral: true });
    const collector = reply.createMessageComponentCollector({ time: 60000 });
    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) return i.reply({ content: 'Not your session.', ephemeral: true });
      if (i.customId === 'prev' && page > 0) page--;
      if (i.customId === 'next' && (page + 1) * pageSize < logs.length) page++;
      await i.update({ embeds: [getPageEmbed(page)], components: [row] });
    });
    collector.on('end', () => {
      reply.edit({ components: [] }).catch(() => {});
    });
  },
};
