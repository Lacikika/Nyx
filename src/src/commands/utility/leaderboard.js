// commands/utility/leaderboard.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../../utils/rank');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the XP leaderboard for this server'),
  async execute(interaction) {
    const top = await getLeaderboard(interaction.guild.id, 10);
    let desc = top.map((u, i) => `**${i+1}. <@${u.user_id}>** — Level ${u.level} (${u.xp} XP)`).join('\n');
    if (!desc) desc = 'No users with XP yet!';
    const embed = new EmbedBuilder()
      .setTitle('Server Leaderboard')
      .setDescription(desc)
      .setColor('Aqua');
    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};
