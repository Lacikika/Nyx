// commands/utility/leaderboard.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../../utils/rank');
const { appendLog } = require('../../../utils/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏴‍☠️ Show the XP leaderboard for this server'),
  async execute(interaction) {
    const top = await getLeaderboard(interaction.guild.id, 10);
    let desc = top.map((u, i) => `**${i+1}. <@${u.userId}>** — Szint ${u.level} (${u.xp} XP)`).join('\n');
    if (!desc) desc = 'Még nincs felhasználó XP-vel!';
    const embed = new EmbedBuilder()
      .setTitle('🏴‍☠️🏆 Szerver ranglista')
      .setDescription('🏴‍☠️ A szerver legaktívabb tagjai XP alapján!')
      .setColor(0xFFD700)
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/1828/1828884.png')
      .addFields(
        { name: 'Ranglista', value: desc }
      )
      .setFooter({ text: '🏴‍☠️ Csevegj sokat, hogy feljebb kerülj a ranglistán!' })
      .setTimestamp();
    // Log leaderboard command usage
    await appendLog({
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        type: 'LEADERBOARD',
        moderatorId: interaction.user.id,
        reason: `Leaderboard viewed by ${interaction.user.tag}`,
    });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
