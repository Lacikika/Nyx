const { Events } = require('discord.js');
const { appendLog } = require('../../utils/mysql');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const logData = {
      guildId: member.guild.id,
      userId: member.id,
      type: 'MEMBER_LEAVE',
      reason: `${member.user.tag} left the server.`,
    };
    await appendLog(logData);
    logger.event('MEMBER LEAVE', logData);
  }
};
