const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.GuildCreate,
  execute: async (client, guild) => {
    logger.info(`Guild created: ${guild.name}`);
    logger.event('GUILD_CREATE', {
      guildId: guild.id,
      guildName: guild.name,
    });
  }
};