// Entertainment: joke.js
const { SlashCommandBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');
const { EmbedBuilder } = require('discord.js');

const jokes = [
  'Why did the scarecrow win an award? Because he was outstanding in his field!',
  'Why don\'t skeletons fight each other? They don\'t have the guts.',
  'What do you call fake spaghetti? An impasta!'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Get a random joke'),
  async execute(interaction) {
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    // Log joke command usage
    await appendUserLog('logs', interaction.user.id, interaction.guild.id, {
      event_type: 'ENTERTAINMENT',
      reason: 'Joke command used',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: joke,
      date: Date.now()
    }, interaction.user.username);

    const embed = new EmbedBuilder()
      .setTitle('📝 Vicc')
      .setDescription(joke)
      .setColor('Random')
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/616/616489.png')
      .setFooter({ text: '⛏️ by Laci 🛠️' })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
