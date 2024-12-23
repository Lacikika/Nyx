require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { incrementUserActivity } = require('./utils.js');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { log } = require('./utils.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: ['USER', 'GUILD_MEMBER', 'CHANNEL'],
});





log('W', 'test1', 'test2');


client.commands = new Collection();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (command.data && command.data.name) {
        client.commands.set(command.data.name, command);
    } else {
        console.warn(`Command in ${file} is missing a valid data object with a name.`);
    }
}


const logFilePath = path.join(__dirname, 'interactionLogs.txt');
function logMessage(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`, 'utf8');
}
/*
let i = 1;
while (i <= 100) {
  console.log(`${i}%`);
  i++;
  setTimeout(() => {}, 1000); // wait 100ms before next iteration
}

*/

client.on('interactionCreate', async (interaction) => {
    try {
        // Handle Slash Commands
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (command) {
                await command.execute(interaction);
                log('I', `Executed command: ${interaction.commandName} by ${interaction.user.tag}`, interaction.user.tag);
                incrementUserActivity(interaction.user.id);
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
                incrementUserActivity(interaction.user.id);
            } else {
                log('E', `Button interaction handler not found.`, interaction.user.tag);
            }
        }
        
        // Handle Select Menu Interactions
        else if (interaction.isSelectMenu()) {
            const command = client.commands.get(interaction.message.interaction?.commandName || '');
            if (command && command.handleSelectMenu) {
                await command.handleSelectMenu(interaction);
                incrementUserActivity(interaction.user.id);
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
                incrementUserActivity(interaction.user.id);
                log('I', `Modal submit interaction handled for custom ID: ${interaction.customId} by ${interaction.user.tag}`, interaction.user.tag);
            } else {
                log('E', `Modal handler not found for ID: ${interaction.customId}`, interaction.user.tag);
            }
        }
        
        // Other types of interactions can be handled here if needed
        else {
            incrementUserActivity(interaction.user.id);
            log('W', `Unhandled interaction type: ${interaction.type}`, interaction.user.tag);
        }
    } catch (error) {
        log('E', `Error handling interaction: ${error}`, interaction.user.tag);
        if (interaction.isRepliable()) {
            await interaction.reply({ content: 'There was an error processing this interaction!', ephemeral: true });
        }
    }
});


client.on('messageCreate', (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;

    incrementUserActivity(message.author.id);
});


// Event listener for role changes
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const oldRolesCache = oldMember.roles.cache;
    const newRolesCache = newMember.roles.cache;

    const rolesAdded = newRolesCache.filter(role => !oldRolesCache.has(role.id));
    const rolesRemoved = oldRolesCache.filter(role => !newRolesCache.has(role.id));

    const user = newMember.user;
    let notificationMessage = '';

    if (rolesAdded.size > 0) {
        const addedRolesNames = rolesAdded.map(role => role.name).join(', ');
        notificationMessage += `🔹 Uj rangok hozzáadva: ${addedRolesNames}\n`;
        log('I', `New roles added: ${addedRolesNames}`, user.tag);
    }
    if (rolesRemoved.size > 0) {
        const removedRolesNames = rolesRemoved.map(role => role.name).join(', ');
        notificationMessage += `🔻 Rang levéve: ${removedRolesNames}\n`;
        log('I', `Roles removed: ${removedRolesNames}`, user.tag);
    }

    if (notificationMessage) {
        try {
            await user.send(`Szia  @${user.tag},\n${notificationMessage}`);
        } catch (error) {
            log('E', `Failed to send message to ${user.tag}: ${error}`, user.tag);
        }
    }
});



// Log loaded commands
console.log(`Loaded ${client.commands.size} commands:`);
client.commands.forEach((command) => console.log(`- ${command.data.name}`));

// Log in to Discord with your bot token
client.login(process.env.BOT_TOKEN) // Make sure to use the environment variable for security
    .then(() => console.log("✅ elindultam te paraszt"))
    .catch(err => console.error("❌ Failed to log in:", err));
