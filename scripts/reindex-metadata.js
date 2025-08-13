// Script to rebuild metadata_index.json for all encrypted data
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const { decrypt } = require('../utils/jsondb');

const dataDir = path.join(__dirname, '../data');
const logsDir = path.join(dataDir, 'logs');
const profilesDir = path.join(dataDir, 'profiles');
const guildsDir = path.join(dataDir, 'guilds');
const metadataIndexFile = path.join(dataDir, 'metadata_index.json');

async function collectEntries(type, dir) {
  let entries = [];
  if (!fs.existsSync(dir)) return entries;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const buf = await fsp.readFile(filePath);
      const json = JSON.parse(decrypt(buf));
      if (Array.isArray(json.entries)) {
        for (const entry of json.entries) {
          entries.push({
            type,
            userId: entry.userId,
            guildId: entry.guildId,
            username: entry.username,
            role: entry.role || (entry.roles ? entry.roles[0] : undefined),
            time: entry.time || entry.timestamp,
            file
          });
        }
      }
    } catch (e) {
      console.warn('Failed to decrypt or parse', filePath, e.message);
    }
  }
  return entries;
}

async function main() {
  let index = {};
  const all = [];
  all.push(...await collectEntries('logs', logsDir));
  all.push(...await collectEntries('profiles', profilesDir));
  all.push(...await collectEntries('guilds', guildsDir));
  for (const meta of all) {
    if (!meta.userId && !meta.guildId) continue;
    const key = `${meta.type}:${meta.guildId || ''}:${meta.userId || ''}:${meta.time || ''}`;
    index[key] = meta;
  }
  // Log first 3 entries for diagnostics
  const keys = Object.keys(index);
  console.log('First 3 metadata entries:', keys.slice(0, 3).map(k => index[k]));
  try {
    const json = JSON.stringify(index, null, 2);
    await fsp.writeFile(metadataIndexFile, json, 'utf8');
    console.log('Metadata reindex complete. Entries:', keys.length);
  } catch (e) {
    console.error('Failed to write metadata_index.json:', e);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
