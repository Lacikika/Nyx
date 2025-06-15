// Example moderation command: kick.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(option =>
      option.setName('target').setDescription('User to kick').setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      const embed = new EmbedBuilder()
        .setTitle('Nincs jogosultság')
        .setDescription('Ehhez a parancshoz Kick Members vagy Admin jogosultság szükséges.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
    const member = interaction.options.getMember('target');
    if (!member.kickable) {
      const embed = new EmbedBuilder()
        .setTitle('Kirúgás sikertelen')
        .setDescription('Ezt a felhasználót nem tudom kirúgni.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
    await member.kick();
    // Log kick to user log and update profile
    const guildId = interaction.guild.id;
    await appendUserLog('logs', member.id, guildId, {
      event_type: 'KICK',
      reason: 'Kirúgva parancs által',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    }, member.user.username);
    const profile = await readUser('profiles', member.id, guildId);
    profile.total_kicks = (profile.total_kicks || 0) + 1;
    profile.last_seen = Date.now();
    await writeUser('profiles', member.id, guildId, profile);
    // Log to channel
    const embed = new EmbedBuilder()
      .setTitle('Felhasználó kirúgva')
      .setDescription(`${member.user.tag} ki lett rúgva.`)
      .setColor('Orange')
      .setFooter({ text: '⛏️ by Laci 🛠️' });
    interaction.client.logToGuildChannel(guildId, embed);
    await interaction.reply({ embeds: [embed] });
  },
};
