// Example entertainment command: meme.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Sends a random meme'),
  async execute(interaction) {
    // Placeholder meme URL
    const memeUrl = 'https://i.imgur.com/8b7evkP.jpeg';
    // Log meme command usage
    await pool.query('INSERT INTO warnings (user_id, guild_id, reason, warned_by, date) VALUES ($1, $2, $3, $4, NOW())', [interaction.user.id, interaction.guild.id, 'Meme command used', interaction.user.id]);
    const embed = new EmbedBuilder()
      .setTitle('Random Meme')
      .setImage(memeUrl)
      .setColor('Random');
    await interaction.reply({ embeds: [embed] });
  },
};
