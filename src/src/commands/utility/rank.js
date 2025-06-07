// commands/utility/rank.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRank, xpForLevel } = require('../../../utils/rank');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

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
    // Log rank command usage
    await appendUserLog('logs', interaction.user.id, interaction.guild.id, {
      event_type: 'RANK',
      reason: 'Viewed rank',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    });
    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};
