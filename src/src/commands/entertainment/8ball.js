// Entertainment: 8ball.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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
    try {
      const question = interaction.options.getString('question');
      const response = responses[Math.floor(Math.random() * responses.length)];
      const embed = new EmbedBuilder()
        .setTitle('🎱 Magic 8ball')
        .addFields(
          { name: 'Question', value: question },
          { name: 'Answer', value: response }
        )
        .setColor('Random');
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      await interaction.reply({ content: 'There was an error executing this command. ' + (err.message || err), ephemeral: true });
    }
  },
};
