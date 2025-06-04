// commands/utility/buy.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../../../utils/db');

const shopItems = [
  { name: 'Cool Role', price: 500 },
  { name: 'VIP', price: 1000 },
  { name: 'Custom Color', price: 750 },
  { name: 'Gamble Ticket', price: 100 }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy an item from the shop')
    .addIntegerOption(option =>
      option.setName('item').setDescription('Item number from /shop').setRequired(true)),
  async execute(interaction) {
    const itemIndex = interaction.options.getInteger('item') - 1;
    if (itemIndex < 0 || itemIndex >= shopItems.length) {
      return interaction.reply({ content: 'Invalid item number.', flags: 64 });
    }
    const item = shopItems[itemIndex];
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const res = await pool.query('SELECT money FROM nyx.user_profiles WHERE user_id = $1 AND guild_id = $2', [userId, guildId]);
    const money = res.rows[0]?.money || 0;
    if (money < item.price) {
      return interaction.reply({ content: `You need ${item.price} coins to buy this item.`, flags: 64 });
    }
    await pool.query('UPDATE nyx.user_profiles SET money = money - $1 WHERE user_id = $2 AND guild_id = $3', [item.price, userId, guildId]);
    // TODO: Grant item (role, color, etc.)
    const embed = new EmbedBuilder()
      .setTitle('Purchase Successful')
      .setDescription(`You bought **${item.name}** for ${item.price} coins!`)
      .setColor('Green');
    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};
