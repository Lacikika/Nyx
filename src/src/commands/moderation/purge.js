// Purge command
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a number of messages from a channel')
    .addIntegerOption(option =>
      option.setName('amount').setDescription('Number of messages to delete').setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      const embed = new EmbedBuilder()
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to manage messages.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    const amount = interaction.options.getInteger('amount');
    if (amount < 1 || amount > 100) {
      const embed = new EmbedBuilder()
        .setTitle('Invalid Amount')
        .setDescription('You need to input a number between 1 and 100.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    await interaction.channel.bulkDelete(amount, true);
    const embed = new EmbedBuilder()
      .setTitle('Messages Purged')
      .setDescription(`Deleted ${amount} messages.`)
      .setColor('Orange');
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
