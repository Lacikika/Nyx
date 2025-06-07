// commands/utility/work.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readUser, writeUser } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work to earn coins (cooldown: 1 minute)'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    // Simple cooldown (1 min)
    const profile = await readUser('profiles', userId, guildId);
    const now = Date.now();
    const lastWork = profile.last_work || 0;
    if (now - lastWork < 60000) {
      return interaction.reply({ content: 'You must wait before working again!', flags: 64 });
    }
    const earned = Math.floor(Math.random() * 101) + 50; // 50-150 coins
    profile.money = (profile.money || 0) + earned;
    profile.last_work = now;
    await writeUser('profiles', userId, guildId, profile);
    const embed = new EmbedBuilder()
      .setTitle('Work Complete')
      .setDescription(`You earned ${earned} coins!`)
      .setColor('Aqua');
    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};
