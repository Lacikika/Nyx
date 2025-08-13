// Basic test for commands loading
const assert = require('assert');
const fs = require('fs');
const path = require('path');

describe('commands', () => {
  it('should load all command files', () => {
    const commandsDir = path.join(__dirname, '../src/commands');
    function walk(dir) {
      let results = [];
      fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          results = results.concat(walk(filePath));
        } else if (file.endsWith('.js')) {
          results.push(filePath);
        }
      });
      return results;
    }
    const files = walk(commandsDir);
    assert.ok(files.length > 0, 'No command files found');
  });
});
