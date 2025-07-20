// Escrow (encrypt) all existing unencrypted JSON data files in /data
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');


// Use the correct 32-byte (64 hex char) key
let key = null;
try {
  // Try .env first
  require('dotenv').config();
  key = process.env.ENCRYPTION_KEY;
  if (!key) {
    // Fallback to .key file
    const keyPath = path.join(__dirname, '../.key');
    const raw = fs.readFileSync(keyPath, 'utf8')
      .split('\n')
      .filter(line => !line.trim().startsWith('#'))
      .join('')
      .replace(/\s/g, '');
    if (/^[a-fA-F0-9]{64}$/.test(raw)) {
      key = raw;
    } else {
      throw new Error('Invalid key in .key file (must be 64 hex chars for 32 bytes)');
    }
  }
} catch (e) {
  console.error('[ESCROW] No valid key found in .env or .key file!');
  process.exit(1);
}

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

function isProbablyEncrypted(buf) {
  // Heuristic: encrypted files are not valid UTF-8/JSON and start with random bytes
  try {
    JSON.parse(buf.toString('utf8'));
    return false;
  } catch {
    return true;
  }
}

function escrowDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      escrowDir(filePath);
    } else if (file.endsWith('.json') && file !== 'badwords.json') {
      const buf = fs.readFileSync(filePath);
      if (!isProbablyEncrypted(buf)) {
        try {
          // Only encrypt if not already encrypted
          const enc = encrypt(buf.toString('utf8'));
          fs.writeFileSync(filePath, enc);
          console.log('[ESCROWED]', filePath);
        } catch (e) {
          console.error('[ERROR]', filePath, e.message);
        }
      } else {
        console.log('[SKIP]', filePath, '(already encrypted?)');
      }
    }
  }
}


// If run directly, perform escrow
if (require.main === module) {
  const dataDir = path.join(__dirname, '../data');
  escrowDir(dataDir);
  console.log('Escrow complete.');
}

// Export for use in index.js
module.exports = { escrowDir };
