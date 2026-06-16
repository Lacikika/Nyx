const botConfig = require("../../config.js");
// Purge command
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Uzenetek torlese egy csatornabol  ')
    .addIntegerOption(option =>
      option.setName('amount').setDescription('Number of messages to delete').setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      const embed = new EmbedBuilder()
        .setTitle('Nincs jogosultság')
        .setDescription('Ehhez a parancshoz Manage Messages vagy Admin jogosultság szükséges.')
        .setColor(botConfig.customization.embedColors.error);
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
    const amount = interaction.options.getInteger('amount');
    if (!amount || amount < 1 || amount > 100) {
      return interaction.reply({ content: 'Adj meg egy számot 1 és 100 között!', flags: 64 });
    }
    await interaction.channel.bulkDelete(amount, true);
    const embed = new EmbedBuilder()
      .setTitle('Üzenetek törölve')
      .setDescription(`${amount} üzenet törölve ebben a csatornában.`)
      .setColor(botConfig.customization.embedColors.moderation)
      .setFooter({ text: botConfig.customization.footer.text, iconURL: botConfig.customization.footer.iconURL || undefined });
    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};
