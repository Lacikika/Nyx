// Entertainment: 8ball.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');
const t = require('../../../utils/locale');

const responses = [
  'Yes.', 'No.', 'Maybe.', 'Ask again later.', 'Definitely!', 'I don\'t think so.', 'Absolutely!', 'Not sure.'
];

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription(t('8ball_description'))
    .addStringOption(option =>
      option.setName('question').setDescription(t('8ball_question_description')).setRequired(true)),
  async execute(interaction) {
    try {
      const question = interaction.options.getString('question');
      const response = responses[Math.floor(Math.random() * responses.length)];
      const embed = new EmbedBuilder()
        .setTitle(t('8ball_embed_title'))
        .addFields(
          { name: t('8ball_embed_question_field'), value: question },
          { name: t('8ball_embed_answer_field'), value: response }
        )
        .setColor('Random')
        .setThumbnail('https://cdn-icons-png.flaticon.com/512/616/616494.png')
        .setFooter({ text: '⛏️ by Laci 🛠️' })
        .setTimestamp();
      // Log 8ball command usage
      await appendUserLog('logs', interaction.user.id, interaction.guild.id, {
        event_type: 'ENTERTAINMENT',
        reason: `8ball: ${question}`,
        warned_by: interaction.user.id,
        channel_id: interaction.channel.id,
        message_id: interaction.id,
        message_content: question,
        date: Date.now()
      }, interaction.user.username);
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      await interaction.reply({ content: 'There was an error executing this command. ' + (err.message || err), ephemeral: true });
    }
  },
};
