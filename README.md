# Nyx Discord Bot

Nyx is a feature-rich Discord bot designed to enhance your server experience. This bot includes a variety of commands and features, such as moderation tools, user interaction commands, and utility functions.

## Features
- **Moderation Commands**: Ban, block, unblock, and clear messages.
- **Utility Commands**: Ping, say, and profile picture retrieval.
- **User Interaction**: Appeal requests and help commands.
- **Database Integration**: Tracks blocked and privileged users.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Nyx
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```env
     BOT_TOKEN=your-bot-token
     CLIENT_ID=your-client-id
     GUILD_ID=your-guild-id
     ```

4. Deploy commands:
   ```bash
   node deploy-commands.js
   ```

5. Start the bot:
   ```bash
   npm start
   ```

## Commands

### Moderation
- **/ban**: Ban a user from the server.
- **/block**: Block a user from using the bot.
- **/unblock**: Unblock a user.
- **/clear**: Clear messages in a channel.

### Utility
- **/ping**: Check the bot's latency.
- **/say**: Make the bot say something.
- **/profilkep**: Retrieve a user's profile picture.

### User Interaction
- **/appeal**: Send an appeal request to the bot owner.
- **/help**: Display a list of available commands.

## File Structure
```
Nyx/
├── commands/          # Command modules
├── data/              # Data files and utilities
├── egyeb/             # Miscellaneous assets
├── utils.js           # Utility functions
├── main.js            # Entry point of the bot
├── deploy-commands.js # Command deployment script
├── config.json        # Configuration file
├── .env               # Environment variables
├── README.md          # Project documentation
```

## Development

### Running the Bot in Development Mode
Use the following command to start the bot in development mode:
```bash
npm run dev
```

### Linting and Formatting
Ensure code quality by running ESLint and Prettier:
```bash
npm run lint
npm run format
```

### Testing
Run unit tests:
```bash
npm test
```

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Submit a pull request with a detailed description of your changes.

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.
