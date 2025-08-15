// Utility: lookupuser.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readGlobalUserLogs } = require('../../../utils/mysql.js');

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
      return interaction.reply({ content: 'Nincsenek naplók ehhez a felhasználóhoz.', ephemeral: true });
    }
    let page = 0;
    const pageSize = 5;
    const getPageEmbed = (page) => {
      const embed = new EmbedBuilder()
        .setTitle('🏴‍☠️👤 Felhasználó infó')
        .setDescription(`🏴‍☠️ Információk <@${user.id}> felhasználóról:`)
        .setColor(0x3498db)
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: '🏴‍☠️ Felhasználó napló lekérdezés • Nyx' })
        .setTimestamp();
      const slice = logs.slice(page * pageSize, (page + 1) * pageSize);
      slice.forEach((log, i) => {
        embed.addFields({
          name: `• ${log.type || 'Ismeretlen'} — ${log.reason || 'Nincs megadva ok'}`,
          value: `Szerver: ${log.guildId || 'Ismeretlen'} | Moderátor: <@${log.moderatorId}>\nIdőpont: ${new Date(log.timestamp).toLocaleString()}`,
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
