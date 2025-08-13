const { Events } = require('discord.js');
const { appendGuildLog } = require('../../utils/jsondb');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.RoleDelete,
  async execute(role) {
    const log = {
      event_type: 'ROLE_DELETE',
      roleId: role.id,
      name: role.name,
      guildId: role.guild.id,
      date: Date.now()
    };
    await appendGuildLog(role.guild.id, log);
    logger.event('ROLE DELETE', log);
  }
};
