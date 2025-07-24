const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.ChannelDelete,
  execute: async (client, channel) => {
    logger.info(`Channel deleted: ${channel.name}`);
    logger.event('CHANNEL_DELETE', {
      channelId: channel.id,
      channelName: channel.name,
      guildId: channel.guild.id,
    });
  }
};