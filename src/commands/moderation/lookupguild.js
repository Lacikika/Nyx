const botConfig = require("../../config.js");
// Utility: lookupguild.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readGuildLogs } = require('../../../utils/jsondb.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lookupguild')
    .setDescription('Szerver informaciok lekerdezese  '),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const logs = await readGuildLogs(guildId);
    if (!logs.length) {
      return interaction.reply({ content: 'Nincsenek naplók ehhez a szerverhez.', flags: 64 });
    }
    // Check if user has Administrator permission or a staff role
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const hasAdmin = member.permissions.has('Administrator');
    const staffRoleIds = ['STAFF_ROLE_ID_1', 'STAFF_ROLE_ID_2']; // Replace with actual staff role IDs
    const hasStaffRole = member.roles.cache.some(role => staffRoleIds.includes(role.id));
    if (!hasAdmin && !hasStaffRole) {
      return interaction.reply({ content: 'Nincs jogosultságod ehhez a parancshoz.', flags: 64 });
    }
    let page = 0;
    const pageSize = 5;
    const getPageEmbed = (page) => {
      const embed = new EmbedBuilder()
        .setTitle('🏴‍☠️🏰 Szerver naplók')
        .setDescription('🏴‍☠️ Ezen a szerveren történt események:')
        .setColor(botConfig.customization.embedColors.info)
        .setThumbnail(interaction.guild.iconURL())
        .setFooter({ text: '🏴‍☠️ Szerver napló lekérdezés • Nyx' })
        .setTimestamp();
      const slice = logs.slice(page * pageSize, (page + 1) * pageSize);
      slice.forEach((log, i) => {
        embed.addFields({
          name: `• ${log.event_type || log.action || 'Ismeretlen'} — ${log.reason || log.message_content || 'Nincs megadva ok'}`,
          value: `Felhasználó: ${log.username || log.userId || 'Ismeretlen'} | Csatorna: <#${log.channel_id || 'N/A'}>\nIdőpont: ${log.timestamp || log.date || 'Ismeretlen'}`,
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
