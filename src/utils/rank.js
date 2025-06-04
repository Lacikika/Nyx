// utils/rank.js
const { pool } = require('./db');

// XP required for each level (simple formula: 5 * level^2 + 50 * level + 100)
function xpForLevel(level) {
  return 5 * level * level + 50 * level + 100;
}

async function addXp(userId, guildId, amount, client) {
  // Get current XP and level
  const res = await pool.query('SELECT xp, level FROM nyx.user_profiles WHERE user_id = $1 AND guild_id = $2', [userId, guildId]);
  let xp = 0, level = 0;
  if (res.rows[0]) {
    xp = res.rows[0].xp || 0;
    level = res.rows[0].level || 0;
  }
  // Role-based XP bonus
  let bonus = 0;
  if (client) {
    try {
      const guild = await client.guilds.fetch(guildId);
      const member = await guild.members.fetch(userId);
      // Sort roles by position (highest first)
      const sortedRoles = member.roles.cache.sort((a, b) => b.position - a.position);
      for (const role of sortedRoles.values()) {
        // Example: Give 5% bonus per role above @everyone, or set custom bonuses
        if (role.name !== '@everyone') {
          bonus += Math.floor(amount * 0.05);
        }
      }
    } catch {}
  }
  let totalXp = amount + bonus;
  xp += totalXp;
  // Level up logic
  let leveledUp = false;
  while (xp >= xpForLevel(level + 1)) {
    level++;
    leveledUp = true;
  }
  // Upsert
  await pool.query(
    `INSERT INTO nyx.user_profiles (user_id, guild_id, xp, level, last_seen) VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id) DO UPDATE SET xp = $3, level = $4, last_seen = NOW()`,
    [userId, guildId, xp, level]
  );
  return { xp, level, leveledUp, bonus };
}

async function getRank(userId, guildId) {
  const res = await pool.query('SELECT xp, level FROM nyx.user_profiles WHERE user_id = $1 AND guild_id = $2', [userId, guildId]);
  return res.rows[0] || { xp: 0, level: 0 };
}

async function getLeaderboard(guildId, limit = 10) {
  const res = await pool.query('SELECT user_id, xp, level FROM nyx.user_profiles WHERE guild_id = $1 ORDER BY level DESC, xp DESC LIMIT $2', [guildId, limit]);
  return res.rows;
}

module.exports = { addXp, getRank, getLeaderboard, xpForLevel };
