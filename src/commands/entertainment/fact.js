/**
 * @fileoverview Fact command.
 * @module commands/entertainment/fact
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
    .setName('fact')
    .setDescription(t('fact_description')),
  async execute(interaction) {
    try {
      const response = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
      const fact = await response.json();

      const embed = new EmbedBuilder()
        .setTitle(t('fact_embed_title'))
        .setDescription(fact.text)
        .setColor('Random')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ content: 'Failed to fetch a fact. Please try again later.', ephemeral: true });
    }
  },
};
