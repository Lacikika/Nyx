// De-escrow (decrypt) a data file and pretty-print it
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const keyPath = path.join(__dirname, '../.key');
const key = fs.readFileSync(keyPath, 'utf8').replace(/[^a-fA-F0-9]/g, '').slice(0, 32);
if (!key || key.length !== 32) throw new Error('Invalid key in .key file (must be 32 bytes hex)');

function decryptFile(filePath) {
  const enc = fs.readFileSync(filePath);
  const iv = enc.slice(0, 16);
  const data = enc.slice(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(data);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

if (process.argv.length < 3) {
  console.log('Usage: node deescrow.js <encrypted_file>');
  process.exit(1);
}

const file = process.argv[2];
try {
  const json = decryptFile(file);
  console.log(JSON.stringify(JSON.parse(json), null, 2));
} catch (e) {
  console.error('Failed to decrypt or parse file:', e.message);
  process.exit(2);
}
