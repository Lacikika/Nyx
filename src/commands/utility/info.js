// Example utility command: info.js
const { SlashCommandBuilder } = require('discord.js');
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
    });
    await interaction.reply({
      content: `Server name: ${guild.name}\nTotal members: ${guild.memberCount}`,
      ephemeral: true,
    });
  },
};
