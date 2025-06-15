// Utility: help.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('🏴‍☠️ Parancsok listája és súgó'),
  async execute(interaction) {
    // Help pages
    const pages = [
      new EmbedBuilder()
        .setTitle('🛡️ Moderáció')
        .setDescription('Moderációs parancsok')
        .addFields({ name: 'Parancsok', value: '`ban`, `kick`, `warn`, `purge`, `kickrole`, `giverole`, `deleterole`' })
        .setColor(0x5865F2),
      new EmbedBuilder()
        .setTitle('🛠️ Segédletek')
        .setDescription('Utility parancsok')
        .addFields({ name: 'Parancsok', value: '`info`, `help`, `serverstats`, `guildconfig`, `rank`, `leaderboard`' })
        .setColor(0x5865F2),
      new EmbedBuilder()
        .setTitle('🔎 Napló lekérdezés')
        .setDescription('Napló lekérdező parancsok')
        .addFields({ name: 'Parancsok', value: '`lookupuser <user>`, `lookupguild`' })
        .setColor(0x5865F2),
      new EmbedBuilder()
        .setTitle('🎉 Szórakozás')
        .setDescription('Szórakoztató parancsok')
        .addFields({ name: 'Parancsok', value: '`meme`, `joke`, `8ball`' })
        .setColor(0x5865F2)
    ];
    let page = 0;
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('help_prev').setLabel('Előző').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('help_next').setLabel('Következő').setStyle(ButtonStyle.Primary)
    );
    const reply = await interaction.reply({ embeds: [pages[page]], components: [row], ephemeral: true, fetchReply: true });
    const collector = reply.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 120000 });
    collector.on('collect', async i => {
      if (i.customId === 'help_prev') page = Math.max(0, page - 1);
      if (i.customId === 'help_next') page = Math.min(pages.length - 1, page + 1);
      await i.update({
        embeds: [pages[page]],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('help_prev').setLabel('Előző').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
            new ButtonBuilder().setCustomId('help_next').setLabel('Következő').setStyle(ButtonStyle.Primary).setDisabled(page === pages.length - 1)
          )
        ]
      });
    });
    // Naplózás minden help parancs használatról saját jsondb-vel
    await appendUserLog('help_requests', interaction.user.id, interaction.guild.id, {
      type: 'help',
      user: interaction.user.id,
      date: Date.now()
    }, interaction.user.username);
  },
};
