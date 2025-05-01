const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Töröl üzeneteket a csatornából.')
        .addIntegerOption(option => 
            option.setName('count')
                .setDescription('A törlendő üzenetek száma (maximum 100).')
                .setRequired(false)),
    async execute(interaction) {
        // Get the count option; default to 0 if not provided
        const count = interaction.options.getInteger('count');

        try {
            // If count is not specified, delete all messages in the channel
            if (!count) {
                // Fetch all messages in the channel
                const fetchedMessages = await interaction.channel.messages.fetch({ limit: 100 });
                await interaction.channel.bulkDelete(fetchedMessages);
                await interaction.reply({ content: `✅ Törölve lettek az összes üzenet a csatornából.`, ephemeral: true });
            } else if (count > 0 && count <= 100) {
                // Delete a specified number of messages
                const fetchedMessages = await interaction.channel.messages.fetch({ limit: count });
                await interaction.channel.bulkDelete(fetchedMessages);
                await interaction.reply({ content: `✅ ${count} üzenet törölve lett!`, ephemeral: true });
            } else {
                // If count is out of range
                await interaction.reply({ content: '❌ Kérlek, adj meg egy 1 és 100 közötti számot!', ephemeral: true });
            }
        } catch (error) {
            console.error('Error clearing messages:', error);
            await interaction.reply({ content: '❌ Hiba történt az üzenetek törlése közben!', ephemeral: true });
        }
    },
};
