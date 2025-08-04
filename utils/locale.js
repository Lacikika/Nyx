const fs = require('fs');
const path = require('path');
const config = require('../src/config');

let translations = {};

try {
  const localeFile = path.join(__dirname, `../locales/${config.language}.json`);
  if (fs.existsSync(localeFile)) {
    translations = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
  } else {
    console.warn(`[LOCALE] Language file not found for ${config.language}, falling back to 'en'`);
    const fallbackFile = path.join(__dirname, '../locales/en.json');
    if (fs.existsSync(fallbackFile)) {
      translations = JSON.parse(fs.readFileSync(fallbackFile, 'utf8'));
    } else {
      console.error("[LOCALE] Fallback language file 'en.json' not found. No translations will be available.");
    }
  }
} catch (error) {
  console.error('[LOCALE] Error loading language file:', error);
}

function t(key, replacements = {}) {
  let translation = translations[key] || key;
  for (const placeholder in replacements) {
    translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
  }
  return translation;
}

module.exports = t;
