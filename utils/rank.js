// utils/rank.js
const { readUser, writeUser, pool } = require('./mysql');

function xpForLevel(level) {
  return 5 * level * level + 50 * level + 100;
}

async function addXp(userId, guildId, amount, client) {
  let profile = await readUser('profiles', userId, guildId);
  if (!profile) {
    profile = { userId, guildId, xp: 0, level: 0, warnings: [] };
  }

  let xp = profile.xp || 0;
  let level = profile.level || 0;

  // Bonus calculation can stay the same as it depends on Discord objects
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
    } catch (error) {
      // Silently fail on role fetching
    }
  }

  xp += (amount + bonus);

  let leveledUp = false;
  while (xp >= xpForLevel(level + 1)) {
    level++;
    leveledUp = true;
  }

  profile.xp = xp;
  profile.level = level;

  await writeUser('profiles', userId, guildId, profile);
  return { xp, level, leveledUp, bonus };
}

async function getRank(userId, guildId) {
  const profile = await readUser('profiles', userId, guildId);
  return { xp: profile?.xp || 0, level: profile?.level || 0 };
}

async function getLeaderboard(guildId, limit = 10) {
  const [rows] = await pool.execute(
    'SELECT userId, xp, level FROM users WHERE guildId = ? ORDER BY level DESC, xp DESC LIMIT ?',
    [guildId, limit]
  );
  return rows;
}

module.exports = { addXp, getRank, getLeaderboard, xpForLevel };
