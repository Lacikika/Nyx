/**
 * @fileoverview Play command.
 * @module commands/music/play
 */

const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const t = require('../../../utils/locale');

module.exports = {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription(t('play_description'))
    .addStringOption(option =>
      option.setName('url')
        .setDescription(t('play_url_description'))
        .setRequired(true)),
  async execute(interaction) {
    const url = interaction.options.getString('url');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: t('not_in_voice_channel'), ephemeral: true });
    }

    if (!ytdl.validateURL(url)) {
      return interaction.reply({ content: t('invalid_youtube_url'), ephemeral: true });
    }

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      const stream = ytdl(url, { filter: 'audioonly' });
      const resource = createAudioResource(stream);
      const player = createAudioPlayer();

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

      await interaction.reply({ content: `${t('now_playing')} ${url}` });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: t('play_error'), ephemeral: true });
    }
  },
};
