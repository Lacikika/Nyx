const { Events } = require('discord.js');
const { appendGuildLog } = require('../../utils/jsondb');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.GuildBanAdd,
  async execute(ban) {
    const log = {
      event_type: 'BAN_ADD',
      userId: ban.user.id,
      username: ban.user.username,
      guildId: ban.guild.id,
      date: Date.now()
    };
    await appendGuildLog(ban.guild.id, log);
    logger.event('BAN ADD', log);
  }
};
