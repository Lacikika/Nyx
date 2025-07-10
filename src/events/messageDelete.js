const { Events } = require('discord.js');
const { appendUserLog } = require('../../utils/jsondb');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.MessageDelete,
  async execute(message) {
    if (!message.guild || message.partial) return;
    if (message.author?.bot) return; // Ignore bot messages
    const log = {
      event_type: 'MESSAGE_DELETE',
      userId: message.author?.id,
      guildId: message.guild.id,
      content: message.content,
      channel_id: message.channel.id,
      message_id: message.id,
      date: Date.now()
    };
    await appendUserLog('logs', message.author?.id, message.guild.id, log, message.author?.username);
    logger.event('MESSAGE DELETE', log);
  }
};
