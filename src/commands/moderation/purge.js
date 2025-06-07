// Purge command
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a number of messages from a channel')
    .addIntegerOption(option =>
      option.setName('amount').setDescription('Number of messages to delete').setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      const embed = new EmbedBuilder()
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to manage messages.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    const amount = interaction.options.getInteger('amount');
    if (amount < 1 || amount > 100) {
      const embed = new EmbedBuilder()
        .setTitle('Invalid Amount')
        .setDescription('You need to input a number between 1 and 100.')
        .setColor('Red');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    await interaction.channel.bulkDelete(amount, true);
    // Log purge to user log and update profile
    const guildId = interaction.guild.id;
    await appendUserLog('logs', interaction.user.id, guildId, {
      event_type: 'PURGE',
      reason: `Purged ${amount} messages`,
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    });
    const profile = await readUser('profiles', interaction.user.id, guildId);
    profile.total_purges = (profile.total_purges || 0) + 1;
    profile.last_seen = Date.now();
    await writeUser('profiles', interaction.user.id, guildId, profile);
    // Log to channel
    const embed = new EmbedBuilder()
      .setTitle('Messages Purged')
      .setDescription(`Deleted ${amount} messages.`)
      .setColor('Orange');
    interaction.client.logToGuildChannel(guildId, embed);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
