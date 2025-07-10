const { Events } = require('discord.js');
const { appendUserLog } = require('../../utils/jsondb');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    // Role changes
    const oldRoles = oldMember.roles.cache.map(r => r.id);
    const newRoles = newMember.roles.cache.map(r => r.id);
    const added = newRoles.filter(r => !oldRoles.includes(r));
    const removed = oldRoles.filter(r => !newRoles.includes(r));
    if (added.length || removed.length) {
      const log = {
        event_type: 'ROLE_UPDATE',
        userId: newMember.id,
        guildId: newMember.guild.id,
        added,
        removed,
        date: Date.now()
      };
      await appendUserLog('logs', newMember.id, newMember.guild.id, log, newMember.user.username);
      logger.event('ROLE UPDATE', log);
    }
  }
};
