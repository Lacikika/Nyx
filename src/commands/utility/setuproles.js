// commands/utility/setuproles.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setuproles')
    .setDescription('Set up the role system for color and VIP roles (admin only)'),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need Administrator permission.', ephemeral: true });
    }
    const guild = interaction.guild;
    // Create a category for color roles if not exists
    let colorCategory = guild.channels.cache.find(c => c.name === 'Color Roles' && c.type === 4);
    if (!colorCategory) {
      colorCategory = await guild.channels.create({ name: 'Color Roles', type: 4 });
    }
    // Create a base VIP role if not exists
    let vipRole = guild.roles.cache.find(r => r.name === 'VIP');
    if (!vipRole) {
      vipRole = await guild.roles.create({ name: 'VIP', color: 'Gold', mentionable: true });
    }
    // Create a base Color role if not exists
    let colorBase = guild.roles.cache.find(r => r.name === 'Color Base');
    if (!colorBase) {
      colorBase = await guild.roles.create({ name: 'Color Base', color: 'Grey', mentionable: false });
    }
    const embed = new EmbedBuilder()
      .setTitle('Role System Setup')
      .setDescription('Color and VIP roles have been set up!')
      .addFields(
        { name: 'Color Category', value: colorCategory ? colorCategory.name : 'Not created', inline: true },
        { name: 'VIP Role', value: vipRole ? `<@&${vipRole.id}>` : 'Not created', inline: true },
        { name: 'Color Base Role', value: colorBase ? `<@&${colorBase.id}>` : 'Not created', inline: true }
      )
      .setColor('Aqua')
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
