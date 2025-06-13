const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guildconfig')
    .setDescription('Configure guild settings')
    .addChannelOption(opt =>
      opt.setName('logchannel').setDescription('Set log channel').setRequired(false))
    .addChannelOption(opt =>
      opt.setName('roleschannel').setDescription('Set roles approval channel').setRequired(false))
    .addChannelOption(opt =>
      opt.setName('deleterolechannel').setDescription('Set role delete approval channel').setRequired(false))
    .addRoleOption(opt =>
      opt.setName('ticketrole').setDescription('Set ticket support role').setRequired(false))
    .addRoleOption(opt =>
      opt.setName('viprole').setDescription('Set the VIP role').setRequired(false))
    .addRoleOption(opt =>
      opt.setName('staffrole').setDescription('Set the staff role for role approvals').setRequired(false))
    .addRoleOption(opt =>
      opt.setName('rolecooldown').setDescription('Set the temp cooldown role for deleted roles').setRequired(false)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Ehhez a parancshoz adminisztrátori jogosultság szükséges.', ephemeral: true });
    }
    const guildId = interaction.guild.id;
    const config = await readUser('guilds', guildId, guildId);
    const logChannel = interaction.options.getChannel('logchannel');
    const rolesChannel = interaction.options.getChannel('roleschannel');
    const deleteroleChannel = interaction.options.getChannel('deleterolechannel');
    const ticketRole = interaction.options.getRole('ticketrole');
    const vipRole = interaction.options.getRole('viprole');
    const staffRole = interaction.options.getRole('staffrole');
    const roleCooldown = interaction.options.getRole('rolecooldown');
    if (logChannel) config.logChannel = logChannel.id;
    if (rolesChannel) config.rolesChannel = rolesChannel.id;
    if (deleteroleChannel) config.deleteroleChannel = deleteroleChannel.id;
    if (ticketRole) config.ticketRole = ticketRole.id;
    if (vipRole) config.vipRole = vipRole.id;
    if (staffRole) config.staffRole = staffRole.id;
    if (roleCooldown) config.roleCooldown = roleCooldown.id;
    await writeUser('guilds', guildId, guildId, config);
    // Log guildconfig command usage
    await appendUserLog('logs', interaction.user.id, interaction.guild.id, {
      event_type: 'GUILDCONFIG',
      reason: 'Updated guild config',
      warned_by: interaction.user.id,
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      message_content: null,
      date: Date.now()
    }, interaction.user.username);
    const embed = new EmbedBuilder()
      .setTitle('🛠️ Szerver konfiguráció frissítve')
      .setDescription('A szerver beállításai frissítve lettek.')
      .addFields(
        { name: 'Napló csatorna', value: logChannel ? `<#${logChannel.id}>` : (config.logChannel ? `<#${config.logChannel}>` : 'Nincs beállítva'), inline: true },
        { name: 'Rang jóváhagyó csatorna', value: rolesChannel ? `<#${rolesChannel.id}>` : (config.rolesChannel ? `<#${config.rolesChannel}>` : 'Nincs beállítva'), inline: true },
        { name: 'Rang törlő csatorna', value: deleteroleChannel ? `<#${deleteroleChannel.id}>` : (config.deleteroleChannel ? `<#${config.deleteroleChannel}>` : 'Nincs beállítva'), inline: true },
        { name: 'Ticket szerep', value: ticketRole ? `<@&${ticketRole.id}>` : (config.ticketRole ? `<@&${config.ticketRole}>` : 'Nincs beállítva'), inline: true },
        { name: 'VIP rang', value: vipRole ? `<@&${vipRole.id}>` : (config.vipRole ? `<@&${config.vipRole}>` : 'Nincs beállítva'), inline: true },
        { name: 'Staff rang', value: staffRole ? `<@&${staffRole.id}>` : (config.staffRole ? `<@&${config.staffRole}>` : 'Nincs beállítva'), inline: true },
        { name: 'Cooldown rang', value: roleCooldown ? `<@&${roleCooldown.id}>` : (config.roleCooldown ? `<@&${config.roleCooldown}>` : 'Nincs beállítva'), inline: true }
      )
      .setColor('Aqua')
      .setThumbnail(interaction.guild.iconURL())
      .setFooter({ text: 'Állítsd be a szervert a legjobb élményhez!' })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
