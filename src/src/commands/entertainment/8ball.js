// Entertainment: 8ball.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const responses = [
  'Yes.', 'No.', 'Maybe.', 'Ask again later.', 'Definitely!', 'I don\'t think so.', 'Absolutely!', 'Not sure.'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8ball a question')
    .addStringOption(option =>
      option.setName('question').setDescription('Your question').setRequired(true)),
  async execute(interaction) {
    const question = interaction.options.getString('question');
    const response = responses[Math.floor(Math.random() * responses.length)];
    // Log 8ball command usage
    await pool.query('INSERT INTO warnings (user_id, guild_id, reason, warned_by, date) VALUES ($1, $2, $3, $4, NOW())', [interaction.user.id, interaction.guild.id, `8ball: ${question}`, interaction.user.id]);
    const embed = new EmbedBuilder()
      .setTitle('🎱 Magic 8ball')
      .addFields(
        { name: 'Question', value: question },
        { name: 'Answer', value: response }
      )
      .setColor('Random');
    await interaction.reply({ embeds: [embed] });
  },
};
