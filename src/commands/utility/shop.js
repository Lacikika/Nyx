// commands/utility/shop.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

const shopItems = [
  { name: 'Cool Role', price: 5000, description: 'A special role on the server.' },
  { name: 'VIP', price: 100000, description: 'VIP status and perks.' },
  { name: 'Custom Color', price: 7500, description: 'Change your name color. After purchase, you will be DMed to choose your color.' },
  { name: 'Gamble Ticket', price: 1000, description: 'Try your luck in /gamble.' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('View and buy items from the shop'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🛒 Server Shop')
      .setDescription('Buy cool items and perks!')
      .setColor(0x57F287)
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/263/263142.png')
      .addFields(
        { name: 'Items', value: shopItems.map((item, i) => `**${i+1}. ${item.name}** — ${item.price} coins\n${item.description}`).join('\n\n') }
      )
      .setFooter({ text: 'Use /buy <item number> to purchase!' })
      .setTimestamp();
    // Log shop view to user log
    await appendUserLog('logs', interaction.user.id, interaction.guild.id, {
      event_type: 'SHOP',
      reason: 'Viewed shop',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    }, interaction.user.username);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
