-- Nyx Discord Bot PostgreSQL Schema (2025)

-- Create schema
CREATE SCHEMA IF NOT EXISTS nyx;

-- Table for all moderation, event, and command logs
CREATE TABLE IF NOT EXISTS nyx.user_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    guild_id VARCHAR(32) NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    reason TEXT NOT NULL,
    warned_by VARCHAR(32),
    channel_id VARCHAR(32),
    message_id VARCHAR(32),
    message_content TEXT,
    audit_log JSONB,
    date TIMESTAMP NOT NULL DEFAULT NOW()
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
    total_errors INT DEFAULT 0,
    xp INT DEFAULT 0,
    level INT DEFAULT 0,
    money INT DEFAULT 0,
    last_work TIMESTAMP
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_nyx_user_logs_user_guild ON nyx.user_logs(user_id, guild_id);
CREATE INDEX IF NOT EXISTS idx_nyx_user_profiles_guild ON nyx.user_profiles(guild_id);

-- Example: Log all bot actions to nyx.user_logs and update nyx.user_profiles for quick lookup/profile display.
