// Simple web panel for browsing escrowed (encrypted) data
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const config = require('../src/config');
const t = require('../utils/locale');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * Authentication middleware for the web panel.
 * If a password is set in the config, it checks for a valid password cookie.
 * If the cookie is not present or invalid, it redirects to the login page.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 */
function auth(req, res, next) {
  if (config.webpanelPassword) {
    if (req.cookies.password === config.webpanelPassword) {
      return next();
    }
    return res.redirect('/login');
  }
  next();
}

// Renders the login page.
app.get('/login', (req, res) => {
  res.render('login', { t, error: null });
});

// Handles the login form submission.
app.post('/login', (req, res) => {
  if (req.body.password === config.webpanelPassword) {
    res.cookie('password', req.body.password, { maxAge: 900000, httpOnly: true });
    res.redirect('/');
  } else {
    res.render('login', { t, error: t('webpanel_invalid_password') });
  }
});

// Logs the user out by clearing the password cookie.
app.get('/logout', (req, res) => {
  res.clearCookie('password');
  res.redirect('/login');
});

// Console page: show logs from latest bot log file (console.log, error.log, etc.)
app.get('/console', auth, (req, res) => {
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
  res.render('console', { t, logs });
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


app.get('/', auth, (req, res) => {
  res.redirect('/console');
});

// Statistics page
app.get('/statistics', auth, (req, res) => {
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
  res.render('statistics', { t, stats });
});

// Blank page
app.get('/blank', auth, (req, res) => {
  res.render('blank', { t });
});

// Search endpoint for files by name or ID
app.get('/search', auth, (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.redirect('/');
  const types = ['logs', 'profiles', 'guilds'];
  let results = [];
  for (const type of types) {
    const files = listFiles(type);
    files.forEach(file => {
      if (file.toLowerCase().includes(q)) {
        results.push({ type, file });
      }
    });
  }
  res.render('webpanel_search', { t, q, results });
});

app.get('/data/:type/:file', auth, (req, res) => {
  const filePath = path.join(__dirname, '../data', req.params.type, req.params.file);
  try {
    const buf = fs.readFileSync(filePath);
    const json = JSON.parse(decrypt(buf));
    res.render('webpanel_view', { t, file: req.params.file, type: req.params.type, json });
  } catch (e) {
    res.status(500).send('Failed to decrypt or parse file.');
  }
});


function startWebPanel(port = 50249) {
  app.listen(port, () => console.log(`Web panel running on http://localhost:${port}`));
}

// If run directly, start the server
if (require.main === module) {
  startWebPanel();
}

module.exports = { startWebPanel };
