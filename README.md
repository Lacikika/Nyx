# Nyx Discord Bot

A modern, all-in-one Discord bot built with Node.js, discord.js v14+, and encrypted data storage. Features a professional web management panel with real-time monitoring and comprehensive moderation tools.

## 🌟 Features

### 🛡️ **Moderation System**
- **Advanced Commands**: ban, kick, mute, warn, purge, role management
- **Automated Moderation**: Bad word filtering, spam protection, content moderation
- **Role Management**: Staff-approved role requests with cooldown system
- **Audit Logging**: Complete action history with detailed logs

### 🎮 **Entertainment & Utility**
- **Fun Commands**: memes, jokes, 8ball, interactive games
- **Server Tools**: statistics, user lookup, leaderboards
- **XP System**: Automatic leveling with role-based bonuses
- **Help System**: Interactive paginated command help

### 🔒 **Security & Data Protection**
- **AES-256 Encryption**: All data files encrypted at rest
- **Secure Storage**: Encrypted JSON database with automatic escrow
- **Data Management**: Automatic cleanup and size limits (8GB max)
- **Audit Trails**: Complete logging of all bot activities

### 🌐 **Professional Web Panel**
- **Modern UI**: Glassmorphism design with smooth animations
- **Real-time Monitoring**: Live console logs and system statistics
- **Data Visualization**: Interactive charts and progress indicators
- **Mobile Responsive**: Works perfectly on all devices
- **Secure Access**: Encrypted data viewing with search functionality

## 🚀 Quick Start

### Prerequisites
- Node.js (latest LTS version)
- Discord Bot Token
- Discord Application ID

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nyx-discord-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   BOT_TOKEN=your-discord-bot-token
   CLIENT_ID=your-discord-application-id
   LOG_CHANNEL_ID=your-log-channel-id
   ENCRYPTION_KEY=your-64-character-hex-encryption-key
   ```

4. **Generate encryption key** (optional - for data security)
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Add the output to your `.env` file as `ENCRYPTION_KEY`

5. **Register slash commands**
   ```bash
   npm run reg
   ```

6. **Start the bot**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
/
├── src/
│   ├── commands/           # Slash commands organized by category
│   │   ├── moderation/     # Ban, kick, warn, role management
│   │   ├── entertainment/  # Memes, jokes, games
│   │   └── utility/        # Help, stats, server info
│   ├── events/             # Discord.js event handlers
│   ├── config.js          # Bot configuration
│   └── index.js           # Main bot entry point
├── utils/
│   ├── jsondb.js          # Encrypted database operations
│   ├── logger.js          # Advanced logging system
│   └── rank.js            # XP and leveling system
├── security/
│   ├── webpanel.js        # Web panel server
│   ├── views/             # EJS templates for web interface
│   └── escrow_existing.js # Data encryption utilities
├── data/                  # Encrypted data storage
│   ├── guilds/            # Server configurations
│   ├── profiles/          # User profiles and XP
│   └── logs/              # Audit logs and events
└── documentation/         # Comprehensive documentation
```

## 🌐 Web Panel

Access the professional web management panel at `http://localhost:50249` when the bot is running.

### **Dashboard Features**
- 📊 **Real-time Statistics**: Server count, user profiles, data usage
- 🔍 **Advanced Search**: Find any data file by name or ID
- 📁 **File Browser**: Navigate encrypted data with modern interface
- 🎨 **Modern Design**: Glassmorphism UI with smooth animations

### **Available Pages**
- **Dashboard** (`/`) - Main overview and file browser
- **Statistics** (`/statistics`) - Detailed analytics and metrics
- **Console** (`/console`) - Live bot logs with syntax highlighting
- **Settings** (`/blank`) - Configuration and system management

### **Key Features**
- 🔒 **Secure Data Viewing**: Decrypt and view encrypted files
- 📱 **Mobile Responsive**: Perfect on all screen sizes
- 🎯 **Interactive Elements**: Hover effects and smooth transitions
- 📊 **Data Visualization**: Charts, progress bars, and indicators

## ⚙️ Configuration

### **Server Setup**
Use `/szerverbeallitas` to configure your server:

