const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readUser, writeUser } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deleterole')
    .setDescription('Rang törlésének staff általi jóváhagyása')
    .addUserOption(opt => opt.setName('user').setDescription('Felhasználó').setRequired(true))
    .addRoleOption(opt => opt.setName('role').setDescription('Törlendő rang').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Indok').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const reason = interaction.options.getString('reason');
    const guildId = interaction.guild.id;
    const config = await readUser('guilds', guildId, guildId);
    const requestRoles = config.requestRoles || [];
    if (requestRoles.length > 0 && !interaction.member.roles.cache.some(r => requestRoles.includes(r.id))) {
      return interaction.reply({ content: 'Nincs jogosultságod rang törlésének kérelmezéséhez. Csak a kijelölt rang kérelmező rangok tagjai kérhetnek rang törlést.', ephemeral: true });
    }
    const staffRoles = config.staffRoles || (config.staffRole ? [config.staffRole] : []);
    const deleteChannelId = config.deleteroleChannel;
    const cooldownRoleId = config.roleCooldown;
    if (!deleteChannelId || !staffRoles.length || !cooldownRoleId) {
      return interaction.reply({ content: 'A deleterole channel, staff role vagy cooldown role nincs beállítva a szerver konfigurációban!', ephemeral: true });
    }
    const deleteChannel = await interaction.guild.channels.fetch(deleteChannelId).catch(() => null);
    if (!deleteChannel) return interaction.reply({ content: 'A deleterole channel nem található!', ephemeral: true });
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Rang törlés jóváhagyás')
      .setDescription(`Felhasználó: <@${user.id}>\nTörlendő rang: <@&${role.id}>\nIndok: ${reason}`)
      .addFields({ name: 'Kérelmezte', value: `<@${interaction.user.id}>`, inline: true })
      .setColor('Orange')
      .setFooter({ text: '⛏️ by Laci 🛠️' })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('deleterole_accept').setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('deleterole_decline').setEmoji('❌').setStyle(ButtonStyle.Danger)
    );
    const msg = await deleteChannel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'A rang törlési kérelem elküldve a staff csatornába!', ephemeral: true });
    const filter = i => i.member.roles.cache.some(r => staffRoles.includes(r.id)) && ['deleterole_accept','deleterole_decline'].includes(i.customId);
    const collector = msg.createMessageComponentCollector({ filter, max: 1, time: 5 * 60 * 1000 });
    collector.on('collect', async i => {
      const reasonEmbed = new EmbedBuilder()
        .setTitle(i.customId === 'deleterole_accept' ? '✅ Indok a rang törléséhez' : '❌ Indok az elutasításhoz')
        .setDescription('Írd be az indokot erre a döntésre, csak te látod! (60mp)')
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
          await i.followUp({ content: 'Írd be hány napig legyen cooldown (3-7, alapértelmezett: 3):', ephemeral: true });
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
            .setTitle('✅ Rang eltávolítva a felhasználóról')
            .setDescription(`Felhasználó: <@${user.id}>\nEltávolított rang: <@&${role.id}>\nIndok: ${reason}`)
            .addFields(
              { name: 'Staff indok', value: `${m.content}\n**Staff:** <@${i.user.id}>` },
              { name: 'Kérelmezte', value: `<@${interaction.user.id}>`, inline: true },
              { name: 'Cooldown idő', value: `${cooldownDays} nap`, inline: true }
            )
            .setColor('Green')
            .setFooter({ text: `Elfogadta: ${i.user.tag}` })
            .setTimestamp();
          await deleteChannel.send({ embeds: [approveEmbed] });
        } else {
          await msg.edit({ embeds: [embed.setColor('Red').setFooter({ text: `Elutasította: ${i.user.tag} | Indok: ${m.content}` })], components: [] });
          await msg.delete().catch(() => {});
          const declineEmbed = new EmbedBuilder()
            .setTitle('❌ Rang törlés elutasítva')
            .setDescription(`Felhasználó: <@${user.id}>\nTörlendő rang: <@&${role.id}>\nIndok: ${reason}`)
            .addFields(
              { name: 'Staff indok', value: `${m.content}\n**Staff:** <@${i.user.id}>` },
              { name: 'Kérelmezte', value: `<@${interaction.user.id}>`, inline: true }
            )
            .setColor('Red')
            .setFooter({ text: `Elutasította: ${i.user.tag}` })
            .setTimestamp();
          await deleteChannel.send({ embeds: [declineEmbed] });
        }
      } else {
        await i.followUp({ content: 'Nem érkezett indok, a rang nem került törlésre/elutasítva.', ephemeral: true });
      }
    });
  }
};
