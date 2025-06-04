// Example ticket command: ticket.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Open a support ticket'),
  async execute(interaction) {
    // Simple ticket system: create a private channel for the user
    const guild = interaction.guild;
    const user = interaction.user;
    const channel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: 0, // 0 = GUILD_TEXT
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: user.id,
          allow: [PermissionFlagsBits.ViewChannel],
        },
      ],
    });
    await interaction.reply({ content: `Ticket created: ${channel}`, ephemeral: true });
  },
};
