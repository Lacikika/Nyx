// Mute command (role-based)
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a member in the server')
    .addUserOption(option =>
      option.setName('target').setDescription('User to mute').setRequired(true)),
  async execute(interaction) {
    const member = interaction.options.getMember('target');
    if (!interaction.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
      const embed = new EmbedBuilder()
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to mute members.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    let muteRole = interaction.guild.roles.cache.find(r => r.name === 'Muted');
    if (!muteRole) {
      muteRole = await interaction.guild.roles.create({ name: 'Muted', permissions: [] });
      interaction.guild.channels.cache.forEach(async (channel) => {
        await channel.permissionOverwrites.create(muteRole, { SendMessages: false, AddReactions: false });
      });
    }
    await member.roles.add(muteRole);
    // Log mute to database
    await pool.query('INSERT INTO warnings (user_id, guild_id, reason, warned_by, date) VALUES ($1, $2, $3, $4, NOW())', [member.id, interaction.guild.id, 'Muted by command', interaction.user.id]);
    const embed = new EmbedBuilder()
      .setTitle('User Muted')
      .setDescription(`${member.user.tag} was muted.`)
      .setColor('Orange');
    await interaction.reply({ embeds: [embed] });
  },
};
