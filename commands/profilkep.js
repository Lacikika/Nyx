const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profilkep')
        .setDescription('Megmutatja a profilképedet vagy egy megadott felhasználó profilképét.')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('A felhasználó, akinek a profilképét meg szeretnéd nézni')),
    async execute(interaction) {
        // Get the user mentioned in the command, or fall back to the command invoker
        const user = interaction.options.getUser('user') || interaction.user;
        const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 }); // Get the user's avatar URL

        await interaction.reply({ 
            content: `${user} profilképe:`, // Tag the user in the response
            embeds: [{
                image: {
                    url: avatarUrl, // Set the avatar URL in the embed
                },
            }],
        });
    },
};
