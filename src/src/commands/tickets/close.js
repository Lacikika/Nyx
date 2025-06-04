// Ticket close command
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close your ticket'),
  async execute(interaction) {
    const channel = interaction.channel;
    if (!channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
    }
    await channel.delete();
  },
};
