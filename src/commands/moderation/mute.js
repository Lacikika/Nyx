// Mute command (role-based)
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

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
    // Log mute to user log and update profile
    const guildId = interaction.guild.id;
    await appendUserLog('logs', member.id, guildId, {
      event_type: 'MUTE',
      reason: 'Muted by command',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    }, member.user.username);
    const profile = await readUser('profiles', member.id, guildId);
    profile.total_mutes = (profile.total_mutes || 0) + 1;
    profile.last_seen = Date.now();
    await writeUser('profiles', member.id, guildId, profile);
    // Log to channel
    const embed = new EmbedBuilder()
      .setTitle('User Muted')
      .setDescription(`${member.user.tag} was muted.`)
      .setColor('Orange');
    interaction.client.logToGuildChannel(guildId, embed);
    await interaction.reply({ embeds: [embed] });
  },
};
