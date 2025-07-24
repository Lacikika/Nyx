const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.GuildMemberRemove,
  execute: async (client, member) => {
    logger.info(`Member left: ${member.user.tag}`);
    logger.event('GUILD_MEMBER_REMOVE', {
      userId: member.user.id,
      guildId: member.guild.id,
      username: member.user.username,
      discriminator: member.user.discriminator,
    });
  }
};