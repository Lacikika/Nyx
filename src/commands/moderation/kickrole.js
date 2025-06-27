const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kickrole')
    .setDescription('Osszes tag kirugasa egy szerep alapjan  ')
    .addRoleOption(option =>
      option.setName('role').setDescription('Role to kick').setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Ehhez a parancshoz Kick Members vagy Admin jogosultság szükséges.', ephemeral: true });
    }
    const role = interaction.options.getRole('role');
    if (!role) return interaction.reply({ content: 'Role not found.', ephemeral: true });
    const members = role.members.filter(m => !m.user.bot && m.kickable);
    if (!members.size) return interaction.reply({ content: 'No kickable members found with that role.', ephemeral: true });
    let kicked = 0, failed = 0;
    for (const member of members.values()) {
      try {
        await member.kick('Kicked by /kickrole command');
        kicked++;
      } catch {
        failed++;
      }
    }
    const embed = new EmbedBuilder()
      .setTitle('Szerephez tartozók kirúgása')
      .setDescription('A kiválasztott szereppel rendelkező tagok kirúgva.')
      .addFields(
        { name: 'Kirúgva', value: String(kicked), inline: true },
        { name: 'Sikertelen', value: String(failed), inline: true }
      )
      .setColor('Orange')
      .setFooter({ text: '⛏️ by Laci 🛠️' });
    await interaction.reply({ embeds: [embed] });
  },
};
