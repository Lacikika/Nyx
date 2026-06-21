const { execute } = require('../src/events/moderation.js');

const mockMessage = {
  guild: { id: 'guild123', members: { fetch: async () => ({ moderatable: true, timeout: async () => {} }) } },
  author: { id: 'user123', bot: false, username: 'testuser' },
  content: 'Hello this is a normal message without any bad words.',
  delete: async () => {}
};

const mockClient = {
  channels: { fetch: async () => ({ isTextBased: () => true, send: async () => {} }) }
};

// Mock dependencies
const jsondb = require('../utils/jsondb');
jsondb.readUser = async () => ({ logChannel: 'channel123', spamLimit: 100, timeWindow: 7000 });
jsondb.appendUserLog = async () => {};

const logger = require('../utils/logger');
logger.error = () => {};
logger.info = () => {};
logger.event = () => {};
logger.debug = () => {};

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
    await execute(mockMessage, mockClient);
  }
  const end = Date.now();
  console.log(`Executed ${iterations} moderation events in ${end - start}ms`);
  process.exit(0);
}

runBenchmark().catch(console.error);
