const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function logUserEvent({ userId, guildId, eventType, reason, warnedBy, channelId, messageId, messageContent, auditLog }) {
  await pool.query(
    `INSERT INTO nyx.user_logs (user_id, guild_id, event_type, reason, warned_by, channel_id, message_id, message_content, audit_log) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [userId, guildId, eventType, reason, warnedBy, channelId, messageId, messageContent, auditLog ? JSON.stringify(auditLog) : null]
  );
  // Upsert user profile stats
  const statsCol = {
    BAN: 'total_bans',
    KICK: 'total_kicks',
    WARN: 'total_warns',
    MUTE: 'total_mutes',
    PURGE: 'total_purges',
    TICKET: 'total_tickets',
    COMMAND: 'total_commands',
    ERROR: 'total_errors',
    ENTERTAINMENT: 'total_entertainment',
    MESSAGE: 'total_messages',
  }[eventType] || null;
  if (statsCol) {
    await pool.query(
      `INSERT INTO nyx.user_profiles (user_id, guild_id, ${statsCol}) VALUES ($1, $2, 1)
      ON CONFLICT (user_id) DO UPDATE SET ${statsCol} = nyx.user_profiles.${statsCol} + 1, last_seen = NOW()`,
      [userId, guildId]
    );
  } else {
    await pool.query(
      `INSERT INTO nyx.user_profiles (user_id, guild_id, last_seen) VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) DO UPDATE SET last_seen = NOW()`,
      [userId, guildId]
    );
  }
}

module.exports = { pool, logUserEvent };