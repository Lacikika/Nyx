// Simple web panel for browsing escrowed (encrypted) data
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { readUser, writeUser } = require('../utils/jsondb');
const rateLimit = require('express-rate-limit');
const i18n = require('i18n');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const app = express();

// i18n setup
i18n.configure({
  locales: ['en', 'hu'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'en',
  queryParameter: 'lang',
  cookie: 'lang',
  autoReload: true,
  updateFiles: false,
  objectNotation: true
});
app.use(i18n.init);

// Language switcher middleware (query or session)
app.use((req, res, next) => {
  if (req.query.lang) {
    res.cookie('lang', req.query.lang);
    req.setLocale(req.query.lang);
  }
  res.locals.__ = res.__ = req.__ = req.__ || req.__;
  next();
});

// Only require Discord login for protected pages
function requireDiscordLoginIfProtected(req, res, next) {
  const openRoutes = ['/login', '/auth/discord', '/auth/discord/callback'];
  if (openRoutes.includes(req.path)) {
    console.log('Open route:', req.path);
    return next();
  }
  console.log('Protected route:', req.path);
  return requireDiscordLogin(req, res, next);
}
// Rate limiter for login route: max 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Only count failed attempts
});
// Session setup
app.use(session({
  secret: process.env.WEBPANEL_SESSION_SECRET || 'nyxsecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());
// Theme toggle route
app.get('/theme/:mode', (req, res) => {
  if (!req.session) req.session = {};
  req.session.theme = req.params.mode === 'dark' ? 'dark' : 'light';
  res.redirect(req.headers.referer || '/');
});
// Theme middleware
app.use((req, res, next) => {
  res.locals.theme = (req.session && req.session.theme) ? req.session.theme : 'light';
  next();
});
// Notification middleware for success/error popups
app.use((req, res, next) => {
  if (!req.session) req.session = {};
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;
  req.session.success = null;
  req.session.error = null;
  next();
});
// API endpoints for bot stats and data
app.get('/api/stats', (req, res) => {
  // Example stats, replace with real logic
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    users: 123,
    guilds: 10
  });
});
app.get('/api/data', (req, res) => {
  // Example data, replace with real logic
  res.json({
    logs: [],
    profiles: [],
    guilds: []
  });
});
// Global error handler for unified feedback
app.use((err, req, res, next) => {
  console.error('Webpanel error:', err);
  if (!req.session) req.session = {};
  req.session.error = err.message || 'Unknown error occurred.';
  res.redirect(req.originalUrl || '/');
});
// Csak ezután hívjuk meg, hogy az isAuthenticated elérhető legyen
app.use(requireDiscordLoginIfProtected);
// Passport Discord OAuth2 setup
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID',
  clientSecret: process.env.DISCORD_CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
  callbackURL: process.env.DISCORD_CALLBACK_URL || 'http://localhost:50249/auth/discord/callback',
  scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

function requireDiscordLogin(req, res, next) {
  // Engedélyezzük, ha Discorddal vagy lokális fiókkal be van jelentkezve
  console.log('requireDiscordLogin:', {
    isAuthenticated: typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : undefined,
    sessionUser: req.session.user,
    user: req.user
  });
  if (typeof req.isAuthenticated === 'function' && req.isAuthenticated()) return next();
  if (req.session.user) return next();
  console.log('Redirecting to /auth/discord');
  res.redirect('/auth/discord');
}
app.use(express.urlencoded({ extended: true }));
// Middleware: require login
function requireLogin(req, res, next) {
  if (req.session.user || req.user) {
    return next();
  }
  return res.redirect('/login');
}
// Webpanel user DB helpers
const WEBPANEL_USER_TYPE = 'webpanel_users';
const WEBPANEL_USER_GUILD = 'global';
async function getWebpanelUser(username) {
  const users = await readUser(WEBPANEL_USER_TYPE, username, WEBPANEL_USER_GUILD);
  return users && users.hash ? users : null;
}
async function setWebpanelUser(username, hash) {
  await writeUser(WEBPANEL_USER_TYPE, username, WEBPANEL_USER_GUILD, { hash });
}

async function getGuildChannels(guildId) {
    // This is a placeholder. In a real application, you would fetch this from the Discord API.
    return [
        { id: '123', name: 'general' },
        { id: '456', name: 'random' }
    ];
}

async function getGuildRoles(guildId) {
    // This is a placeholder. In a real application, you would fetch this from the Discord API.
    return [
        { id: '789', name: 'Member' },
        { id: '101', name: 'Admin' }
    ];
}
// Discord OAuth2 login routes
app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', {
  failureRedirect: '/login'
}), (req, res, next) => {
  console.log('Discord callback, req.user:', req.user);
  console.log('Discord callback, session:', req.session);
  if (req.user) {
    req.login(req.user, function(err) {
      if (err) {
        console.log('req.login error:', err);
        return next(err);
      }
      console.log('User logged in, session:', req.session);
      res.redirect('/');
    });
  } else {
    console.log('No user in callback!');
    res.redirect('/login');
  }
});
app.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/login'));
});
// Login page (fallback for local login)
app.get('/login', (req, res) => {
  res.render('login', { error: null, __: res.__ });
});
app.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  const user = await getWebpanelUser(username);
  if (!user || !user.hash || !(await bcrypt.compare(password, user.hash))) {
    return res.render('login', { error: res.__('login.invalid'), __: res.__ });
  }
  req.session.user = username;
  res.redirect('/');
});

