-- Nyx Discord Bot PostgreSQL Schema (2025)

-- Create schema
CREATE SCHEMA IF NOT EXISTS nyx;

-- Table for all moderation, event, and command logs
CREATE TABLE IF NOT EXISTS nyx.user_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL,         -- Discord user ID
  guild_id VARCHAR(32) NOT NULL,        -- Discord guild/server ID
  event_type VARCHAR(32) NOT NULL,      -- e.g. BAN, KICK, WARN, MUTE, PURGE, MEME, 8BALL, JOIN, LEAVE, COMMAND, ERROR
  reason TEXT NOT NULL,                 -- Reason or description
  warned_by VARCHAR(32),                -- Moderator or actor (nullable for self events)
  channel_id VARCHAR(32),               -- Channel where event occurred (nullable)
  message_id VARCHAR(32),               -- Message ID if relevant (nullable)
  message_content TEXT,                 -- Content of the message (if applicable)
  audit_log JSONB,                      -- Raw audit log data (if available)
  date TIMESTAMP NOT NULL DEFAULT NOW() -- Timestamp
);

-- Table for user profiles (aggregated stats)
CREATE TABLE IF NOT EXISTS nyx.user_profiles (
  user_id VARCHAR(32) PRIMARY KEY,
  guild_id VARCHAR(32) NOT NULL,
  username TEXT,
  joined_at TIMESTAMP,
  last_seen TIMESTAMP,
  total_messages INT DEFAULT 0,
  total_commands INT DEFAULT 0,
  total_bans INT DEFAULT 0,
  total_kicks INT DEFAULT 0,
  total_warns INT DEFAULT 0,
  total_mutes INT DEFAULT 0,
  total_purges INT DEFAULT 0,
  total_tickets INT DEFAULT 0,
  total_entertainment INT DEFAULT 0,
  total_errors INT DEFAULT 0
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_nyx_user_logs_user_guild ON nyx.user_logs(user_id, guild_id);
CREATE INDEX IF NOT EXISTS idx_nyx_user_profiles_guild ON nyx.user_profiles(guild_id);

-- Example: Log all bot actions to nyx.user_logs and update nyx.user_profiles for quick lookup/profile display.
