const { Events } = require('discord.js');
const { appendUserLog } = require('../../utils/jsondb');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const log = {
      event_type: 'MEMBER_LEAVE',
      userId: member.id,
      guildId: member.guild.id,
      username: member.user?.username,
      date: Date.now()
    };
    await appendUserLog('logs', member.id, member.guild.id, log, member.user?.username);
    logger.event('MEMBER LEAVE', log);
  }
};
