const { Events } = require('discord.js');
const { appendUserLog } = require('../../utils/jsondb');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.MessageUpdate,
  async execute(oldMsg, newMsg) {
    if (!newMsg.guild || newMsg.partial) return;
    if (oldMsg.content === newMsg.content) return;
    if (newMsg.author?.bot) return; // Ignore bot messages
    const log = {
      event_type: 'MESSAGE_EDIT',
      userId: newMsg.author?.id,
      guildId: newMsg.guild.id,
      oldContent: oldMsg.content,
      newContent: newMsg.content,
      channel_id: newMsg.channel.id,
      message_id: newMsg.id,
      date: Date.now()
    };
    await appendUserLog('logs', newMsg.author?.id, newMsg.guild.id, log, newMsg.author?.username);
    logger.event('MESSAGE EDIT', log);
  }
};
