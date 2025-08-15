-- SQL schema for the Nyx bot

CREATE TABLE IF NOT EXISTS `guilds` (
  `guildId` VARCHAR(255) NOT NULL,
  `config` JSON,
  PRIMARY KEY (`guildId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` VARCHAR(255) NOT NULL,
  `guildId` VARCHAR(255) NOT NULL,
  `xp` INT DEFAULT 0,
  `level` INT DEFAULT 0,
  `warnings` JSON,
  UNIQUE KEY `user_guild_unique` (`userId`, `guildId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `guildId` VARCHAR(255) NOT NULL,
  `userId` VARCHAR(255),
  `type` VARCHAR(50) NOT NULL,
  `moderatorId` VARCHAR(255),
  `reason` TEXT,
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `log_data` JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `webpanel_users` (
  `username` VARCHAR(255) NOT NULL PRIMARY KEY,
  `hash` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
