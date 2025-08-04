/**
 * @fileoverview messageCreate event handler.
 * @module events/messageCreate
 */

const { Events } = require('discord.js');
const config = require('../config');
const t = require('../../utils/locale');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    const bannedWords = config.bannedWords || [];
    const hasBannedWord = bannedWords.some(word => message.content.toLowerCase().includes(word));

    if (hasBannedWord) {
      try {
        await message.delete();
        await message.author.send(t('banned_word_warning'));
      } catch (error) {
        console.error('Failed to delete message or warn user:', error);
      }
    }
  },
};
