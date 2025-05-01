const { SlashCommandBuilder } = require('discord.js');
const { getConfig, initializeDatabase, log} = require('../utils.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('block')
        .setDescription('Blocks a user from using the bot.')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to block')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for blocking the user')
                .setRequired(false)),
    async execute(interaction) {
        const config = getConfig();
        const userId = interaction.user.id;

        if (userId !== config.ownerId) {
            return interaction.reply({ content: 'You do not have permission to use this command.', flags: 64 });
        }

        const db = await initializeDatabase();
        const blockedUsers = db.blockedUsers;

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        log('I', `Blocking user: ${targetUser.tag} (${targetUser.id}) for reason: ${reason}`, interaction.user.tag);

        await blockedUsers.insert({ id: targetUser.id, reason });

        await interaction.reply({ content: `User ${targetUser.tag} has been blocked.`, flags: 64 });
    }
};