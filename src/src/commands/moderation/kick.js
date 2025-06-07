// Example moderation command: kick.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(option =>
      option.setName('target').setDescription('User to kick').setRequired(true)),
  async execute(interaction) {
    const member = interaction.options.getMember('target');
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      const embed = new EmbedBuilder()
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to kick members.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    if (!member.kickable) {
      const embed = new EmbedBuilder()
        .setTitle('Kick Failed')
        .setDescription('I cannot kick this user.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    await member.kick();
    const embed = new EmbedBuilder()
      .setTitle('User Kicked')
      .setDescription(`${member.user.tag} was kicked.`)
      .setColor('Orange');
    await interaction.reply({ embeds: [embed] });
  },
};
