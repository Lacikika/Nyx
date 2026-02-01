// Basic test for jsondb.js
const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');
const { readUser, writeUser } = require('../utils/jsondb');

describe('jsondb', () => {
  it('should write and read a user', async () => {
    const username = 'testuser';
    const hash = 'testhash';
    await writeUser('webpanel_users', username, 'global', { hash });
    const user = await readUser('webpanel_users', username, 'global');
    assert.strictEqual(user.hash, hash);
  });

  it('should store data encrypted on disk', async () => {
    const username = 'enc_test';
    const data = { secret: 'hidden' };
    const guildId = 'global';

    await writeUser('test_enc', username, guildId, data);

    // Check file on disk
    const filePath = path.join(__dirname, '../data/test_enc', `${guildId}_${username}.json`);
    const buf = await fs.readFile(filePath);

    // Should not be plain JSON
    let isJson = false;
    try {
      JSON.parse(buf.toString());
      isJson = true;
    } catch {}

    assert.strictEqual(isJson, false, 'File should be encrypted, not plain JSON');

    // Read back using api
    const readBack = await readUser('test_enc', username, guildId);
    assert.strictEqual(readBack.secret, 'hidden');

    // Cleanup
    await fs.unlink(filePath);
    await fs.rmdir(path.join(__dirname, '../data/test_enc')).catch(() => {});
  });
});
