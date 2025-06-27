// Example entertainment command: meme.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const https = require('https');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Veletlen mem kuldese  '),
  async execute(interaction) {
    // Fetch meme from API
    https.get('https://meme-api.com/gimme', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const meme = JSON.parse(data);
          const memeUrl = meme.url || 'https://i.imgur.com/8b7evkP.jpeg';
          const embed = new EmbedBuilder()
            .setTitle(meme.title || 'Véletlen mém')
            .setImage(memeUrl)
            .setURL(meme.postLink || memeUrl)
            .setColor('Random')
            .setFooter({ text: '⛏️ by Laci 🛠️' })
            .setTimestamp();
          await interaction.reply({ embeds: [embed] });
          
          // Log meme command usage
          await appendUserLog('logs', interaction.user.id, interaction.guild.id, {
            event_type: 'ENTERTAINMENT',
            reason: 'Meme command used',
            warned_by: interaction.user.id,
            channel_id: interaction.channel.id,
            message_id: interaction.id,
            message_content: meme.title || null,
            date: Date.now()
          }, interaction.user.username);
        } catch (e) {
          await interaction.reply({ content: 'Failed to fetch meme.', flags: 64 });
        }
      });
    }).on('error', async () => {
      await interaction.reply({ content: 'Failed to fetch meme.', flags: 64 });
    });
  },
};
