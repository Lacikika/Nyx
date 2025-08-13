const { Events } = require('discord.js');
const { appendGuildLog } = require('../../utils/jsondb');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.ChannelCreate,
  async execute(channel) {
    const log = {
      event_type: 'CHANNEL_CREATE',
      channel_id: channel.id,
      guildId: channel.guild?.id,
      name: channel.name,
      type: channel.type,
      date: Date.now()
    };
    if (channel.guild) await appendGuildLog(channel.guild.id, log);
    logger.event('CHANNEL CREATE', log);
  }
};
