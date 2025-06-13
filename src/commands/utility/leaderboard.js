// commands/utility/leaderboard.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../../utils/rank');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏴‍☠️ Show the XP leaderboard for this server'),
  async execute(interaction) {
    const top = await getLeaderboard(interaction.guild.id, 10);
    let desc = top.map((u, i) => `**${i+1}. <@${u.user_id}>** — Szint ${u.level} (${u.xp} XP)`).join('\n');
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
    await appendUserLog('logs', interaction.user.id, interaction.guild.id, {
      event_type: 'LEADERBOARD',
      reason: 'Viewed leaderboard',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    }, interaction.user.username);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
