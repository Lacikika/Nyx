// commands/utility/shop.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const shopItems = [
  { name: 'Cool Role', price: 500, description: 'A special role on the server.' },
  { name: 'VIP', price: 1000, description: 'VIP status and perks.' },
  { name: 'Custom Color', price: 750, description: 'Change your name color.' },
  { name: 'Gamble Ticket', price: 100, description: 'Try your luck in /gamble.' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('View and buy items from the shop'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🛒 Server Shop')
      .setDescription(shopItems.map((item, i) => `**${i+1}. ${item.name}** — ${item.price} coins\n${item.description}`).join('\n\n'))
      .setColor('Green');
    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};
