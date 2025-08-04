/**
 * @fileoverview Dog command.
 * @module commands/entertainment/dog
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
    .setName('dog')
    .setDescription(t('dog_description')),
  async execute(interaction) {
    try {
      const response = await fetch('https://dog.ceo/api/breeds/image/random');
      const dog = await response.json();

      const embed = new EmbedBuilder()
        .setTitle(t('dog_embed_title'))
        .setImage(dog.message)
        .setColor('Random')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ content: 'Failed to fetch a dog picture. Please try again later.', ephemeral: true });
    }
  },
};