```javascript
// Available settings
logChannel: "Channel for bot logs"
rolesChannel: "Channel for role approval requests"
deleteroleChannel: "Channel for role deletion requests"
staffRoles: ["Array of staff role IDs"]
requestRoles: ["Array of roles that can request roles"]
roleCooldown: "Cooldown role ID for role restrictions"
```

### **Command Categories**

#### **Moderation Commands**
- `/ban` - Ban a user from the server
- `/kick` - Kick a user from the server
- `/warn` - Issue a warning to a user
- `/purge` - Bulk delete messages
- `/rangadas` - Request role assignment (staff approval)
- `/rangtorles` - Request role removal (staff approval)

#### **Utility Commands**
- `/sugo` - Interactive help system
- `/serverinfo` - Detailed server statistics
- `/rang` - Check your XP and level
- `/ranglista` - Server leaderboard

#### **Entertainment Commands**
- `/meme` - Random meme from API
- `/vicc` - Random joke
- `/8ball` - Magic 8-ball responses

## 🔧 Advanced Features

### **Console Commands**
While the bot is running, use these console commands:

```bash
restart              # Restart the bot
stop                 # Stop the bot
say <message>        # Send message to log channel
broadcast <type>     # Broadcast to all servers
guilds               # List all connected servers
users <guildId>      # List users in a server
eval <code>          # Execute JavaScript (dangerous!)
db <operation>       # Database operations
help                 # Show all console commands
```

### **Database Operations**
```bash
db list <type>                    # List files (profiles, guilds, logs)
db get <type> <guildId> <userId>  # Get user data
db set <type> <guildId> <userId> <json>  # Set user data
db delete <type> <guildId> <userId>      # Delete user data
db raw <type> <guildId> <userId>         # View raw file content
```

### **Automated Features**
- **XP System**: Automatic XP gain from messages with role bonuses
- **Spam Protection**: Configurable message limits and timeouts
- **Bad Word Filter**: Automatic content moderation with muting
- **Data Encryption**: All files automatically encrypted with AES-256
- **Log Rotation**: Automatic cleanup when storage limit reached

## 🛠️ Development

### **Scripts**
```bash
npm start           # Start the bot
npm run dev         # Start with debug logging
npm run reg         # Register slash commands
npm test            # Run tests
```

### **Environment Variables**
```env
BOT_TOKEN=                    # Discord bot token (required)
CLIENT_ID=                    # Discord application ID (required)
LOG_CHANNEL_ID=              # Default log channel (optional)
ENCRYPTION_KEY=              # 64-char hex key for encryption (optional)
AUTO_REGISTER_COMMANDS=true  # Auto-register commands on start
```

### **Adding Commands**
1. Create a new file in the appropriate `/src/commands/` subfolder
2. Follow the existing command structure with `data` and `execute` exports
3. Restart the bot or run `npm run reg` to register new commands

### **Custom Events**
Add new event handlers in `/src/events/` following the Discord.js v14 event structure.

## 📊 Monitoring & Analytics

### **Built-in Metrics**
- Command usage statistics
- User activity tracking
- Server growth analytics
- Error rate monitoring
- Performance metrics

### **Log Categories**
- **INFO**: General bot operations
- **WARN**: Non-critical issues
- **ERROR**: Critical errors requiring attention
- **EVENT**: User actions and Discord events
- **DEBUG**: Detailed debugging information

## 🔐 Security

### **Data Protection**
- All user data encrypted with AES-256-CBC
- Automatic key generation and management
- Secure file storage with access controls
- No sensitive data in logs or console output

### **Best Practices**
- Regular automated backups
- Encrypted data transmission
- Secure token management
- Audit trail for all actions

## 📚 Documentation

Comprehensive documentation available in the `/documentation/` folder:

- **Overview** - General bot information
- **Commands** - Detailed command reference
- **Configuration** - Setup and customization
- **Moderation** - Moderation system guide
- **Rank System** - XP and leveling mechanics
- **Console Commands** - Developer tools
- **Error Handling** - Troubleshooting guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support, documentation, or feature requests:
- Check the `/documentation/` folder
- Use the web panel console for debugging
- Review bot logs for error information
- Ensure all environment variables are properly configured

---

**Built with ❤️ using Node.js, Discord.js v14, and modern web technologies**