// Purge command
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a number of messages from a channel')
    .addIntegerOption(option =>
      option.setName('amount').setDescription('Number of messages to delete').setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      const embed = new EmbedBuilder()
        .setTitle('Nincs jogosultság')
        .setDescription('Ehhez a parancshoz Manage Messages vagy Admin jogosultság szükséges.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
    const amount = interaction.options.getInteger('amount');
    if (!amount || amount < 1 || amount > 100) {
      return interaction.reply({ content: 'Adj meg egy számot 1 és 100 között!', ephemeral: true });
    }
    await interaction.channel.bulkDelete(amount, true);
    const embed = new EmbedBuilder()
      .setTitle('Üzenetek törölve')
      .setDescription(`${amount} üzenet törölve ebben a csatornában.`)
      .setColor('Orange')
      .setFooter({ text: '⛏️ by Laci 🛠️' });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
