const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.GuildMemberAdd,
  execute: async (client, member) => {
    logger.info(`Member joined: ${member.user.tag}`);
    logger.event('GUILD_MEMBER_ADD', {
      userId: member.user.id,
      guildId: member.guild.id,
      username: member.user.username,
      discriminator: member.user.discriminator,
    });
  }
};