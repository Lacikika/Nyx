// Utility: serverstats.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('Get detailed server statistics'),
  async execute(interaction) {
    const { guild } = interaction;
    await interaction.reply({
      content: `Server: ${guild.name}\nMembers: ${guild.memberCount}\nCreated: ${guild.createdAt.toDateString()}`,
      ephemeral: true,
    });
  },
};
