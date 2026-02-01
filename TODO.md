# Project TODO List

## High Priority (Critical Issues & Essentials)

1. [ ] **Fix Data Corruption**: `src/utils/jsondb.js` - `enforceDataLimit` reads encrypted files as UTF-8, causing JSON parse errors. Fix to use `decrypt()`.
2. [ ] **Security**: Remove hardcoded IP address in `src/index.js` log message.
3. [ ] **Security**: Ensure `dev` mode in `src/index.js` is not hardcoded to `false`. Use `NODE_ENV`.
4. [ ] **Legal**: Add `LICENSE` file (MIT) to repository root.
5. [ ] **Legal**: Update `package.json` license field from `ISC` to `MIT`.
6. [ ] **Stability**: Ensure `data/` and subdirectories (`logs`, `profiles`, `guilds`) exist on bot startup.
7. [ ] **Stability**: Add startup check for `BOT_TOKEN` and `CLIENT_ID` env vars; exit gracefully if missing.
8. [ ] **Cleanup**: Move `profilkep.png` from root to `assets/` directory.
9. [ ] **Dependency**: `ytdl-core` is deprecated/unmaintained. Replace with `play-dl` or similar if music features are used.
10. [ ] **Dependency**: `fetch` package in `package.json` seems redundant with `node-fetch`. Remove if unused.
11. [ ] **Dependency**: Fix `node-fetch` import in `src/index.js` to be standard or use native fetch (Node 18+).
12. [ ] **Security**: Verify `src/webpanel/webpanel.js` doesn't expose sensitive headers or data without auth.
13. [ ] **Security**: `logger.js` redaction regex might be too aggressive or ineffective. Review it.
14. [ ] **Logging**: `ERROR_LOG_PATH` in `logger.js` is hardcoded to `../data/error.log`. Ensure this file is handled correctly (rotation/size).
15. [ ] **Database**: Handle case where `.key` file exists but is invalid (currently warns and falls back to unencrypted, maybe should exit?).
16. [ ] **Database**: `readUser` returns empty object on error. Should differentiation between "not found" and "error" be made?
17. [ ] **Database**: `writeUser` has no error handling if `fs.writeFile` fails (e.g. disk full).
18. [ ] **Config**: `src/config.js` hardcodes `bannedWords`. Move to `data/badwords.json` or similar for dynamic updates.
19. [ ] **Events**: Verify `process.on('uncaughtException')` logic actually logs to Discord (async inside sync handler might fail if process exits).
20. [ ] **Web Panel**: Change default port 50249 to be configurable via `.env`.
21. [ ] **Web Panel**: Ensure web panel password is strictly enforced and not bypassable.
22. [ ] **Git**: Remove `npm-debug.log` and similar from repo if present (already in gitignore, but check repo).
23. [ ] **Commands**: Verify `scripts/register-commands.js` handles rate limits from Discord API.
24. [ ] **Commands**: Ensure all commands have `data` and `execute` properties to prevent loader warnings.
25. [ ] **Security**: `eval` command (mentioned in README) is dangerous. Ensure it's restricted to owner ID only.

## Mid Priority (Code Quality & Features)

