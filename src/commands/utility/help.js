// Utility: help.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all commands'),
  async execute(interaction) {
    // Build a prettier help embed
    const embed = new EmbedBuilder()
      .setTitle('🆘 Help & Commands')
      .setDescription('Here are all available commands. Use `/lookupuser` and `/lookupguild` for log lookups!')
      .setColor(0x5865F2)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .addFields(
        { name: '🛡️ Moderation', value: '`ban`, `kick`, `mute`, `warn`, `purge`, `kickrole`', inline: false },
        { name: '🎫 Tickets', value: '`ticket`, `close`', inline: false },
        { name: '🛠️ Utility', value: '`info`, `help`, `serverstats`, `guildconfig`, `rank`, `leaderboard`, `work`, `shop`, `buy`, `gamble`', inline: false },
        { name: '🔎 Log Lookup', value: '`lookupuser <user>` (global logs)\n`lookupguild` (guild logs)', inline: false },
        { name: '🎉 Entertainment', value: '`meme`, `joke`, `8ball`', inline: false }
      )
      .setFooter({ text: 'Tip: Use the buttons in lookup commands to navigate pages.' })
      .setTimestamp();
    // Log help command usage
    await appendUserLog('logs', interaction.user.id, interaction.guild.id, {
      event_type: 'HELP',
      reason: 'Viewed help',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    }, interaction.user.username);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
