// Example entertainment command: meme.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { logUserEvent } = require('../../../utils/db'); // Adjust the path as necessary
const https = require('https');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Sends a random meme'),
  async execute(interaction) {
    // Fetch meme from API
    https.get('https://meme-api.com/gimme', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const meme = JSON.parse(data);
          const memeUrl = meme.url || 'https://i.imgur.com/8b7evkP.jpeg';
          // Log meme command usage
          await logUserEvent({
            userId: interaction.user.id,
            guildId: interaction.guild.id,
            eventType: 'ENTERTAINMENT',
            reason: 'Meme command used',
            warnedBy: interaction.user.id,
            channelId: interaction.channel.id,
            messageId: interaction.id,
            messageContent: meme.title || null,
            auditLog: null
          });
          const embed = new EmbedBuilder()
            .setTitle(meme.title || 'Random Meme')
            .setImage(memeUrl)
            .setURL(meme.postLink || memeUrl)
            .setColor('Random');
          await interaction.reply({ embeds: [embed] });
        } catch (e) {
          await interaction.reply({ content: 'Failed to fetch meme.', flags: 64 });
        }
      });
    }).on('error', async () => {
      await interaction.reply({ content: 'Failed to fetch meme.', flags: 64 });
    });
  },
};
