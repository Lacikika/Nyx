// commands/utility/work.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work to earn coins (cooldown: 1 minute)'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    // Simple cooldown (1 min)
    const res = await pool.query('SELECT last_work FROM nyx.user_profiles WHERE user_id = $1 AND guild_id = $2', [userId, guildId]);
    const now = Date.now();
    const lastWork = res.rows[0]?.last_work ? new Date(res.rows[0].last_work).getTime() : 0;
    if (now - lastWork < 60000) {
      return interaction.reply({ content: 'You must wait before working again!', flags: 64 });
    }
    const earned = Math.floor(Math.random() * 101) + 50; // 50-150 coins
    await pool.query('UPDATE nyx.user_profiles SET money = COALESCE(money,0) + $1, last_work = NOW() WHERE user_id = $2 AND guild_id = $3', [earned, userId, guildId]);
    const embed = new EmbedBuilder()
      .setTitle('Work Complete')
      .setDescription(`You earned ${earned} coins!`)
      .setColor('Aqua');
    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};
