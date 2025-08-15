// Utility: lookupguild.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readGuildLogs, readUser } = require('../../../utils/mysql.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lookupguild')
    .setDescription('Szerver informaciok lekerdezese  '),
  async execute(interaction) {
    const guildId = interaction.guild.id;

    // Check permissions
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const guildConfig = await readUser('guilds', guildId, guildId);
    const staffRoles = guildConfig?.config?.staffRoles || [];
    const hasStaffRole = member.roles.cache.some(role => staffRoles.includes(role.id));
    const hasAdmin = member.permissions.has('Administrator');

    if (!hasAdmin && !hasStaffRole) {
      return interaction.reply({ content: 'Nincs jogosultságod ehhez a parancshoz.', ephemeral: true });
    }

    const logs = await readGuildLogs(guildId);
    if (!logs.length) {
      return interaction.reply({ content: 'Nincsenek naplók ehhez a szerverhez.', ephemeral: true });
    }

    let page = 0;
    const pageSize = 5;
    const getPageEmbed = (page) => {
      const embed = new EmbedBuilder()
        .setTitle('🏴‍☠️🏰 Szerver naplók')
        .setDescription('🏴‍☠️ Ezen a szerveren történt események:')
        .setColor(0x3498db)
        .setThumbnail(interaction.guild.iconURL())
        .setFooter({ text: '🏴‍☠️ Szerver napló lekérdezés • Nyx' })
        .setTimestamp();
      const slice = logs.slice(page * pageSize, (page + 1) * pageSize);
      slice.forEach((log, i) => {
        embed.addFields({
          name: `• ${log.type || 'Ismeretlen'} — ${log.reason || 'Nincs megadva ok'}`,
          value: `Felhasználó: <@${log.userId || 'Ismeretlen'}> | Moderátor: <@${log.moderatorId}>\nIdőpont: ${new Date(log.timestamp).toLocaleString()}`,
          inline: false
        });
      });
      return embed;
    };
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev').setLabel('Előző oldal').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('next').setLabel('Következő oldal').setStyle(ButtonStyle.Secondary)
    );
    const reply = await interaction.reply({ embeds: [getPageEmbed(page)], components: [row], ephemeral: true });
    const collector = reply.createMessageComponentCollector({ time: 60000 });
    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) return i.reply({ content: 'Ez nem a te műveleted.', ephemeral: true });
      if (i.customId === 'prev' && page > 0) page--;
      if (i.customId === 'next' && (page + 1) * pageSize < logs.length) page++;
      await i.update({ embeds: [getPageEmbed(page)], components: [row] });
    });
    collector.on('end', () => {
      reply.edit({ components: [] }).catch(() => {});
    });
  },
};
