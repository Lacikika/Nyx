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
    });
    await interaction.reply({
      content: `Server: ${guild.name}\nMembers: ${guild.memberCount}\nCreated: ${guild.createdAt.toDateString()}`,
      ephemeral: true,
    });
  },
};
