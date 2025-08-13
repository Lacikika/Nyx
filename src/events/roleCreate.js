const { Events } = require('discord.js');
const { appendGuildLog } = require('../../utils/jsondb');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.RoleCreate,
  async execute(role) {
    const log = {
      event_type: 'ROLE_CREATE',
      roleId: role.id,
      name: role.name,
      guildId: role.guild.id,
      date: Date.now()
    };
    await appendGuildLog(role.guild.id, log);
    logger.event('ROLE CREATE', log);
  }
};
