// Simple web panel for browsing escrowed (encrypted) data
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();

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


app.get('/', (req, res) => {
  res.render('webpanel_index', {
    logs: listFiles('logs'),
    profiles: listFiles('profiles'),
    guilds: listFiles('guilds')
  });
});

// Statistics page
app.get('/statistics', (req, res) => {
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
app.get('/blank', (req, res) => {
  res.render('blank');
});

// Search endpoint for files by name or ID
app.get('/search', (req, res) => {
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
  res.render('webpanel_search', { q, results });
});

app.get('/data/:type/:file', (req, res) => {
  const filePath = path.join(__dirname, '../data', req.params.type, req.params.file);
  try {
    const buf = fs.readFileSync(filePath);
    const json = JSON.parse(decrypt(buf));
    res.render('webpanel_view', { file: req.params.file, type: req.params.type, json });
  } catch (e) {
    res.status(500).send('Failed to decrypt or parse file.');
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
