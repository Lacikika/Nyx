// Simple web panel for browsing escrowed (encrypted) data
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { readUser, writeUser, getWebpanelUser, setWebpanelUser, searchMetadata, pool } = require('../utils/mysql');
const rateLimit = require('express-rate-limit');
const i18n = require('i18n');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const app = express();

// ...existing code...
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
// Webpanel user DB helpers are now in utils/mysql.js
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

// Decrypt and listFiles are no longer needed with the database.

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.get('/', async (req, res) => {
  try {
    let guildQuery = 'SELECT guildId FROM guilds';
    const queryParams = [];

    if (req.user && req.user.guilds) {
      // Discord login: filter for guilds where the user is an admin
      const adminGuildIds = req.user.guilds
        .filter(g => (g.permissions & 0x8) === 0x8)
        .map(g => g.id);

      if (adminGuildIds.length > 0) {
        guildQuery += ` WHERE guildId IN (?)`;
        queryParams.push(adminGuildIds);
      } else {
        // If the user is admin in no guilds, show nothing.
        return res.render('webpanel_index', { guilds: [], logsCount: 0, profilesCount: 0, user: req.user || req.session.user });
      }
    }

    const [guilds] = await pool.execute(guildQuery, queryParams);
    const [[{ 'COUNT(*)': logsCount }]] = await pool.execute('SELECT COUNT(*) FROM logs');
    const [[{ 'COUNT(*)': profilesCount }]] = await pool.execute('SELECT COUNT(*) FROM users');

    res.render('webpanel_index', {
      guilds: guilds.map(g => g.guildId), // Pass array of IDs
      logsCount,
      profilesCount,
      user: req.user || req.session.user
    });
  } catch (error) {
    console.error('Error fetching data for / route:', error);
    res.status(500).send('Error fetching data.');
  }
});

// Statistics page
app.get('/statistics', requireLogin, async (req, res) => {
    try {
        const [[{ 'COUNT(*)': logsCount }]] = await pool.execute('SELECT COUNT(*) FROM logs');
        const [[{ 'COUNT(*)': profilesCount }]] = await pool.execute('SELECT COUNT(*) FROM users');
        const [[{ 'COUNT(*)': guildsCount }]] = await pool.execute('SELECT COUNT(*) FROM guilds');

        const stats = {
            logs: logsCount,
            profiles: profilesCount,
            guilds: guildsCount,
            total: logsCount + profilesCount + guildsCount,
            updated: new Date().toLocaleString()
        };
        res.render('statistics', { stats });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).send('Error fetching statistics.');
    }
});

// Blank page
app.get('/blank', requireLogin, (req, res) => {
  res.render('blank');
});

// Metadata search endpoint
app.get('/search', requireLogin, async (req, res) => {
  const { q, date_from, date_to, type } = req.query;

  if (!q && !date_from && !date_to && !type) {
    return res.render('webpanel_search', { q, date_from, date_to, type, results: [] });
  }

  let results = [];
  try {
    results = await searchMetadata({ q, date_from, date_to, type });
  } catch (e) {
    console.error('Search error:', e);
    results = [];
  }
  res.render('webpanel_search', { q, results, date_from, date_to, type });
});

app.get('/view/:type/:id', requireLogin, async (req, res) => {
  try {
    const { type, id } = req.params;
    const json = await getRecordById(type, id);
    if (!json) {
        return res.status(404).send('Record not found.');
    }
    res.render('webpanel_view', { file: id, type: type, json });
  } catch (e) {
    console.error('Error viewing record:', e);
    res.status(500).send('Failed to fetch record.');
  }
});


function startWebPanel(port = 50249) {
  app.listen(port, () => console.log(`Web panel running on http://116.202.112.154:${port}`));
}

// If run directly, start the server
if (require.main === module) {
  startWebPanel();
}

module.exports = { startWebPanel };
