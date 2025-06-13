// Utility: help.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('🏴‍☠️ Parancsok listája és súgó'),
  async execute(interaction) {
    // Build a prettier help embed
    const embed = new EmbedBuilder()
      .setTitle('🏴‍☠️❓ Súgó')
      .setDescription('🏴‍☠️ Elérhető parancsok:')
      .setColor(0x5865F2)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .addFields(
        { name: '🛡️ Moderáció', value: '`ban` (kitiltás), `kick` (kirúgás), `mute` (némítás), `warn` (figyelmeztetés), `purge` (üzenetek törlése), `kickrole` (szerephez tartozók kirúgása)', inline: false },
        { name: '🎫 Jegyek', value: '`ticket` (jegy nyitása), `close` (jegy lezárása)', inline: false },
        { name: '🛠️ Segédletek', value: '`info` (szerver infó), `help` (súgó), `serverstats` (szerver statisztika), `guildconfig` (szerver beállítás), `rank` (rangod), `leaderboard` (ranglista), `work` (munka), `shop` (bolt), `buy` (vásárlás), `gamble` (szerencsejáték)', inline: false },
        { name: '🔎 Napló lekérdezés', value: '`lookupuser <felhasználó>` (globális naplók)\n`lookupguild` (szerver naplók)', inline: false },
        { name: '🎉 Szórakozás', value: '`meme` (mém), `joke` (vicc), `8ball` (varázsgömb)', inline: false }
      )
      .setFooter({ text: '🏴‍☠️ Nyx súgó rendszer' })
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
