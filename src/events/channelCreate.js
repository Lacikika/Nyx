const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.ChannelCreate,
  execute: async (client, channel) => {
    logger.info(`Channel created: ${channel.name}`);
    logger.event('CHANNEL_CREATE', {
      channelId: channel.id,
      channelName: channel.name,
      guildId: channel.guild.id,
    });
  }
};