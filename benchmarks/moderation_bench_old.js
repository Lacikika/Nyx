// Mock module manually
const { Events } = require('discord.js');
const jsondb = require('../utils/jsondb');
const logger = require('../utils/logger');
logger.error = () => {};
logger.info = () => {};
logger.event = () => {};
logger.debug = () => {};

jsondb.readUser = async () => ({ logChannel: 'channel123', spamLimit: 100, timeWindow: 7000 });
jsondb.appendUserLog = async () => {};

const spamMap = new Map();

async function executeOld(message, client) {
    if (!message.guild || message.author.bot) return;
    if (message.author?.bot) return; // Ignore bot messages
    const guildId = message.guild.id;
    const userId = message.author.id;
    let didModerate = false;

    // Load guild config (from DB or file)
    let config;
    try {
      config = await jsondb.readUser('guilds', guildId, guildId);
    } catch (e) {
      logger.error('MODERATION: Failed to load guild config', e);
      return;
    }
    if (!config) return;
    const { logChannel, spamLimit = 5, timeWindow = 7000 } = config;
    const logChannelId = config.logChannelId || logChannel; // fallback for legacy

    // --- Bad word filter (from JSON file, secure) ---
    let badWords = [];
    try {
      const fs = require('fs');
      const path = require('path');
      const badwordsPath = path.join(__dirname, '../data/badwords.json');
      if (!badwordsPath.startsWith(path.join(__dirname, '../data'))) throw new Error('Badwords path traversal detected!');
      badWords = JSON.parse(fs.readFileSync(badwordsPath, 'utf8'));
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
        } catch (err) {}
        // Try to mute the user (timeout for 10 minutes)
        try {
          const member = await message.guild.members.fetch(userId);
          if (member && member.moderatable) {
            await member.timeout(10 * 60 * 1000, 'Csúnya szó használata');
          }
        } catch (err) {}
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
      return;
    }
}

const mockMessage = {
  guild: { id: 'guild123', members: { fetch: async () => ({ moderatable: true, timeout: async () => {} }) } },
  author: { id: 'user123', bot: false, username: 'testuser' },
  content: 'Hello this is a normal message without any bad words.',
  delete: async () => {}
};

const mockClient = {
  channels: { fetch: async () => ({ isTextBased: () => true, send: async () => {} }) }
};

const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Create a large badwords file to simulate realistic load
const largeBadWords = Array.from({ length: 1000 }, (_, i) => `badword${i}`);
fs.writeFileSync(path.join(dataDir, 'badwords.json'), JSON.stringify(largeBadWords));

async function runBenchmark() {
  const iterations = 10000;
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    await executeOld(mockMessage, mockClient);
  }
  const end = Date.now();
  console.log(`Old executed ${iterations} moderation events in ${end - start}ms`);
  process.exit(0);
}

runBenchmark().catch(console.error);
