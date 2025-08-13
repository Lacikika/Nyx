const { Events } = require('discord.js');
const { appendGuildLog } = require('../../utils/jsondb');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.GuildEmojiCreate,
  async execute(emoji) {
    const log = {
      event_type: 'EMOJI_CREATE',
      emojiId: emoji.id,
      name: emoji.name,
      guildId: emoji.guild.id,
      date: Date.now()
    };
    await appendGuildLog(emoji.guild.id, log);
    logger.event('EMOJI CREATE', log);
  }
};
