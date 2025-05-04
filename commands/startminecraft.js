const { exec, spawn } = require('child_process');
const { createEmbed } = require('../utils.js');
const { getConfig } = require('../utils.js');
const { SlashCommandBuilder } = require('discord.js');

const config = getConfig();
/**
 * Starts the Minecraft server.
 * @param {Interaction} interaction - The interaction object from Discord.js.
 */
async function startMinecraftServer(interaction) {
    // Check if the user has permission to start the server
    const authorizedUserId = config.ownerId ; // Replace with the actual user ID of the authorized user
    if (interaction.user.id !== authorizedUserId) {
        return interaction.reply({
            embeds: [createEmbed('Access Denied', 'You do not have permission to start the Minecraft server.', 0xff0000)],
            ephemeral: true,
        });
    }

    // Acknowledge the interaction immediately
    await interaction.deferReply({ ephemeral: true });

    // Start the Minecraft server in a new window
    const serverProcess = spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', 'java -Xmx1024M -Xms1024M -jar server.jar nogui'], {
        cwd: './data/minecraft',
        shell: true,
    });

    serverProcess.on('error', (error) => {
        console.error(`Error starting Minecraft server: ${error.message}`);
        interaction.editReply({
            embeds: [createEmbed('Error', `An error occurred while starting the Minecraft server: ${error.message}`, 0xff0000)],
        });
    });

    serverProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Minecraft server process exited with code ${code}`);
            interaction.editReply({
                embeds: [createEmbed('Error', `The Minecraft server process exited with code ${code}.`, 0xff0000)],
            });
        } else {
            interaction.editReply({
                embeds: [createEmbed('Success', 'The Minecraft server has been successfully started in a new window!', 0x00ff00)],
            });
        }
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startminecraft')
        .setDescription('Start the Minecraft server.'),
    execute: startMinecraftServer,
};