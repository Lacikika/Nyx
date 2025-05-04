# Nyx Minecraft Server Bot

Nyx is a Discord bot designed to manage and interact with a Minecraft server. It allows authorized users to start the Minecraft server directly from Discord and provides feedback on the server's status.

## Features
- Start the Minecraft server using a Discord command.
- Provides real-time feedback on server startup.
- Permission-based access to server management commands.

## Prerequisites
Before running the bot, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Java](https://www.java.com/) (v17 or higher)
- A Minecraft server `.jar` file (e.g., `server.jar`) in the `data/minecraft` directory.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/nyx.git
   cd nyx
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the bot:
   - Create a `.env` file in the root directory with the following content:
     ```env
     DISCORD_TOKEN=your-discord-bot-token
     CLIENT_ID=your-discord-client-id
     GUILD_ID=your-discord-guild-id
     OWNER_ID=your-discord-user-id
     ```
   - Replace `your-discord-bot-token`, `your-discord-client-id`, `your-discord-guild-id`, and `your-discord-user-id` with your actual values.

4. Accept the Minecraft EULA:
   - Open `data/minecraft/eula.txt` and set:
     ```txt
     eula=true
     ```

## Usage
1. Deploy the bot's commands to Discord:
   ```bash
   node deploy-commands.js
   ```

2. Start the bot:
   ```bash
   node index.js
   ```

3. Use the `/startminecraft` command in Discord to start the Minecraft server.

## Troubleshooting
- **File Locking Issues**: Ensure no other processes are accessing the `latest.log` file or other server files.
- **Java Not Found**: Ensure Java is installed and added to your system's PATH.
- **Permissions**: Only the user with the `OWNER_ID` specified in the `.env` file can execute the `/startminecraft` command.

## Contributing
Feel free to submit issues or pull requests to improve the bot.

## License
This project is licensed under the MIT License.
