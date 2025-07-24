const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.RoleDelete,
  execute: async (client, role) => {
    logger.info(`Role deleted: ${role.name}`);
    logger.event('ROLE_DELETE', {
      roleId: role.id,
      roleName: role.name,
      guildId: role.guild.id,
    });
  }
};