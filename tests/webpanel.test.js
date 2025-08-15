// Basic test for webpanel.js
const assert = require('assert');
const webpanel = require('../webpanel/webpanel');
const { pool } = require('../utils/mysql');

describe('webpanel', () => {
  it('should export startWebPanel', () => {
    assert.strictEqual(typeof webpanel.startWebPanel, 'function');
  });
});

afterAll(async () => {
  await pool.end();
});
