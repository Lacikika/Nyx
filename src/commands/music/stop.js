/**
 * @fileoverview Stop command.
 * @module commands/music/stop
 */

const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const t = require('../../../utils/locale');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription(t('stop_description')),
  async execute(interaction) {
    const connection = getVoiceConnection(interaction.guildId);

    if (!connection) {
      return interaction.reply({ content: t('not_playing'), ephemeral: true });
    }

    connection.destroy();
    await interaction.reply({ content: t('stopped_playing') });
  },
};
