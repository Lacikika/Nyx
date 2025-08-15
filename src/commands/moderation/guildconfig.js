const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendLog } = require('../../../utils/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('szerverbeallitas')
    .setDescription('Szerver beallitasok konfiguracioja  ')
    .addChannelOption(opt =>
      opt.setName('logchannel').setDescription('Set log channel').setRequired(false))
    .addChannelOption(opt =>
      opt.setName('roleschannel').setDescription('Set roles approval channel').setRequired(false))
    .addChannelOption(opt =>
      opt.setName('deleterolechannel').setDescription('Rang törlő csatorna').setRequired(false))
    .addRoleOption(opt =>
      opt.setName('staffrole').setDescription('Add a staff role for moderation').setRequired(false))
    .addStringOption(opt =>
      opt.setName('addstaffrole').setDescription('További staff szerep ID-k (vesszővel elválasztva)').setRequired(false))
    .addRoleOption(opt =>
      opt.setName('requestrole').setDescription('Rang kérelmező rang hozzáadása').setRequired(false))
    .addStringOption(opt =>
      opt.setName('addrequestrole').setDescription('További kérelmező rang ID-k (vesszővel elválasztva)').setRequired(false))
    .addRoleOption(opt =>
      opt.setName('rolecooldown').setDescription('Cooldown rang (ideiglenes tiltás)').setRequired(false)),
  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: 'Ehhez a parancshoz adminisztrátori jogosultság szükséges.', ephemeral: true });
      }
      const guildId = interaction.guild.id;
      let guildData = await readUser('guilds', guildId, guildId);
      if (!guildData) guildData = {};
      let config = guildData.config || {};

      const logChannel = interaction.options.getChannel('logchannel');
      const rolesChannel = interaction.options.getChannel('roleschannel');
      const deleteroleChannel = interaction.options.getChannel('deleterolechannel');
      const staffRole = interaction.options.getRole('staffrole');
      const addStaffRole = interaction.options.getString('addstaffrole');
      const roleCooldown = interaction.options.getRole('rolecooldown');
      const requestRole = interaction.options.getRole('requestrole');
      const addRequestRole = interaction.options.getString('addrequestrole');

      if (logChannel) config.logChannel = logChannel.id;
      if (rolesChannel) config.rolesChannel = rolesChannel.id;
      if (deleteroleChannel) config.deleteroleChannel = deleteroleChannel.id;
      if (roleCooldown) config.roleCooldown = roleCooldown.id;

      if (!config.staffRoles) config.staffRoles = [];
      if (staffRole && !config.staffRoles.includes(staffRole.id)) config.staffRoles.push(staffRole.id);
      if (addStaffRole) {
        const ids = addStaffRole.split(',').map(s => s.trim()).filter(Boolean);
        for (const id of ids) if (!config.staffRoles.includes(id)) config.staffRoles.push(id);
      }

      if (!config.requestRoles) config.requestRoles = [];
      if (requestRole && !config.requestRoles.includes(requestRole.id)) config.requestRoles.push(requestRole.id);
      if (addRequestRole) {
        const ids = addRequestRole.split(',').map(s => s.trim()).filter(Boolean);
        for (const id of ids) if (!config.requestRoles.includes(id)) config.requestRoles.push(id);
      }

      await writeUser('guilds', guildId, guildId, { config });

      await appendLog({
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        type: 'GUILDCONFIG',
        moderatorId: interaction.user.id,
        reason: `Guild config updated by ${interaction.user.tag}`,
      });

      const embed = new EmbedBuilder()
        .setTitle('🛠️ Szerver konfiguráció frissítve')
        .setDescription('A szerver beállításai frissítve lettek.')
        .addFields(
          { name: 'Napló csatorna', value: logChannel ? `<#${logChannel.id}>` : (config.logChannel ? `<#${config.logChannel}>` : 'Nincs beállítva'), inline: true },
          { name: 'Rang jóváhagyó csatorna', value: rolesChannel ? `<#${rolesChannel.id}>` : (config.rolesChannel ? `<#${config.rolesChannel}>` : 'Nincs beállítva'), inline: true },
          { name: 'Rang törlő csatorna', value: deleteroleChannel ? `<#${deleteroleChannel.id}>` : (config.deleteroleChannel ? `<#${config.deleteroleChannel}>` : 'Nincs beállítva'), inline: true },
          { name: 'Staff rang', value: staffRole ? `<@&${staffRole.id}>` : (config.staffRole ? `<@&${config.staffRole}>` : 'Nincs beállítva'), inline: true },
          { name: 'Cooldown rang', value: roleCooldown ? `<@&${roleCooldown.id}>` : (config.roleCooldown ? `<@&${config.roleCooldown}>` : 'Nincs beállítva'), inline: true }
        )
        .setColor('Aqua')
        .setThumbnail(interaction.guild.iconURL())
        .setFooter({ text: 'Állítsd be a szervert a legjobb élményhez!' })
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Error in guildconfig command:', error);
      await interaction.reply({ content: 'Hiba történt a parancs végrehajtása során.', ephemeral: true });
    }
  },
};
