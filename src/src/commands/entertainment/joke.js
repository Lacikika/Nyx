// Entertainment: joke.js
const { SlashCommandBuilder } = require('discord.js');

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
    await interaction.reply({ content: joke });
  },
};
