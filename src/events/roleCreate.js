const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.RoleCreate,
  execute: async (client, role) => {
    logger.info(`Role created: ${role.name}`);
    logger.event('ROLE_CREATE', {
      roleId: role.id,
      roleName: role.name,
      guildId: role.guild.id,
    });
  }
};