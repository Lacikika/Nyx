const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserActivity } = require('../database.js');
const { loging } = require('../utils.js');
function getRank(messageCount) {
    if (messageCount < 100) return 'Új fiú';
    if (messageCount >= 100 && messageCount < 500) return 'Kezdő';
    if (messageCount >= 500 && messageCount < 1000) return 'Közepes';
    if (messageCount >= 1000 && messageCount < 2500) return 'Pro';
    return 'Veteran';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Check your rank based on activity!'),

    async execute(interaction) {
        const userId = interaction.user.id;

        // Get user's message count from the database
        getUserActivity(userId, async (messageCount) => {
            const rank = getRank(messageCount);

            const embed = new EmbedBuilder()
                .setTitle(`${interaction.user.username}'s Rank`)
                .setDescription(`Messages Sent: ${messageCount}\nRank: ${rank}`)

            await interaction.reply({ embeds: [embed] });
            loging('I', `has checked their rank`, interaction.user.username);
        });
    }
};
