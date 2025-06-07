// utils/rank.js
const { readUser, writeUser } = require('./jsondb');

function xpForLevel(level) {
  return 5 * level * level + 50 * level + 100;
}

async function addXp(userId, guildId, amount, client) {
  let profile = await readUser('profiles', userId, guildId);
  let xp = profile.xp || 0, level = profile.level || 0;
  let bonus = 0;
  if (client) {
    try {
      const guild = await client.guilds.fetch(guildId);
      const member = await guild.members.fetch(userId);
      const sortedRoles = member.roles.cache.sort((a, b) => b.position - a.position);
      for (const role of sortedRoles.values()) {
        if (role.name !== '@everyone') {
          bonus += Math.floor(amount * 0.05);
        }
      }
    } catch {}
  }
  let totalXp = amount + bonus;
  xp += totalXp;
  let leveledUp = false;
  while (xp >= xpForLevel(level + 1)) {
    level++;
    leveledUp = true;
  }
  profile.xp = xp;
  profile.level = level;
  profile.last_seen = Date.now();
  await writeUser('profiles', userId, guildId, profile);
  return { xp, level, leveledUp, bonus };
}

async function getRank(userId, guildId) {
  const profile = await readUser('profiles', userId, guildId);
  return { xp: profile.xp || 0, level: profile.level || 0 };
}

async function getLeaderboard(guildId, limit = 10) {
  const fs = require('fs').promises;
  const path = require('path');
  const dir = path.join(__dirname, '../data/profiles');
  let users = [];
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (file.startsWith(guildId + '_')) {
        const data = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8'));
        users.push({ user_id: file.split('_')[1].replace('.json',''), xp: data.xp || 0, level: data.level || 0 });
      }
    }
  } catch {}
  users.sort((a, b) => b.level - a.level || b.xp - a.xp);
  return users.slice(0, limit);
}

module.exports = { addXp, getRank, getLeaderboard, xpForLevel };
