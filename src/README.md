# Nyx Discord Bot

A modern, all-in-one Discord bot built with Node.js and discord.js v14+.

## Features
- Moderation (kick, ban, mute, warn, purge, etc.)
- Entertainment (fun commands, memes, games, etc.)
- Ticket system (open/close support tickets)
- Utility commands (info, help, server stats, etc.)

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
.env
```

## Setup
1. Install dependencies:
   ```
npm install
   ```
2. Create a `.env` file and add your Discord bot token:
   ```
BOT_TOKEN=your-bot-token-here
   ```
3. Start the bot:
   ```
npm run start
   ```
   or
   ```
node ./src/index.js
   ```

## Adding Commands & Events
- Add new command files in the appropriate subfolder under `/src/commands/`.
- Add new event files in `/src/events/`.

## Requirements
- Node.js (latest LTS)
- discord.js v14+
- dotenv

## License
MIT
