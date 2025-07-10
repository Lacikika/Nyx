const { Events } = require('discord.js');
const { appendUserLog } = require('../../utils/jsondb');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.PresenceUpdate,
  async execute(oldPresence, newPresence) {
    if (!newPresence || !newPresence.userId) return;
    const log = {
      event_type: 'PRESENCE_UPDATE',
      userId: newPresence.userId,
      guildId: newPresence.guild.id,
      oldStatus: oldPresence?.status,
      newStatus: newPresence.status,
      date: Date.now()
    };
    await appendUserLog('logs', newPresence.userId, newPresence.guild.id, log);
    logger.event('PRESENCE UPDATE', log);
  }
};
