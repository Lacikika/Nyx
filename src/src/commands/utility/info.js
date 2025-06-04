// Example utility command: info.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Get server info'),
  async execute(interaction) {
    const { guild } = interaction;
    await interaction.reply({
      content: `Server name: ${guild.name}\nTotal members: ${guild.memberCount}`,
      ephemeral: true,
    });
  },
};
