// commands/utility/gamble.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../../../utils/db');

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
    const res = await pool.query('SELECT money FROM nyx.user_profiles WHERE user_id = $1 AND guild_id = $2', [userId, guildId]);
    const money = res.rows[0]?.money || 0;
    if (money < amount) return interaction.reply({ content: 'Not enough coins.', flags: 64 });
    // 50% win chance, double or nothing
    const win = Math.random() < 0.5;
    let result, color;
    if (win) {
      await pool.query('UPDATE nyx.user_profiles SET money = money + $1 WHERE user_id = $2 AND guild_id = $3', [amount, userId, guildId]);
      result = `You won ${amount} coins!`;
      color = 'Green';
    } else {
      await pool.query('UPDATE nyx.user_profiles SET money = money - $1 WHERE user_id = $2 AND guild_id = $3', [amount, userId, guildId]);
      result = `You lost ${amount} coins.`;
      color = 'Red';
    }
    const embed = new EmbedBuilder()
      .setTitle('Gamble Result')
      .setDescription(result)
      .setColor(color);
    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};
