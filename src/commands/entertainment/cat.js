/**
 * @fileoverview Cat command.
 * @module commands/entertainment/cat
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const t = require('../../../utils/locale');

module.exports = {
  cooldown: 5,
  /**
   * @param {import('discord.js').CommandInteraction} interaction
   */
  data: new SlashCommandBuilder()
    .setName('cat')
    .setDescription(t('cat_description')),
  async execute(interaction) {
    try {
      const response = await fetch('https://api.thecatapi.com/v1/images/search');
      const [cat] = await response.json();

      const embed = new EmbedBuilder()
        .setTitle(t('cat_embed_title'))
        .setImage(cat.url)
        .setColor('Random')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ content: 'Failed to fetch a cat picture. Please try again later.', ephemeral: true });
    }
  },
};
