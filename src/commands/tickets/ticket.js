// Example ticket command: ticket.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Open a support ticket'),
  async execute(interaction) {
    const guild = interaction.guild;
    const user = interaction.user;
    // Create ticket channel
    const channel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: 0, // GUILD_TEXT
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel] },
      ],
    });
    // Ticket embed with close button
    const embed = new EmbedBuilder()
      .setTitle('🎫 Ticket System')
      .setDescription('Open a support ticket for help!')
      .setColor(0x3498db)
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/3135/3135715.png')
      .addFields(
        { name: 'How it works', value: '• `/ticket` to open a ticket\n• Use the red button to close your ticket when done' }
      )
      .setFooter({ text: 'Our staff will be with you shortly!' })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
    // Button collector for close button
    const filter = i => i.customId === 'close_ticket' && i.user.id === user.id;
    const collector = sentMsg.createMessageComponentCollector({ filter, time: 60 * 60 * 1000 }); // 1 hour
    collector.on('collect', async i => {
      // Confirm close with embed and buttons
      const confirmEmbed = new EmbedBuilder()
        .setTitle('Close Ticket')
        .setDescription('Are you sure you want to close this ticket?')
        .setColor('Red');
      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_close_ticket')
          .setLabel('Confirm Close')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_close_ticket')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary)
      );
      await i.reply({ embeds: [confirmEmbed], components: [confirmRow], ephemeral: true });
      const confirmCollector = i.channel.createMessageComponentCollector({
        filter: btn => ['confirm_close_ticket', 'cancel_close_ticket'].includes(btn.customId) && btn.user.id === user.id,
        time: 30000,
        max: 1
      });
      confirmCollector.on('collect', async btn => {
        if (btn.customId === 'confirm_close_ticket') {
          await appendUserLog('logs', user.id, guild.id, {
            event_type: 'TICKET',
            reason: 'Closed a ticket',
            warned_by: user.id,
            channel_id: channel.id,
            message_id: btn.id,
            message_content: null,
            date: Date.now()
          }, user.username);
          await btn.update({ content: 'Ticket closed.', embeds: [], components: [] });
          setTimeout(() => channel.delete().catch(() => {}), 2000);
        } else {
          await btn.update({ content: 'Ticket close cancelled.', embeds: [], components: [] });
        }
      });
    });
    // Log ticket creation
    await appendUserLog('logs', user.id, guild.id, {
      event_type: 'TICKET',
      reason: 'Opened a ticket',
      warned_by: user.id,
      channel_id: channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    }, user.username);
  },
};
