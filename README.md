# Nyx Discord Bot

A modern, all-in-one Discord bot built with Node.js, discord.js v14+, and PostgreSQL.

## Features
- Moderation (ban, kick, mute, warn, purge, etc.)
- Entertainment (fun commands, memes, games, 8ball, joke, etc.)
- Ticket system (open/close support tickets with embeds and buttons)
- Utility commands (info, help, server stats, lookup, etc.)
- **Log lookup commands:**
  - `/lookupuser <user>` — View all logs for a user (global, paginated, with navigation buttons)
  - `/lookupguild` — View all logs for this guild (paginated, with navigation buttons)
- Full audit logging: all moderation and command actions are logged to the PostgreSQL database, including message content and audit log data
- User profile system: `/lookup` command shows all user stats and recent actions
- Log channel support for command usage and errors

## Project Structure
```
/src
  /commands
    /moderation
    /entertainment
    /tickets
    /utility
  /events
  /utils
  config.js
  index.js
utils/
  db.js
  postgresql_schema.sql
.env
```

## Database Setup
1. Install PostgreSQL and create a database (e.g. `Nyx`).
2. Create a user (e.g. `nyx`) and set a password (e.g. `admin`).
3. Run the SQL in `utils/postgresql_schema.sql` to create the required tables and indexes:
   - `nyx.user_logs` logs all moderation, command, and event actions (with message content and audit log data)
   - `nyx.user_profiles` stores user stats for fast lookup
4. Example connection string for `.env`:
   ```
   DATABASE_URL=postgresql://nyx:admin@localhost:5432/Nyx
   ```

## Environment Variables
Create a `.env` file in the root with:
```
BOT_TOKEN=your-discord-bot-token
DATABASE_URL=postgresql://nyx:admin@localhost:5432/Nyx
CLIENT_ID=your-discord-application-id
LOG_CHANNEL_ID=your-log-channel-id (optional)
```

## Setup & Usage
1. Install dependencies:
   ```
   npm install
   ```
2. Register slash commands:
   ```
   node ./scripts/register-commands.js
   ```
3. Start the bot:
   ```
   npm run start
   ```

## Logging & Profiles
- All moderation and command actions are logged to the database, including message content and audit log data.
- Use `/lookupuser` to view a user's logs across all guilds (with pagination and navigation buttons).
- Use `/lookupguild` to view all logs for the current guild (with pagination and navigation buttons).
- The ticket system uses embeds and buttons for a modern, user-friendly experience.
- All command usage and errors are sent as embeds to the log channel if `LOG_CHANNEL_ID` is set.

## Requirements
- Node.js (latest LTS)
- discord.js v14+
- dotenv

## License
MIT
