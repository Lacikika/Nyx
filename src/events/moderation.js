// Discord.js v14 moderation event handler for messageCreate
// Features: bad word filter, spam protection, per-guild config, logging
const { Events, PermissionFlagsBits } = require('discord.js');
const { readUser, appendLog } = require('../../utils/mysql');
const logger = require('../../utils/logger');

// In-memory spam tracker: { [guildId_userId]: [timestamps] }
const spamMap = new Map();

module.exports = {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (!message.guild || message.author.bot) return;
    if (message.author?.bot) return; // Ignore bot messages
    const guildId = message.guild.id;
    const userId = message.author.id;
    let didModerate = false;

    // Load guild config
    let guildData;
    try {
      guildData = await readUser('guilds', guildId, guildId);
    } catch (e) {
      logger.error('MODERATION: Failed to load guild config', e);
      return;
    }
    const config = guildData?.config || {};
    const { logChannel, spamLimit = 5, timeWindow = 7000 } = config;
    const logChannelId = config.logChannelId || logChannel;

    // --- Bad word filter (from JSON file, secure) ---
    // TODO: Move badwords to guild config in the database
    let badWords = [];
    try {
      const fs = require('fs');
      const path = require('path');
      const badwordsPath = path.join(__dirname, '../../data/badwords.json');
      if (fs.existsSync(badwordsPath)) {
        if (!badwordsPath.startsWith(path.join(__dirname, '../../data'))) throw new Error('Badwords path traversal detected!');
        badWords = JSON.parse(fs.readFileSync(badwordsPath, 'utf8'));
      }
    } catch (e) {
      logger.error('MODERATION: Failed to load badwords.json', e);
    }
    if (Array.isArray(badWords) && badWords.length > 0) {
      const content = message.content.toLowerCase();
      const found = badWords.find(word => content.includes(word.toLowerCase()));
      if (found) {
        didModerate = true;
        try {
          await message.delete();
        } catch (err) {
          logger.error('MODERATION: Failed to delete message for bad word', err);
        }
        // Try to mute the user (timeout for 10 minutes)
        try {
          const member = await message.guild.members.fetch(userId);
          if (member && member.moderatable) {
            await member.timeout(10 * 60 * 1000, 'Csúnya szó használata');
          }
        } catch (err) {
          logger.error('MODERATION: Failed to mute user for bad word', err);
        }
        // Log event
        if (logChannelId) {
          try {
            const channel = await client.channels.fetch(logChannelId);
            if (channel && channel.isTextBased()) {
              await channel.send({
                content: `:no_entry: **Csúnya szó szűrő:** ${message.author} (${userId})\nTartalom: \`${message.content}\`\nFelhasználó 10 percre némítva.`
              });
            }
          } catch (err) {
            logger.error('MODERATION: Failed to log bad word event', err);
          }
        }
        logger.event('BAD_WORD', { guildId, userId, word: found, content: message.content }, { audit: true });
        await appendLog({ guildId, userId, type: 'BAD_WORD', reason: `Word: ${found}`, log_data: { content: message.content } });
        return;
      }
    }

    // --- Spam protection ---
    const key = `${guildId}_${userId}`;
    const now = Date.now();
    let arr = spamMap.get(key) || [];
    arr = arr.filter(ts => now - ts < timeWindow);
    arr.push(now);
    spamMap.set(key, arr);
    if (arr.length > spamLimit) {
      didModerate = true;
      try {
        await message.delete();
      } catch {}
      // Log event
      if (logChannelId) {
        try {
          const channel = await client.channels.fetch(logChannelId);
          if (channel && channel.isTextBased()) {
            await channel.send({
              content: `:warning: **Spam gyanú:** ${message.author} (${userId})\nTúl sok üzenet (${arr.length}) ${timeWindow / 1000} mp-en belül.`
            });
          }
        } catch {}
      }
      logger.event('SPAM', { guildId, userId, count: arr.length, window: timeWindow }, { audit: true });
      await appendLog({ guildId, userId, type: 'SPAM', reason: `${arr.length} messages in ${timeWindow / 1000}s` });
      return;
    }
    // If not moderated, log normal message
    if (!didModerate) {
      logger.debug('MESSAGE_OK', { guildId, userId, content: message.content });
      // We probably don't want to log every single message to the database.
      // This will be very noisy. I'm commenting this out.
      // await appendLog({ guildId, userId, type: 'MESSAGE', reason: message.content });
    }
  }
};
