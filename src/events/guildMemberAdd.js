const { Events } = require('discord.js');
const { appendUserLog } = require('../../utils/jsondb');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const log = {
      event_type: 'MEMBER_JOIN',
      userId: member.id,
      guildId: member.guild.id,
      username: member.user.username,
      date: Date.now()
    };
    await appendUserLog('logs', member.id, member.guild.id, log, member.user.username);
    logger.event('MEMBER JOIN', log);
  }
};
