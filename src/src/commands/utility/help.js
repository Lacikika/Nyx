// Utility: help.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all commands'),
  async execute(interaction) {
    const commands = interaction.client.commands.map(cmd => `/${cmd.data.name}: ${cmd.data.description}`).join('\n');
    await interaction.reply({ content: `Available commands:\n${commands}`, ephemeral: true });
  },
};
