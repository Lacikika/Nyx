require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { log, getLogChannel, initializeDatabase, getlogchannel } = require('./utils.js');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

/**
 * Initializes the Discord client with required intents and partials.
 * @type {Client}
 */
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: ['USER', 'GUILD_MEMBER', 'CHANNEL'],
});

/**
 * Collection to store all commands.
 * @type {Collection<string, any>}
 */
client.commands = new Collection();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

// Load all command files dynamically
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (command.data && command.data.name) {
        client.commands.set(command.data.name, command);
    } else {
        console.warn(`Command in ${file} is missing a valid data object with a name.`);
    }
}

/**
 * Handles interaction events such as slash commands, buttons, and modals.
 * @param {Interaction} interaction - The interaction object from Discord.js.
 */
client.on('interactionCreate', async (interaction) => {
    try {
        const db = await initializeDatabase();
        const blockedUsers = db.blockedUsers;

        const isBlocked = await blockedUsers.findOne({ selector: { id: interaction.user.id } }).exec();
        if (isBlocked) {
            return interaction.reply({
                embeds: [createEmbed('Hozzáférés megtagadva', 'Nem használhatod a botot, mert le vagy tiltva.', 0xff0000)],
                ephemeral: true,
            });
        }

        // Handle Slash Commands
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (command) {
                await command.execute(interaction);
                log('I', `Executed command: ${interaction.commandName} by ${interaction.user.tag}`, interaction.user.tag);

            } else {
                log('E', `Command not found: ${interaction.commandName}`, interaction.user.tag);
            }
        }
        
        // Handle Button Interactions
        else if (interaction.isButton()) {
            const command = client.commands.get(interaction.message.interaction?.commandName || ''); // Optional chaining to support custom buttons
            if (command && command.handleButton) {
                await command.handleButton(interaction);
                log('I', `Button interaction handled for command: ${interaction.message.interaction?.commandName || ''} by ${interaction.user.tag}`, interaction.user.tag);

            } else {
                log('E', `Button interaction handler not found.`, interaction.user.tag);
            }
        }
        
        // Handle Select Menu Interactions
        else if (interaction.isSelectMenu()) {
            const command = client.commands.get(interaction.message.interaction?.commandName || '');
            if (command && command.handleSelectMenu) {
                await command.handleSelectMenu(interaction);

                log('I', `Select menu interaction handled for command: ${interaction.message.interaction?.commandName || ''} by ${interaction.user.tag}`, interaction.user.tag);
            } else {
                log('E', `Select menu handler not found.`, interaction.user.tag);
            }
        }
        
        // Handle Modal Submissions
        else if (interaction.isModalSubmit()) {
            const command = client.commands.get(interaction.customId);
            if (command && command.handleModal) {
                await command.handleModal(interaction);

                log('I', `Modal submit interaction handled for custom ID: ${interaction.customId} by ${interaction.user.tag}`, interaction.user.tag);
            } else {
                log('E', `Modal handler not found for ID: ${interaction.customId}`, interaction.user.tag);
            }
        }
        
        // Other types of interactions can be handled here if needed
        else {

            log('W', `Unhandled interaction type: ${interaction.type}`, interaction.user.tag);
        }
    } catch (error) {
        log('E', `Error handling interaction: ${error}`, interaction.user.tag);
        if (interaction.isRepliable()) {
            await interaction.reply({
                embeds: [createEmbed('Hiba', 'Hiba történt az interakció feldolgozása során.', 0xff0000)],
                ephemeral: true,
            });
        }
    }
});

/**
 * Logs every message received (except from bots).
 * @param {Message} message - The message object from Discord.js.
 */
client.on('messageCreate', (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;
    log('I', `Message received: ${message.content}`, message.author.tag);
});

/**
 * Handles role changes for guild members and logs them.
 * @param {GuildMember} oldMember - The member before the update.
 * @param {GuildMember} newMember - The member after the update.
 */
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
        const logChannelId = await getLogChannel();
        if (!logChannelId) return;

        const logChannel = newMember.guild.channels.cache.get(logChannelId);
        if (!logChannel) return;

        const oldRolesCache = oldMember.roles.cache;
        const newRolesCache = newMember.roles.cache;

        const rolesAdded = newRolesCache.filter(role => !oldRolesCache.has(role.id));
        const rolesRemoved = oldRolesCache.filter(role => !newRolesCache.has(role.id));

        if (rolesAdded.size > 0 || rolesRemoved.size > 0) {
            const changes = [];
            if (rolesAdded.size > 0) {
                changes.push(`🔹 Roles added: ${rolesAdded.map(role => role.name).join(', ')}`);
            }
            if (rolesRemoved.size > 0) {
                changes.push(`🔸 Roles removed: ${rolesRemoved.map(role => role.name).join(', ')}`);
            }

            const message = `Your roles have changed:\n${changes.join('\n')}`;
            newMember.send(message).catch(error => console.log(`Failed to send message to ${newMember.user.tag}.`));

            const changer = await findRoleChanger(newMember.guild, newMember);
            if (changer) {
                logChannel.send(`${newMember} roles changed:\n${message}\nRoles were changed by @${changer.tag}.`);
            } else {
                logChannel.send(`${newMember} roles changed:\n${message}\nCould not find who changed the roles.`);
            }
        }
    } catch (error) {
        log('E', `Error fetching log channel: ${error}`, newMember.user.tag);
    }
});

/**
 * Finds the user who changed roles for a guild member.
 * @param {Guild} guild - The guild where the role change occurred.
 * @param {GuildMember} member - The member whose roles were changed.
 * @returns {User|null} The user who changed the roles, or null if not found.
 */
async function findRoleChanger(guild, member) {
    try {
        const auditLogs = await guild.fetchAuditLogs({
            type: 25, // Role update type
            limit: 1,
        });
        const entry = auditLogs.entries.first();
        if (entry && entry.target.id === member.id) {
            console.log(`Audit log entry found: ${entry.executor.tag} changed roles for ${member.user.tag}`);
            return entry.executor;
        } else {
            console.log(`No audit log entry found for ${member.user.tag}`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return null;
    }
}

// Start the bot
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Log loaded commands
console.log(`Loaded ${client.commands.size} commands:`);
client.commands.forEach((command) => console.log(`- ${command.data.name}`));

// Log in to Discord with your bot token
client.login(process.env.TOKEN) // Make sure to use the environment variable for security
    .then(() => console.log("✅ elindultam te paraszt"))
    .catch(err => console.error("❌ Failed to log in:", err));

(async () => {
    const db = await initializeDatabase();
    console.log('Database initialized:', db.name);
})();
