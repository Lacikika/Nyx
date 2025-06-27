const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rangtorles')
    .setDescription('Rang torlesenek staff altali jovahagyasa  ')
    .addUserOption(opt => opt.setName('felhasznalo').setDescription('Felhasznalo  ').setRequired(true))
    .addRoleOption(opt => opt.setName('rang').setDescription('Torlendo rang  ').setRequired(true))
    .addStringOption(opt => opt.setName('indok').setDescription('Indok  ').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('felhasznalo');
    const role = interaction.options.getRole('rang');
    const reason = interaction.options.getString('indok');
    const guildId = interaction.guild.id;
    const config = await readUser('guilds', guildId, guildId);
    const requestRoles = config.requestRoles || [];
    if (requestRoles.length > 0 && !interaction.member.roles.cache.some(r => requestRoles.includes(r.id))) {
      return interaction.reply({ content: 'Nincs jogosultsagod rang torlesenek kerelemezesehez. Csak a kijelolt rang kerelezo rangok tagjai kerhetnek rang torlest.  ', ephemeral: true });
    }
    const staffRoles = config.staffRoles || (config.staffRole ? [config.staffRole] : []);
    const deleteChannelId = config.deleteroleChannel;
    const cooldownRoleId = config.roleCooldown;
    if (!deleteChannelId || !staffRoles.length || !cooldownRoleId) {
      return interaction.reply({ content: 'A rangtorles csatorna, staff rang vagy cooldown rang nincs beallitva a szerver konfiguracioban!  ', ephemeral: true });
    }
    const deleteChannel = await interaction.guild.channels.fetch(deleteChannelId).catch(() => null);
    if (!deleteChannel) return interaction.reply({ content: 'A rangtorles csatorna nem talalhato!  ', ephemeral: true });
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Rang torles jovahagyas  ')
      .setDescription(`Felhasznalo: <@${user.id}>\nTorlendo rang: <@&${role.id}>\nIndok: ${reason}`)
      .addFields({ name: 'Kerelezte', value: `<@${interaction.user.id}>`, inline: true })
      .setColor('Orange')
      .setFooter({ text: 'by Laci' })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('deleterole_accept').setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('deleterole_decline').setEmoji('❌').setStyle(ButtonStyle.Danger)
    );
    const msg = await deleteChannel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'A rang torlesi kerelem elkuldve a staff csatornaba!  ', ephemeral: true });
    const filter = i => i.member.roles.cache.some(r => staffRoles.includes(r.id)) && ['deleterole_accept','deleterole_decline'].includes(i.customId);
    const collector = msg.createMessageComponentCollector({ filter, max: 1, time: 5 * 60 * 1000 });
    collector.on('collect', async i => {
      const reasonEmbed = new EmbedBuilder()
        .setTitle(i.customId === 'deleterole_accept' ? '✅ Indok a rang torlesehez  ' : '❌ Indok az elutasitashoz  ')
        .setDescription('Ird be az indokot erre a dontesre, csak te latod! (60mp, ekezet nelkul)')
        .setColor(i.customId === 'deleterole_accept' ? 'Green' : 'Red')
        .setFooter({ text: `Staff: ${i.user.tag}` })
        .setTimestamp();
      await i.reply({ embeds: [reasonEmbed], ephemeral: true, fetchReply: true });
      const msgFilter = m => m.author.id === i.user.id && m.channelId === i.channel.id;
      const collected = await i.channel.awaitMessages({ filter: msgFilter, max: 1, time: 60000 });
      if (collected.size > 0) {
        const m = collected.first();
        try { await m.delete(); } catch {}
        if (i.customId === 'deleterole_accept') {
          // Remove role from user, delete role, add cooldown role
          const targetMember = await interaction.guild.members.fetch(user.id);
          const cooldownRole = await interaction.guild.roles.fetch(cooldownRoleId).catch(() => null);
          if (targetMember.roles.cache.has(role.id)) await targetMember.roles.remove(role);
          let cooldownDays = 3;
          // Kérjünk be cooldown időt is (3-7 nap)
          await i.followUp({ content: 'Ird be hany napig legyen cooldown (3-7, alapertelmezett: 3, ekezet nelkul):', ephemeral: true });
          const cdFilter = m => m.author.id === i.user.id && m.channelId === i.channel.id && /^\d+$/.test(m.content.trim());
          const cdCollected = await i.channel.awaitMessages({ filter: cdFilter, max: 1, time: 30000 });
          if (cdCollected.size > 0) {
            const cdMsg = cdCollected.first();
            try { await cdMsg.delete(); } catch {}
            const val = parseInt(cdMsg.content.trim(), 10);
            if (val >= 3 && val <= 7) cooldownDays = val;
          }
          if (cooldownRole) await targetMember.roles.add(cooldownRole);
          // Mentsük az időt az adatbázisba (pl. profiles)
          const profile = await readUser('profiles', user.id, guildId);
          profile.role_cooldown = {
            role: cooldownRoleId,
            until: Date.now() + cooldownDays * 24 * 60 * 60 * 1000
          };
          await writeUser('profiles', user.id, guildId, profile);
          // NEM töröljük a rangot a szerverről, csak levesszük a felhasználóról
          await msg.delete().catch(() => {});
          const approveEmbed = new EmbedBuilder()
            .setTitle('✅ Rang eltavolitva a felhasznalorol  ')
            .setDescription(`Felhasznalo: <@${user.id}>\nEltavolitott rang: <@&${role.id}>\nIndok: ${reason}`)
            .addFields(
              { name: 'Staff indok', value: `${m.content}\n**Staff:** <@${i.user.id}>` },
              { name: 'Kerelezte', value: `<@${interaction.user.id}>`, inline: true },
              { name: 'Cooldown ido', value: `${cooldownDays} nap`, inline: true }
            )
            .setColor('Green')
            .setFooter({ text: `Elfogadta: ${i.user.tag}` })
            .setTimestamp();
          await deleteChannel.send({ embeds: [approveEmbed] });

          // Ertesito kuldese annak, akitol a rangot levettek
          try {
            await user.send({
              content: `Ertesites: A(z) **${role.name}** rangot eltavolitottak rolad. Indok: ${reason} Cooldown: ${cooldownDays} nap.  `
            });
          } catch (e) {
            // Ha nem lehet uzenetet kuldeni (pl. privat uzenetek tiltva), ne csinaljon semmit
          }
        } else {
          await msg.edit({ embeds: [embed.setColor('Red').setFooter({ text: `Elutasitotta: ${i.user.tag} | Indok: ${m.content}` })], components: [] });
          await msg.delete().catch(() => {});
          const declineEmbed = new EmbedBuilder()
            .setTitle('❌ Rang torles elutasitva  ')
            .setDescription(`Felhasznalo: <@${user.id}>\nTorlendo rang: <@&${role.id}>\nIndok: ${reason}`)
            .addFields(
              { name: 'Staff indok', value: `${m.content}\n**Staff:** <@${i.user.id}>` },
              { name: 'Kerelezte', value: `<@${interaction.user.id}>`, inline: true }
            )
            .setColor('Red')
            .setFooter({ text: `Elutasitotta: ${i.user.tag}` })
            .setTimestamp();
          await deleteChannel.send({ embeds: [declineEmbed] });

          // Ertesito kuldese annak, akitol a rangot nem vettek le (elutasitva)
          try {
            await user.send({
              content: `Ertesites: A(z) **${role.name}** rang torleset elutasitottak. Indok: ${reason}  `
            });
          } catch (e) {
            // Ha nem lehet uzenetet kuldeni (pl. privat uzenetek tiltva), ne csinaljon semmit
          }
        }
      } else {
        await i.followUp({ content: 'Nem erkezett indok, a rang nem kerult torlesre/elutasitva.  ', ephemeral: true });
      }
    });
    // Jogosultság-ellenőrzés: csak staff vagy ManageRoles jogosultsággal
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Ehhez a parancshoz Manage Roles vagy Admin jogosultsag szukseges!  ', ephemeral: true });
    }
    // Naplozas minden rangkerelomrol sajat jsondb-vel
    await appendUserLog('role_requests', interaction.user.id, guildId, {
      type: 'deleterole',
      staff: interaction.user.id,
      target: user.id,
      role: role.id,
      reason,
      date: Date.now()
    }, interaction.user.username);
  }
};
