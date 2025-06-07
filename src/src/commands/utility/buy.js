// commands/utility/buy.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

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
    const profile = await readUser('profiles', userId, guildId);
    const money = profile.money || 0;
    if (money < item.price) {
      return interaction.reply({ content: `You need ${item.price} coins to buy this item.`, flags: 64 });
    }
    profile.money = money - item.price;
    // Log buy to user log and update profile
    await appendUserLog('logs', userId, guildId, {
      event_type: 'BUY',
      reason: `Bought ${item.name} for ${item.price} coins`,
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    });
    // TODO: Grant item (role, color, etc.)
    await writeUser('profiles', userId, guildId, profile);
    const embed = new EmbedBuilder()
      .setTitle('Purchase Successful')
      .setDescription(`You bought **${item.name}** for ${item.price} coins!`)
      .setColor('Green');
    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};
