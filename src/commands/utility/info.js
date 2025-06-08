// Example utility command: info.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Get server info'),
  async execute(interaction) {
    const { guild } = interaction;
    // Log info command usage
    await appendUserLog('logs', interaction.user.id, interaction.guild.id, {
      event_type: 'INFO',
      reason: 'Viewed info',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    }, interaction.user.username);
    
    const embed = new EmbedBuilder()
      .setTitle('ℹ️ Server Info')
      .setDescription('Basic information about this server:')
      .setColor(0x5865F2)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: 'Server Name', value: guild.name, inline: true },
        { name: 'Total Members', value: guild.memberCount.toString(), inline: true }
      )
      .setFooter({ text: 'Use /serverstats for more details!' })
      .setTimestamp();
      
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
