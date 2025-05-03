const { exec } = require('child_process');
const { createEmbed } = require('../utils.js');

/**
 * Starts the Minecraft server.
 * @param {Interaction} interaction - The interaction object from Discord.js.
 */
async function startMinecraftServer(interaction) {
    // Check if the user has permission to start the server
    const authorizedUserId = 'YOUR_USER_ID'; // Replace with the actual user ID of the authorized user
    if (interaction.user.id !== authorizedUserId) {
        return interaction.reply({
            embeds: [createEmbed('Access Denied', 'You do not have permission to start the Minecraft server.', 0xff0000)],
            ephemeral: true,
        });
    }

    // Start the Minecraft server
    exec('java -Xmx1024M -Xms1024M -jar server.jar nogui', { cwd: './data/minecraft' }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error starting Minecraft server: ${error.message}`);
            return interaction.reply({
                embeds: [createEmbed('Error', 'An error occurred while starting the Minecraft server.', 0xff0000)],
                ephemeral: true,
            });
        }
        console.log(`Minecraft server started: ${stdout}`);
        interaction.reply({
            embeds: [createEmbed('Success', 'The Minecraft server has been successfully started!', 0x00ff00)],
            ephemeral: true,
        });
    });
}

module.exports = {
    data: {
        name: 'startminecraft',
        description: 'Start the Minecraft server.',
    },
    execute: startMinecraftServer,
};