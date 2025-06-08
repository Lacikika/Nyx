// commands/utility/buy.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

const shopItems = [
  { name: 'Cool Role', price: 5000 },
  { name: 'VIP', price: 100000 },
  { name: 'Custom Color', price: 7500 },
  { name: 'Gamble Ticket', price: 1000 }
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
    }, interaction.user.username);
    // Grant item (role, color, etc.)
    if (item.name === 'VIP') {
      // Assign VIP role if it exists, else create it
      const guild = await interaction.client.guilds.fetch(guildId);
      let vipRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'vip');
      if (!vipRole) {
        vipRole = await guild.roles.create({ name: 'VIP', color: 'Gold', mentionable: true });
      }
      const member = await guild.members.fetch(userId);
      await member.roles.add(vipRole);
      await interaction.user.send('You have been given the VIP role! Enjoy your perks!');
    }
    if (item.name === 'Cool Role') {
      try {
        const dm = await interaction.user.createDM();
        await dm.send('You bought a Cool Role! Reply with the name you want for your new role (max 32 characters). You have 2 minutes.');
        const filter = m => m.author.id === interaction.user.id;
        const collector = dm.createMessageCollector({ filter, time: 120000, max: 1 });
        collector.on('collect', async msg => {
          let roleName = msg.content.trim().slice(0, 32);
          const guild = await interaction.client.guilds.fetch(guildId);
          // Create the custom role
          let role = await guild.roles.create({
            name: roleName,
            color: 'Random',
            mentionable: false,
            reason: 'Cool Role Purchase'
          });
          const member = await guild.members.fetch(userId);
          await member.roles.add(role);
          await msg.reply(`Your custom role "${roleName}" has been created and assigned! (${role})`);
        });
        collector.on('end', (collected) => {
          if (collected.size === 0) {
            dm.send('You did not reply in time. Please contact an admin if you still want your custom role.');
          }
        });
      } catch (e) {
        await interaction.user.send('Failed to DM you for role name selection. Please check your privacy settings.');
      }
    }
    if (item.name === 'Custom Color') {
      try {
        await interaction.user.send({
          content: 'You bought a Custom Color! Reply with a HEX color code (e.g. #ff0000) or a common color name (e.g. red) to set your new color. You have 2 minutes.'
        });
        const dmCollector = interaction.user.dmChannel.createMessageCollector({ time: 120000, max: 1 });
        dmCollector.on('collect', async msg => {
          let color = msg.content.trim();
          if (!color.startsWith('#') && !/^([a-zA-Z]+)$/.test(color)) {
            await msg.reply('Invalid color. Please provide a HEX code (e.g. #ff0000) or a color name.');
            return;
          }
          // Create color role in the server
          const guild = await interaction.client.guilds.fetch(guildId);
          let role = await guild.roles.create({
            name: `${interaction.user.username}'s Color`,
            color: color,
            mentionable: false,
            reason: 'Custom Color Purchase'
          });
          // Remove previous color roles from user
          const member = await guild.members.fetch(userId);
          const colorRoles = guild.roles.cache.filter(r => r.name.endsWith("'s Color") && member.roles.cache.has(r.id));
          for (const r of colorRoles.values()) {
            await member.roles.remove(r);
            await r.delete().catch(() => {});
          }
          await member.roles.add(role);
          await msg.reply(`Your color role has been created and assigned! (${role})`);
        });
      } catch (e) {
        await interaction.user.send('Failed to DM you for color selection. Please check your privacy settings.');
      }
    }
    await writeUser('profiles', userId, guildId, profile);
    const embed = new EmbedBuilder()
      .setTitle('🛒 Purchase Successful!')
      .setDescription(`You bought **${item.name}** for ${item.price} coins! 🎉`)
      .setColor('Green')
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/263/263142.png')
      .setFooter({ text: 'Enjoy your new item!' })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
