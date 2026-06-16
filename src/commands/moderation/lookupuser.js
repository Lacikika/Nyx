const botConfig = require("../../config.js");
// Utility: lookupuser.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readGlobalUserLogs } = require('../../../utils/jsondb.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lookupuser')
    .setDescription('Felhasznalo informaciok lekerdezese  ')
    .addUserOption(option =>
      option.setName('target').setDescription('User to lookup').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('target');
    const logs = await readGlobalUserLogs(user.id);
    if (!logs.length) {
      return interaction.reply({ content: 'Nincsenek naplók ehhez a felhasználóhoz.', flags: 64 });
    }
    let page = 0;
    const pageSize = 5;
    const getPageEmbed = (page) => {
      const embed = new EmbedBuilder()
        .setTitle('🏴‍☠️👤 Felhasználó infó')
        .setDescription(`🏴‍☠️ Információk <@${user.id}> felhasználóról:`)
        .setColor(botConfig.customization.embedColors.info)
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: '🏴‍☠️ Felhasználó napló lekérdezés • Nyx' })
        .setTimestamp();
      const slice = logs.slice(page * pageSize, (page + 1) * pageSize);
      slice.forEach((log, i) => {
        embed.addFields({
          name: `• ${log.event_type || log.action || 'Ismeretlen'} — ${log.reason || log.message_content || 'Nincs megadva ok'}`,
          value: `Szerver: ${log.guildId || 'Ismeretlen'} | Csatorna: <#${log.channel_id || 'N/A'}>\nIdőpont: ${log.timestamp || log.date || 'Ismeretlen'}`,
          inline: false
        });
      });
      return embed;
    };
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev').setLabel('Előző oldal').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('next').setLabel('Következő oldal').setStyle(ButtonStyle.Secondary)
    );
    const reply = await interaction.reply({ embeds: [getPageEmbed(page)], components: [row], flags: 64 });
    const collector = reply.createMessageComponentCollector({ time: 60000 });
    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) return i.reply({ content: 'Ez nem a te műveleted.', flags: 64 });
      if (i.customId === 'prev' && page > 0) page--;
      if (i.customId === 'next' && (page + 1) * pageSize < logs.length) page++;
      await i.update({ embeds: [getPageEmbed(page)], components: [row] });
    });
    collector.on('end', () => {
      reply.edit({ components: [] }).catch(() => {});
    });
  },
};
