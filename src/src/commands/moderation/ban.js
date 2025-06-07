// Ban command
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(option =>
      option.setName('target').setDescription('User to ban').setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      const embed = new EmbedBuilder()
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to ban members.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
    const member = interaction.options.getMember('target');
    if (!member.bannable) {
      const embed = new EmbedBuilder()
        .setTitle('Ban Failed')
        .setDescription('I cannot ban this user.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
    // Fetch audit log entry for ban
    let auditLog = null;
    try {
      const fetched = await interaction.guild.fetchAuditLogs({ type: 22, limit: 1 }); // 22 = MEMBER_BAN_ADD
      auditLog = fetched.entries.first() || null;
    } catch {}
    await member.ban();
    const embed = new EmbedBuilder()
      .setTitle('User Banned')
      .setDescription(`${member.user.tag} was banned.`)
      .setColor('Orange');
    await interaction.reply({ embeds: [embed] });
  },
};