26. [ ] **Linting**: Add `.eslintrc.json` with recommended rules (ESLint).
27. [ ] **Formatting**: Add `.prettierrc` and `prettier` for consistent code style.
28. [ ] **Tests**: Create unit tests for `jsondb.js` (encryption/decryption cycles).
29. [ ] **Tests**: Create unit tests for `logger.js`.
30. [ ] **Tests**: Add integration tests for command loading.
31. [ ] **CI/CD**: Add GitHub Actions workflow for linting and testing.
32. [ ] **Refactor**: Convert `require` to `import` (ES Modules) if moving to modern Node.js standards (optional but recommended).
33. [ ] **Refactor**: Split `src/index.js` into `App` class for better structure.
34. [ ] **Feature**: Add `/ping` command for basic latency checking.
35. [ ] **Feature**: Add `/uptime` command.
36. [ ] **Feature**: Implement `badwords.json` reloading without restart.
37. [ ] **Feature**: Add command to generate a new encryption key securely.
38. [ ] **Feature**: Add `status` (presence) rotation for the bot (e.g. "Playing with X users").
39. [ ] **Feature**: Add "Maintenance Mode" to ignore commands temporarily.
40. [ ] **Logging**: Use a proper logging library like `winston` or `pino` instead of custom `logger.js`.
41. [ ] **Database**: Implement backup system for `data/` directory (e.g. zip and send to owner or cloud).
42. [ ] **Web Panel**: Add HTTPS support (SSL certificates).
43. [ ] **Web Panel**: Add simple login page (currently might be basic auth or unprotected?).
44. [ ] **Web Panel**: specific "Logout" button.
45. [ ] **Web Panel**: Real-time socket updates for console logs instead of polling.
46. [ ] **Locale**: Fully implement `src/utils/locale.js` and use it in all commands.
47. [ ] **Locale**: Add support for multiple languages (fr, de, es).
48. [ ] **Docs**: Add JSDoc comments to all utility functions.
49. [ ] **Docs**: Generate API documentation from JSDoc.
50. [ ] **Refactor**: `jsondb.js` uses synchronous `crypto` calls. For large data, consider async/streams.
51. [ ] **Refactor**: `logger.js` `printActivityReport` uses `console.log`. Should use the log function itself.
52. [ ] **Utils**: Create `EmbedUtils` helper for consistent embed styling (colors, footers).
53. [ ] **Commands**: Add cooldown bypass for admins.
54. [ ] **Commands**: Add permission checks inside commands (using Discord flags) in addition to role checks.
55. [ ] **Events**: Add handler for `guildCreate` (joined new server) to initialize DB entry.
56. [ ] **Events**: Add handler for `guildDelete` (left server) to cleanup/archive DB entry.
57. [ ] **Events**: Add handler for `guildMemberAdd` for welcome messages.
58. [ ] **Events**: Add handler for `guildMemberRemove` for goodbye messages.
59. [ ] **Moderation**: Add `/unban` command.
60. [ ] **Moderation**: Add `/mute` (timeout) command using native Discord timeout API.
61. [ ] **Moderation**: Add `/softban` (ban + unban to clear messages).
62. [ ] **Moderation**: Add logging channel configuration via command `/setlogchannel`.
63. [ ] **Entertainment**: Fix/Update `meme` API source if it goes down.
64. [ ] **Entertainment**: Add `/coinflip` command.
65. [ ] **Entertainment**: Add `/roll` (dice) command.
66. [ ] **Utility**: Add `/userinfo` command.
67. [ ] **Utility**: Add `/avatar` command (get user avatar).
68. [ ] **Utility**: Add `/remindme` command.
69. [ ] **Economy**: Add basic economy system (daily, balance).
70. [ ] **Leveling**: Add rank card image generation (using `canvas` or similar).

## Low Priority (Polish & Extras)

71. [ ] **UI**: Add dark/light mode toggle for Web Panel.
72. [ ] **UI**: Improve Web Panel mobile responsiveness.
73. [ ] **UI**: Add more charts to Web Panel statistics.
74. [ ] **Code**: Alphabetize imports in files.
75. [ ] **Code**: Remove unused variables (run linter).
76. [ ] **Docs**: Add `CONTRIBUTING.md`.
77. [ ] **Docs**: Add `CHANGELOG.md`.
78. [ ] **Docs**: Update `README.md` with screenshots of Web Panel.
79. [ ] **Docs**: Add badges to `README.md` (license, status).
80. [ ] **Fun**: Add more random "Fun Facts" in logger.
81. [ ] **Fun**: Add "Easter Eggs" to some commands.
82. [ ] **Config**: Allow configuring `INTERACTION_ESTIMATED_SIZE` in `.env`.
83. [ ] **Config**: Allow configuring `MAX_DATA_SIZE` in `.env`.
84. [ ] **Dev**: Add `npm run lint:fix` script.
85. [ ] **Dev**: Add `npm run docker:build` script and Dockerfile.
86. [ ] **Dev**: Add `docker-compose.yml`.
87. [ ] **Bot**: Custom status message rotation (random intervals).
88. [ ] **Bot**: Add support for slash command localization strings.
89. [ ] **Bot**: Add support for autocomplete in commands.
90. [ ] **Bot**: Add support for context menu commands (User/Message apps).
91. [ ] **Web Panel**: Add "Download Logs" button.
92. [ ] **Web Panel**: Add "Restart Bot" button (if running via PM2/Docker).
93. [ ] **Web Panel**: Add "Clear Cache" button.
94. [ ] **Code**: Optimize `readGlobalUserLogs` performance.
95. [ ] **Code**: Use `path.resolve` instead of `path.join` for absolute paths consistency.
96. [ ] **Security**: Rate limit Web Panel requests.
97. [ ] **Security**: Add CSRF protection to Web Panel forms.
98. [ ] **Security**: Sanitize inputs in Web Panel search.
99. [ ] **Misc**: Add ASCII art banner on startup.
100. [ ] **Misc**: Create a logo for the bot if one doesn't exist (besides `profilkep.png`).
