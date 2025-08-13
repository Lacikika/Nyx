const { Events } = require('discord.js');
const { appendGuildLog } = require('../../utils/jsondb');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.GuildBanRemove,
  async execute(ban) {
    const log = {
      event_type: 'BAN_REMOVE',
      userId: ban.user.id,
      username: ban.user.username,
      guildId: ban.guild.id,
      date: Date.now()
    };
    await appendGuildLog(ban.guild.id, log);
    logger.event('BAN REMOVE', log);
  }
};
