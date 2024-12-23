const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { setlogchannel , connection } = require('../utils.js'); // Adjust the path  connection = require('../utils.js'); // Adjust the path


module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlogchannel')
        .setDescription('Set the log channel for this server.')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to set as the log channel.')
                .setRequired(true)
        ),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        // Check if the user has the necessary permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: '❌ You need to be an administrator to use this command.',
                ephemeral: true,
            });
        }

        // Save the log channel in the database
        const guildId = interaction.guild.id;
        const channelId = channel.id;
        setlogchannel(guildId, channelId);

        interaction.reply({
            content: `✅ The log channel has been set to ${channel}.`,
            ephemeral: true,
        });
    },
};
