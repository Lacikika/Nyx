/**
 * @fileoverview Handles console commands for the bot.
 * @module src/console
 */

const readline = require('readline');
const t = require('../utils/locale');
const config = require('./config');
const { readUser, writeUser } = require('../utils/jsondb');
const logger = require('../utils/logger');

/**
 * Initializes the console command handler.
 * @param {import('discord.js').Client} client - The Discord client instance.
 */
function initialize(client) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  rl.on('line', async (input) => {
    const cmd = input.trim();
    if (cmd === 'restart') {
      logger.info(t('bot_restarting'));
      process.exit(2);
    } else if (cmd === 'stop') {
      logger.info(t('bot_stopping'));
      process.exit(0);
    } else if (cmd.startsWith('say ')) {
      const msg = cmd.slice(4).trim();
      if (!msg) return logger.warn(t('no_message_provided'));
      try {
        if (config.logChannelId) {
          const channel = await client.channels.fetch(config.logChannelId);
          if (channel && channel.isTextBased()) {
            await channel.send(msg);
            logger.info(t('message_sent_to_log_channel'));
          } else {
            logger.warn(t('log_channel_not_text'));
          }
        } else {
          logger.warn(t('log_channel_not_configured'));
        }
      } catch (e) {
        logger.error(t('failed_to_send_message'), e);
      }
    } else if (cmd.startsWith('broadcast ')) {
      const type = cmd.slice(10).trim().toLowerCase();
      let message;
      if (type === 'stop') {
        message = ':octagonal_sign: **A bot teljesen leáll!** Minden funkció szünetel.';
      } else if (type === 'dev') {
        message = ':hammer_and_wrench: **A bot fejlesztési módban van!** Előfordulhatnak hibák vagy újraindítások.';
      } else if (type === 'restart') {
        message = ':arrows_counterclockwise: **A bot újraindul!** Kérjük, várj néhány másodpercet.';
      } else {
        return logger.warn(t('unknown_broadcast_type'));
      }
      try {
        const guilds = client.guilds.cache;
        let count = 0;
        for (const [guildId] of guilds) {
          const configData = await readUser('guilds', guildId, guildId);
          if (configData && configData.logChannel) {
            try {
              const channel = await client.channels.fetch(configData.logChannel);
              if (channel && channel.isTextBased()) {
                await channel.send(message);
                count++;
              }
            } catch {}
          }
        }
        logger.info(t('broadcast_sent', { count }));
      } catch (e) {
        logger.error(t('broadcast_error'), e);
      }
    } else if (cmd === 'guilds') {
      // List all guilds
      for (const [id, guild] of client.guilds.cache) {
        logger.info(`[GUILD] ${guild.name} (${id})`);
      }
    } else if (cmd.startsWith('users ')) {
      // List users in a guild
      const guildId = cmd.slice(6).trim();
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return logger.warn(t('guild_not_found'));
      try {
        await guild.members.fetch();
        for (const [id, member] of guild.members.cache) {
          logger.info(`[USER] ${member.user.tag} (${id})`);
        }
      } catch (e) {
        logger.error(t('failed_to_fetch_members'), e);
      }
    } else if (cmd.startsWith('eval ')) {
      // Evaluate JS code
      const code = cmd.slice(5);
      try {
        // eslint-disable-next-line no-eval
        const result = await eval(code);
        logger.info(t('eval_result'), result);
      } catch (e) {
        logger.error(t('eval_error'), e);
      }
    } else if (cmd === 'help') {
      logger.info(t('console_commands_help_title'));
      logger.info(t('console_commands_help_restart'));
      logger.info(t('console_commands_help_stop'));
      logger.info(t('console_commands_help_say'));
      logger.info(t('console_commands_help_broadcast'));
      logger.info(t('console_commands_help_guilds'));
      logger.info(t('console_commands_help_users'));
      logger.info(t('console_commands_help_eval'));
      logger.info(t('console_commands_help_help'));
    } else if (cmd.startsWith('db ')) {
      const args = cmd.slice(3).trim().split(' ');
      const sub = args[0];
      const type = args[1];
      const guildId = args[2];
      const userId = args[3];
      const json = args.slice(4).join(' ');
      const baseDir = require('path').join(__dirname, '../data');
      const fsPromises = require('fs').promises;
      if (sub === 'list') {
        // db list <type>
        if (!type) return logger.warn('Usage: db list <type>');
        try {
          const files = await fsPromises.readdir(require('path').join(baseDir, type));
          logger.info(`[DB] ${type} files:`, files);
        } catch (e) {
          logger.error('[DB] Failed to list:', e);
        }
      } else if (sub === 'get') {
        // db get <type> <guildId> <userId>
        if (!type || !guildId || !userId) return logger.warn('Usage: db get <type> <guildId> <userId>');
        try {
          const data = await readUser(type, userId, guildId);
          logger.info(data);
        } catch (e) {
          logger.error('[DB] Failed to get:', e);
        }
      } else if (sub === 'set') {
        // db set <type> <guildId> <userId> <json>
        if (!type || !guildId || !userId || !json) return logger.warn('Usage: db set <type> <guildId> <userId> <json>');
        try {
          const obj = JSON.parse(json);
          await writeUser(type, userId, guildId, obj);
          logger.info('[DB] Save successful.');
        } catch (e) {
          logger.error('[DB] Failed to save:', e);
        }
      } else if (sub === 'delete') {
        // db delete <type> <guildId> <userId>
        if (!type || !guildId || !userId) return logger.warn('Usage: db delete <type> <guildId> <userId>');
        try {
          const file = require('path').join(baseDir, type, `${guildId}_${userId}.json`);
          await fsPromises.unlink(file);
          logger.info('[DB] File deleted.');
        } catch (e) {
          logger.error('[DB] Failed to delete:', e);
        }
      } else if (sub === 'raw') {
        // db raw <type> <guildId> <userId>
        if (!type || !guildId || !userId) return logger.warn('Usage: db raw <type> <guildId> <userId>');
        try {
          const file = require('path').join(baseDir, type, `${guildId}_${userId}.json`);
          const raw = await fsPromises.readFile(file, 'utf8');
          logger.info(raw);
        } catch (e) {
          logger.error('[DB] Failed to read:', e);
        }
      } else if (sub === 'help') {
        logger.info('[BOT] DB commands:');
        logger.info('  db list <type>                  - List files (e.g., profiles, guilds, logs)');
        logger.info('  db get <type> <guildId> <userId>    - Get data (object)');
        logger.info('  db set <type> <guildId> <userId> <json> - Set data (JSON string)');
        logger.info('  db delete <type> <guildId> <userId>     - Delete file');
        logger.info('  db raw <type> <guildId> <userId>       - File content (raw JSON)');
        logger.info('  db help                               - This list');
      } else {
        logger.warn('[BOT] Unknown db command. Type: db help');
      }
    } else {
      logger.warn(t('unknown_command'), cmd);
    }
  });
}

module.exports = { initialize };
