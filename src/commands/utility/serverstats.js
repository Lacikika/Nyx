// Utility: serverstats.js
const { SlashCommandBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('Get detailed server statistics'),
  async execute(interaction) {
    const { guild } = interaction;
    // Log serverstats command usage
    await appendUserLog('logs', interaction.user.id, interaction.guild.id, {
      event_type: 'SERVERSTATS',
      reason: 'Viewed server stats',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    }, interaction.user.username);
    const embed = new EmbedBuilder()
      .setTitle('📊 Server Stats')
      .setDescription('Here are the current server statistics:')
      .setColor(0x5865F2)
      .setThumbnail(interaction.guild.iconURL())
      .addFields(
        { name: 'Server', value: guild.name, inline: true },
        { name: 'Members', value: guild.memberCount.toString(), inline: true },
        { name: 'Created', value: guild.createdAt.toDateString(), inline: true }
      )
      .setFooter({ text: 'Stay active and have fun!' })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
