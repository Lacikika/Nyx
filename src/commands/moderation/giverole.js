const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rangadas')
    .setDescription('Rang jovahagyas staff altal  ')
    .addUserOption(opt => opt.setName('user').setDescription('Felhasználó').setRequired(true))
    .addRoleOption(opt => opt.setName('role').setDescription('Rang').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Indok').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const reason = interaction.options.getString('reason');
    const guildId = interaction.guild.id;
    const config = await readUser('guilds', guildId, guildId);
    const requestRoles = config.requestRoles || [];
    if (requestRoles.length > 0 && !interaction.member.roles.cache.some(r => requestRoles.includes(r.id))) {
      return interaction.reply({ content: 'Nincs jogosultságod rang kérelmezéséhez. Csak a kijelölt rang kérelmező rangok tagjai kérhetnek rangot.', flags: 64 });
    }
    const staffRoles = config.staffRoles || (config.staffRole ? [config.staffRole] : []);
    const logChannelId = config.rolesChannel || config.logChannel;
    const cooldownRoleId = config.roleCooldown;
    // NE lehessen give role-t kérni, ha rajta van a cooldown rang
    if (interaction.commandName === 'giverole' && cooldownRoleId) {
      const member = await interaction.guild.members.fetch(user.id);
      if (member.roles.cache.has(cooldownRoleId)) {
        return interaction.reply({ content: 'Ez a felhasználó cooldown-on van, amíg rajta van a cooldown rang, nem kérhet új rangot!', flags: 64 });
      }
    }
    if (!logChannelId || !staffRoles.length) {
      return interaction.reply({ content: 'A roles channel vagy staff role nincs beállítva a szerver konfigurációban!', flags: 64 });
    }
    const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel) return interaction.reply({ content: 'A roles channel nem található!', flags: 64 });
    const embed = new EmbedBuilder()
      .setTitle('🏆 Rang jóváhagyás')
      .setDescription(`Felhasználó: <@${user.id}>\nRang: <@&${role.id}>\nIndok: ${reason}`)
      .addFields(
        { name: 'Kérelmezte', value: `<@${interaction.user.id}>`, inline: true },)
      .setColor('Yellow')
      .setFooter({ text: `⛏️ by Laci🛠️` })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('giverole_accept').setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('giverole_decline').setEmoji('❌').setStyle(ButtonStyle.Danger)
    );
    const msg = await logChannel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'A rang jóváhagyási kérelem elküldve a staff csatornába!', ephemeral: true });
    const filter = i => i.member.roles.cache.some(r => staffRoles.includes(r.id)) && ['giverole_accept','giverole_decline'].includes(i.customId);
    const collector = msg.createMessageComponentCollector({ filter, max: 1, time: 5 * 60 * 1000 });
    collector.on('collect', async i => {
      // Kérjünk be indokot egy új embeddel a csatornában, csak a staff számára
      const reasonEmbed = new EmbedBuilder()
        .setTitle(i.customId === 'giverole_accept' ? '✅ Indok a rang kiosztásához' : '❌ Indok az elutasításhoz')
        .setDescription(`Írd be az indokot erre a döntésre, csak te látod! (60mp)`)
        .setColor(i.customId === 'giverole_accept' ? 'Green' : 'Red')
        .setFooter({ text: `Staff: ${i.user.tag}` })
        .setTimestamp();
      const reasonMsg = await i.reply({ embeds: [reasonEmbed], ephemeral: true, fetchReply: true });
      // Várjuk a staff válaszát a csatornában (ephemeral, csak ő látja)
      const msgFilter = m => m.author.id === i.user.id && m.channelId === i.channel.id;
      const collected = await i.channel.awaitMessages({ filter: msgFilter, max: 1, time: 60000 });
      if (collected.size > 0) {
        const m = collected.first();
        try { await m.delete(); } catch {}
        if (i.customId === 'giverole_accept') {
          const targetMember = await interaction.guild.members.fetch(user.id);
          await targetMember.roles.add(role);
          await msg.edit({ embeds: [embed.setColor('Green').setFooter({ text: `Elfogadta: ${i.user.tag} | Indok: ${m.content}` })], components: [] });
          await msg.delete().catch(() => {});
          const approveEmbed = new EmbedBuilder()
            .setTitle('✅ Rang kiosztva')
            .setDescription(`Felhasználó: <@${user.id}>\nRang: <@&${role.id}>\nIndok: ${reason}`)
            .addFields(
              { name: 'Staff indok', value: `${m.content}\n**Staff:** <@${i.user.id}>` },
              { name: 'Kérelmezte', value: `<@${interaction.user.id}>`, inline: true }
            )
            .setColor('Green')
            .setFooter({ text: `Elfogadta: ${i.user.tag}` })
            .setTimestamp();
          await logChannel.send({ embeds: [approveEmbed] });
        } else {
          await msg.edit({ embeds: [embed.setColor('Red').setFooter({ text: `Elutasította: ${i.user.tag} | Indok: ${m.content}` })], components: [] });
          await msg.delete().catch(() => {});
          const declineEmbed = new EmbedBuilder()
            .setTitle('❌ Rang elutasítva')
            .setDescription(`Felhasználó: <@${user.id}>\nRang: <@&${role.id}>\nIndok: ${reason}`)
            .addFields(
              { name: 'Staff indok', value: `${m.content}\n**Staff:** <@${i.user.id}>` },
              { name: 'Kérelmezte', value: `<@${interaction.user.id}>`, inline: true }
            )
            .setColor('Red')
            .setFooter({ text: `Elutasította: ${i.user.tag}` })
            .setTimestamp();
          await logChannel.send({ embeds: [declineEmbed] });
        }
      } else {
        await i.followUp({ content: 'Nem érkezett indok, a rang nem került kiosztásra/elutasítva.', ephemeral: true });
      }
    });
    // Jogosultság-ellenőrzés: csak staff vagy ManageRoles jogosultsággal
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Ehhez a parancshoz Manage Roles vagy Admin jogosultság szükséges!', ephemeral: true });
    }
    // Naplózás minden rangkérelemről saját jsondb-vel
    await appendUserLog('role_requests', interaction.user.id, guildId, {
      type: 'giverole',
      staff: interaction.user.id,
      target: user.id,
      role: role.id,
      reason,
      date: Date.now()
    }, interaction.user.username);
  }
};
