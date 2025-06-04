// commands/utility/rank.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRank, xpForLevel } = require('../../../utils/rank');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Show your or another user\'s rank and XP')
    .addUserOption(option =>
      option.setName('user').setDescription('User to check').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const { xp, level } = await getRank(user.id, interaction.guild.id);
    const nextLevelXp = xpForLevel(level + 1);
    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Rank`)
      .setDescription(`Level: **${level}**\nXP: **${xp}** / **${nextLevelXp}**`)
      .setColor('Gold')
      .setThumbnail(user.displayAvatarURL());
    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};
