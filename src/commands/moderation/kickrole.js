const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kickrole')
    .setDescription('Kick all members with a specific role')
    .addRoleOption(option =>
      option.setName('role').setDescription('Role to kick').setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ content: 'You do not have permission to kick members.', ephemeral: true });
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
      .setTitle('Kick Role Results')
      .setDescription(`Attempted to kick all members with the role <@&${role.id}>.`)
      .addFields(
        { name: 'Kicked', value: String(kicked), inline: true },
        { name: 'Failed', value: String(failed), inline: true }
      )
      .setColor('Orange');
    await interaction.reply({ embeds: [embed] });
  },
};
