// Entertainment: joke.js
const { SlashCommandBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

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
    });
    await interaction.reply({ content: joke });
  },
};
