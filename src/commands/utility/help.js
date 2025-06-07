// Utility: help.js
const { SlashCommandBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all commands'),
  async execute(interaction) {
    const commands = interaction.client.commands.map(cmd => `/${cmd.data.name}: ${cmd.data.description}`).join('\n');
    // Log help command usage
    await appendUserLog('logs', interaction.user.id, interaction.guild.id, {
      event_type: 'HELP',
      reason: 'Viewed help',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    });
    await interaction.reply({ content: `Available commands:\n${commands}`, ephemeral: true });
  },
};
