// commands/utility/gamble.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readUser, writeUser } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gamble')
    .setDescription('Gamble your coins for a chance to win big!')
    .addIntegerOption(option =>
      option.setName('amount').setDescription('Amount to gamble').setRequired(true)),
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    if (amount <= 0) return interaction.reply({ content: 'Enter a valid amount.', flags: 64 });
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const profile = await readUser('profiles', userId, guildId);
    const money = profile.money || 0;
    if (money < amount) return interaction.reply({ content: 'Not enough coins.', flags: 64 });
    // 50% win chance, double or nothing
    const win = Math.random() < 0.5;
    let result, color;
    if (win) {
      profile.money = money + amount;
      result = `You won ${amount} coins!`;
      color = 'Green';
    } else {
      profile.money = money - amount;
      result = `You lost ${amount} coins.`;
      color = 'Red';
    }
    await writeUser('profiles', userId, guildId, profile);
    const embed = new EmbedBuilder()
      .setTitle('Gamble Result')
      .setDescription(result)
      .setColor(color);
    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};
