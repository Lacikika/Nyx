const { SlashCommandBuilder } = require('discord.js');
const { getConfig } = require('../utils.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('appeal')
        .setDescription('Send an appeal request to the bot owner.')
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the appeal')
                .setRequired(true)),
    async execute(interaction) {
        const config = getConfig();
        const appealChannelId = config.appealChannelId;

        if (!appealChannelId) {
            return interaction.reply({ content: 'Appeal channel is not configured.', flags: 64 });
        }

        const appealChannel = interaction.client.channels.cache.get(appealChannelId);
        if (!appealChannel) {
            return interaction.reply({ content: 'Appeal channel not found.', flags: 64 });
        }

        const reason = interaction.options.getString('reason');

        await appealChannel.send({
            content: `Appeal request from ${interaction.user.tag} (${interaction.user.id}): ${reason}`
        });

        await interaction.reply({ content: 'Your appeal has been sent.', flags: 64 });
    }
};