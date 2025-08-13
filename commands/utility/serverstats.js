// Utility: serverstats.js
const { SlashCommandBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('🏴‍☠️ Szerver statisztikák megtekintése'),
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
      .setTitle('🏴‍☠️📊 Szerver statisztikák')
      .setDescription('🏴‍☠️ Itt láthatod a szerver jelenlegi statisztikáit:')
      .setColor(0x5865F2)
      .setThumbnail(interaction.guild.iconURL())
      .addFields(
        { name: 'Szerver', value: guild.name, inline: true },
        { name: 'Tagok', value: guild.memberCount.toString(), inline: true },
        { name: 'Létrehozva', value: guild.createdAt.toLocaleDateString('hu-HU'), inline: true }
      )
      .setFooter({ text: '🏴‍☠️ Maradj aktív és érezd jól magad!' })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