// Console page: show logs from latest bot log file (console.log, error.log, etc.)
app.get('/console', (req, res) => {
  // Try to read logs/console.log, logs/error.log, logs/audit.log, etc.
  const logDir = path.join(__dirname, '../data/logs');
  let logFiles = ['console.log', 'error.log', 'audit.log'];
  let logs = [];
  for (const file of logFiles) {
    const filePath = path.join(logDir, file);
    if (fs.existsSync(filePath)) {
      try {
        const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
          let level = 'info';
          if (/error|exception|fail|critical/i.test(line)) level = 'error';
          else if (/warn|warning/i.test(line)) level = 'warn';
          else if (/debug/i.test(line)) level = 'debug';
          logs.push({ text: line, level });
        }
      } catch {}
    }
  }
  res.render('console', { logs });
});

// Use the correct 32-byte (64 hex char) key
require('dotenv').config();
const key = process.env.ENCRYPTION_KEY;

function decrypt(buffer) {
  const iv = buffer.slice(0, 16);
  const data = buffer.slice(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(data);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

// List all files in a data subdirectory
function listFiles(type) {
  const dir = path.join(__dirname, '../data', type);
  try {
    return fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  } catch {
    return [];
  }
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.get('/', async (req, res) => {
  console.log('--- / route ---');
  console.log('req.user:', req.user);
  console.log('req.session:', req.session);
  let allowedGuilds = [];
  if (req.user && req.user.guilds) {
    // Discord login: csak admin guild-eket mutatunk
    const userGuilds = req.user.guilds.filter(g => (g.permissions & 0x8) === 0x8);
    const allGuildConfigs = listFiles('guilds');
    allowedGuilds = allGuildConfigs.filter(file => {
      const guildId = file.split('_')[0];
      return userGuilds.some(g => g.id === guildId);
    });
    console.log('Discord admin guilds:', allowedGuilds);
  } else {
    // Lokális login: mutassunk minden guild configot vagy üres listát
    allowedGuilds = listFiles('guilds');
    console.log('Local login guilds:', allowedGuilds);
  }
  res.render('webpanel_index', {
    logs: listFiles('logs'),
    profiles: listFiles('profiles'),
    guilds: allowedGuilds,
    user: req.user || req.session.user
  });
});

// Statistics page
app.get('/statistics', requireLogin, (req, res) => {
  const logs = listFiles('logs');
  const profiles = listFiles('profiles');
  const guilds = listFiles('guilds');
  const stats = {
    logs: logs.length,
    profiles: profiles.length,
    guilds: guilds.length,
    total: logs.length + profiles.length + guilds.length,
    updated: new Date().toLocaleString()
  };
  res.render('statistics', { stats });
});

// Blank page
app.get('/blank', requireLogin, (req, res) => {
  res.render('blank');
});

// Metadata search endpoint
const { searchMetadata } = require('../utils/jsondb');
app.get('/search', requireLogin, async (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const date_from = req.query.date_from;
  const date_to = req.query.date_to;
  const role = (req.query.role || '').toLowerCase();
  if (!q && !date_from && !date_to && !role) return res.redirect('/');
  let results = [];
  try {
    results = await searchMetadata(q);
    // Filter by date range if provided
    if (date_from) {
      const from = new Date(date_from);
      results = results.filter(meta => meta.time && new Date(meta.time) >= from);
    }
    if (date_to) {
      const to = new Date(date_to);
      results = results.filter(meta => meta.time && new Date(meta.time) <= to);
    }
    // Filter by role if provided
    if (role) {
      results = results.filter(meta => meta.role && meta.role.toLowerCase().includes(role));
    }
  } catch (e) {
    results = [];
  }
  res.render('webpanel_search', { q, results, date_from, date_to, role });
});

app.get('/data/:type/:file', requireLogin, (req, res) => {
  const filePath = path.join(__dirname, '../data', req.params.type, req.params.file);
  try {
    const buf = fs.readFileSync(filePath);
    const json = JSON.parse(decrypt(buf));
    // If entries exist, sort by time desc
    if (Array.isArray(json.entries)) {
      json.entries.sort((a, b) => new Date(b.time || b.timestamp) - new Date(a.time || a.timestamp));
    }
    res.render('webpanel_view', { file: req.params.file, type: req.params.type, json });
  } catch (e) {
    res.status(500).send('Failed to decrypt or parse file.');
  }
});

// Guild config view route (GET + POST for editing roles)
app.get('/guild/:guildId/config', requireLogin, async (req, res) => {
    const guildId = req.params.guildId;
    const guild = req.user.guilds.find(g => g.id === guildId);
    if (!guild) {
        return res.status(403).send('Forbidden');
    }

    // Fetch guild channels and roles from Discord API
    const channels = await getGuildChannels(guildId);
    const roles = await getGuildRoles(guildId);

    // Fetch current config from db
    const config = await readUser('guilds', guildId, 'settings') || {};

    res.render('guild-config', {
        guild,
        config,
        channels,
        roles
    });
});

app.post('/guild/:guildId/config', requireLogin, async (req, res) => {
    const guildId = req.params.guildId;
    const guild = req.user.guilds.find(g => g.id === guildId);
    if (!guild) {
        return res.status(403).send('Forbidden');
    }

    const newConfig = {
        prefix: req.body.prefix,
        logChannel: req.body.logChannel,
    };

    await writeUser('guilds', guildId, 'settings', newConfig);

    res.redirect(`/guild/${guildId}/config`);
});

app.get('/guild/:guildId/utils', requireLogin, async (req, res) => {
    const guildId = req.params.guildId;
    const guild = req.user.guilds.find(g => g.id === guildId);
    if (!guild) {
        return res.status(403).send('Forbidden');
    }

    const channels = await getGuildChannels(guildId);
    const roles = await getGuildRoles(guildId);
    const utils = await readUser('guilds', guildId, 'utils') || {};

    res.render('guild-utils', {
        guild,
        utils,
        channels,
        roles
    });
});

app.post('/guild/:guildId/utils/welcome', requireLogin, async (req, res) => {
    const guildId = req.params.guildId;
    const guild = req.user.guilds.find(g => g.id === guildId);
    if (!guild) {
        return res.status(403).send('Forbidden');
    }

    const utils = await readUser('guilds', guildId, 'utils') || {};
    utils.welcome = {
        channel: req.body.welcomeChannel,
        message: req.body.welcomeMessage
    };

    await writeUser('guilds', guildId, 'utils', utils);

    res.redirect(`/guild/${guildId}/utils`);
});

app.post('/guild/:guildId/utils/autorole', requireLogin, async (req, res) => {
    const guildId = req.params.guildId;
    const guild = req.user.guilds.find(g => g.id === guildId);
    if (!guild) {
        return res.status(403).send('Forbidden');
    }

    const utils = await readUser('guilds', guildId, 'utils') || {};
    utils.autorole = req.body.autorole;

    await writeUser('guilds', guildId, 'utils', utils);

    res.redirect(`/guild/${guildId}/utils`);
});


function startWebPanel(port = 50249) {
  app.listen(port, () => console.log(`Web panel running on http://116.202.112.154:${port}`));
}

// If run directly, start the server
if (require.main === module) {
  startWebPanel();
}

module.exports = { startWebPanel, app };
