const { SlashCommandBuilder } = require('discord.js');
const { getConfig, initializeDatabase } = require('../utils.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unblock')
        .setDescription('Unblocks a user from using the bot.')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to unblock')
                .setRequired(true)),
    async execute(interaction) {
        const config = getConfig();
        const userId = interaction.user.id;

        if (userId !== config.ownerId) {
            return interaction.reply({ content: 'You do not have permission to use this command.', flags: 64 });
        }

        const db = await initializeDatabase();
        const blockedUsers = db.blockedUsers;

        const targetUser = interaction.options.getUser('user');

        const userDoc = await blockedUsers.findOne({ selector: { id: targetUser.id } }).exec();
        if (!userDoc) {
            return interaction.reply({ content: `User ${targetUser.tag} is not blocked.`, flags: 64 });
        }

        log('W', `UNBlocking user: ${targetUser.tag} (${targetUser.id}) for reason: ${reason}`, interaction.user.tag);


        await userDoc.remove();

        await interaction.reply({ content: `User ${targetUser.tag} has been unblocked.`, flags: 64 });
    }
};