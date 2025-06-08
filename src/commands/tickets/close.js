// Ticket close command
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close your ticket'),
  async execute(interaction) {
    const channel = interaction.channel;
    if (!channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
    }
    // Confirm close with embed and button
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const embed = new EmbedBuilder()
      .setTitle('Close Ticket')
      .setDescription('Are you sure you want to close this ticket?')
      .setColor('Red');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_close_ticket')
        .setLabel('Confirm Close')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_close_ticket')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    );
    const msg = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true, fetchReply: true });
    // Button collector
    const filter = i => i.user.id === interaction.user.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 30000, max: 1 });
    collector.on('collect', async i => {
      if (i.customId === 'confirm_close_ticket') {
        await appendUserLog('logs', interaction.user.id, interaction.guild.id, {
          event_type: 'TICKET',
          reason: 'Closed a ticket',
          warned_by: interaction.user.id,
          channel_id: interaction.channel.id,
          message_id: interaction.id,
          message_content: null,
          date: Date.now()
        }, interaction.user.username);
        await i.update({ content: 'Ticket closed.', embeds: [], components: [] });
        setTimeout(() => channel.delete().catch(() => {}), 2000);
      } else {
        await i.update({ content: 'Ticket close cancelled.', embeds: [], components: [] });
      }
    });
  },
};
