const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Listázza az elérhető parancsokat.'),
    
    async execute(interaction) {
        const commandsList = interaction.client.commands.map(cmd => `**/${cmd.data.name}** - ${cmd.data.description}`).join('\n');

        await interaction.reply({
            content: `**Elérhető parancsok:**\n${commandsList}`,
            ephemeral: true, // Csak a parancs használója látja
        });
    },
};
