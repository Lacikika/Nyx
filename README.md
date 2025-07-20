# Nyx Discord Bot

A modern, all-in-one Discord bot built with Node.js, discord.js v14+, and PostgreSQL.

## Features
- Moderation (ban, kick, mute, warn, purge, etc.)
- Entertainment (fun commands, memes, games, 8ball, joke, etc.)
- Ticket system (open/close support tickets with embeds and buttons)
- Utility commands (info, help, server stats, etc.)
- Full audit logging: all moderation and command actions are logged to the PostgreSQL database, including message content and audit log data
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


## Environment Variables
Create a `.env` file in the root with:
```
BOT_TOKEN=your-discord-bot-token
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


## Requirements
- Node.js (latest LTS)
- discord.js v14+
- dotenv

## License
MIT
