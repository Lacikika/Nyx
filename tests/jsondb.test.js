// Basic test for jsondb.js
const assert = require('assert');
const { readUser, writeUser } = require('../utils/jsondb');

describe('jsondb', () => {
  it('should write and read a user', async () => {
    const username = 'testuser';
    const hash = 'testhash';
    await writeUser('webpanel_users', username, 'global', { hash });
    const user = await readUser('webpanel_users', username, 'global');
    assert.strictEqual(user.hash, hash);
  });
});
