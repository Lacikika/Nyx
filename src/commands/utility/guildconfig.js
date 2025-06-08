const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guildconfig')
    .setDescription('Configure guild settings')
    .addChannelOption(opt =>
      opt.setName('logchannel').setDescription('Set log channel').setRequired(false))
    .addRoleOption(opt =>
      opt.setName('ticketrole').setDescription('Set ticket support role').setRequired(false))
    .addRoleOption(opt =>
      opt.setName('viprole').setDescription('Set the VIP role').setRequired(false)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need Administrator permission.', ephemeral: true });
    }
    const guildId = interaction.guild.id;
    const config = await readUser('guilds', guildId, guildId);
    const logChannel = interaction.options.getChannel('logchannel');
    const ticketRole = interaction.options.getRole('ticketrole');
    const vipRole = interaction.options.getRole('viprole');
    if (logChannel) config.logChannel = logChannel.id;
    if (ticketRole) config.ticketRole = ticketRole.id;
    if (vipRole) config.vipRole = vipRole.id;
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
      .setTitle('🛠️ Guild Config Updated')
      .setDescription('Guild settings have been updated.')
      .addFields(
        { name: 'Log Channel', value: logChannel ? `<#${logChannel.id}>` : (config.logChannel ? `<#${config.logChannel}>` : 'Not set'), inline: true },
        { name: 'Ticket Role', value: ticketRole ? `<@&${ticketRole.id}>` : (config.ticketRole ? `<@&${config.ticketRole}>` : 'Not set'), inline: true },
        { name: 'VIP Role', value: vipRole ? `<@&${vipRole.id}>` : (config.vipRole ? `<@&${config.vipRole}>` : 'Not set'), inline: true }
      )
      .setColor('Aqua')
      .setThumbnail(interaction.guild.iconURL())
      .setFooter({ text: 'Configure your server for the best experience!' })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
