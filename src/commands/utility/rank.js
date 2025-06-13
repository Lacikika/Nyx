// commands/utility/rank.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRank, xpForLevel } = require('../../../utils/rank');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('🏴‍☠️ Nézd meg a saját XP-d és szinted!')
    .addUserOption(option =>
      option.setName('user').setDescription('User to check').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const { xp, level } = await getRank(user.id, interaction.guild.id);
    const nextLevelXp = xpForLevel(level + 1);
    const embed = new EmbedBuilder()
      .setTitle('🏴‍☠️📈 Rangod')
      .setDescription(`🏴‍☠️ **${user.username}** szintje és XP-je:

> **Szint:** ${level}  |  **XP:** ${xp} / ${nextLevelXp}

${level === 0 ? '⚓ Kezdd el az utad a chatben, hogy szintet lépj!' : '⛵ Tartsd a tempót, hogy magasabb szintet érj el!'}
`)
      .setColor(0xFFD700)
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/1828/1828884.png')
      .setFooter({ text: '🏴‍☠️ Aktívabb chat = magasabb szint! | Nyx RP Bot', iconURL: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' })
      .setTimestamp();
    // Log rank command usage
    await appendUserLog('logs', interaction.user.id, interaction.guild.id, {
      event_type: 'RANK',
      reason: 'Viewed rank',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    }, interaction.user.username);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
