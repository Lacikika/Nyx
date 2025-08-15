// Basic test for events loading
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pool } = require('../utils/mysql');

describe('events', () => {
  it('should load all event files', () => {
    const eventsDir = path.join(__dirname, '../src/events');
    const files = fs.readdirSync(eventsDir).filter(f => f.endsWith('.js'));
    assert.ok(files.length > 0, 'No event files found');
  });
});

afterAll(async () => {
  await pool.end();
});
