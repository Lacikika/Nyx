// Utility: serverstats.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');
const logger = require('../../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Szerver statisztikak megtekintese  '),
  async execute(interaction) {
    const { guild } = interaction;
    // Log serverstats command usage (DB and console)
    const logData = {
      event_type: 'SERVERSTATS',
      reason: 'Viewed server stats',
      user: {
        id: interaction.user.id,
        username: interaction.user.username
      },
      guild: {
        id: interaction.guild.id,
        name: interaction.guild.name
      },
      channel_id: interaction.channel.id,
      message_id: interaction.id,
      date: new Date().toISOString()
    };
    await appendUserLog('logs', interaction.user.id, interaction.guild.id, logData, interaction.user.username);
    logger.info(`[SERVERSTATS] \x1b[36m${interaction.user.username}\x1b[0m requested server stats in guild \x1b[33m${guild.name}\x1b[0m (#${interaction.channel.name})`);

    // Additional event logging: online members, bot count, roles, emojis, boosts
    const onlineMembers = guild.members.cache.filter(m => m.presence && m.presence.status !== 'offline').size;
    const botCount = guild.members.cache.filter(m => m.user.bot).size;
    const roleCount = guild.roles.cache.size;
    const emojiCount = guild.emojis.cache.size;
    const boostCount = guild.premiumSubscriptionCount || 0;
    logger.info(`[SERVERSTATS] Online: \x1b[32m${onlineMembers}\x1b[0m | Bots: \x1b[35m${botCount}\x1b[0m | Roles: \x1b[34m${roleCount}\x1b[0m | Emojis: \x1b[36m${emojiCount}\x1b[0m | Boosts: \x1b[35m${boostCount}\x1b[0m`);

    const embed = new EmbedBuilder()
      .setTitle('Szerver statisztikak  ')
      .setDescription('Itt lathatod a szerver jelenlegi statisztikait  :')
      .setColor(0x5865F2)
      .setThumbnail(interaction.guild.iconURL())
      .addFields(
        { name: 'Szerver', value: guild.name, inline: true },
        { name: 'Tagok', value: guild.memberCount.toString(), inline: true },
        { name: 'Online tagok', value: onlineMembers.toString(), inline: true },
        { name: 'Botok', value: botCount.toString(), inline: true },
        { name: 'Letrehozva', value: guild.createdAt.toLocaleDateString('hu-HU'), inline: true },
        { name: 'Szerver ID', value: guild.id, inline: true },
        { name: 'Region', value: guild.preferredLocale, inline: true },
        { name: 'Csatornak', value: guild.channels.cache.size.toString(), inline: true },
        { name: 'Szerepkorok', value: roleCount.toString(), inline: true },
        { name: 'Emojik', value: emojiCount.toString(), inline: true },
        { name: 'Boostok', value: boostCount.toString(), inline: true }
      )
      .setFooter({ text: 'Maradj aktiv es erezd jol magad!  ' })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
