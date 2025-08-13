// Basic test for utils.js
const assert = require('assert');
const utils = require('../utils/utils');

describe('utils', () => {
  it('should have a randomInt function', () => {
    assert.strictEqual(typeof utils.randomInt, 'function');
    const val = utils.randomInt(1, 10);
    assert.ok(val >= 1 && val <= 10);
  });
});
