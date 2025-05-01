const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Kitilt egy adott felhasználót a szerverről.')
        .addUserOption(option =>
            option.setName('felhasználó')
                .setDescription('A kitiltandó felhasználó')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('indok')
                .setDescription('A kitiltás oka')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('felhasználó');
        const reason = interaction.options.getString('indok') || 'Nem adott meg indokot.';

        // Ellenőrizzük, hogy van-e a felhasználónak kitiltási joga
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({
                content: 'Nincs jogod kitiltani másokat.',
                ephemeral: true,
            });
        }

        // Ellenőrizzük, hogy a botnak van-e kitiltási joga
        const botMember = await interaction.guild.members.fetchMe();
        if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({
                content: 'Nincs jogosultságom kitiltani tagokat.',
                ephemeral: true,
            });
        }

        try {
            // Lekérdezzük a felhasználót a szerverről
            const member = await interaction.guild.members.fetch(user.id);

            if (!member) {
                return interaction.reply({
                    content: 'A megadott felhasználó nem található a szerveren.',
                    ephemeral: true,
                });
            }

            // Küldjünk egy privát üzenetet a felhasználónak a tiltásról
            await user.send(`Szia ${user.username},\nKi lettél tiltva a szerverről. Indok: ${reason}`)
                .catch(error => console.log(`Nem sikerült üzenetet küldeni ${user.tag} számára.`));

            // Tiltjuk a felhasználót
            await member.ban({ reason });
            await interaction.reply({
                content: `✅ ${user.tag} sikeresen kitiltva a szerverről. Indok: ${reason}`,
            });
        } catch (error) {
            console.error('Hiba történt a kitiltás során:', error);
            interaction.reply({
                content: 'Hiba történt a felhasználó kitiltásakor.',
                ephemeral: true,
            });
        }
    },
};
