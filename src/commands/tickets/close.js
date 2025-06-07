// Ticket close command
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close your ticket'),
  async execute(interaction) {
    const channel = interaction.channel;
    if (!channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
    }
    // Log ticket close to user log
    await appendUserLog('logs', interaction.user.id, interaction.guild.id, {
      event_type: 'TICKET',
      reason: 'Closed a ticket',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    });
    await channel.delete();
  },
};
