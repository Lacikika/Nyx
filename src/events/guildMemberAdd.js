const { Events } = require('discord.js');
const { appendLog } = require('../../utils/mysql');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const logData = {
      guildId: member.guild.id,
      userId: member.id,
      type: 'MEMBER_JOIN',
      reason: `${member.user.tag} joined the server.`,
    };
    await appendLog(logData);
    logger.event('MEMBER JOIN', logData);
  }
};
