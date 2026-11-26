const fs = require('node:fs');
const path = require('node:path');
const instruments = require('../../app/instruments.json');

const locales = ['en-US', 'fr-FR', 'es-ES', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN', 'pt-BR', 'hi-IN', 'id', 'ar', 'bn-BD', 'ru-RU'];
const notesDir = path.join(__dirname, '../../stores/google-play/release-notes');

function readNotes(version, selection, directory = notesDir) {
  if (!/^[0-9]+\.[0-9]+(?:\.[0-9]+)?(?:[.-][A-Za-z0-9]+)*$/.test(version)) throw Error('Invalid version name');
  const file = path.join(directory, version + '.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const selected = selection === 'all' ? Object.keys(instruments) : [selection];
  const applications = {};
  for (const key of Object.keys(data)) {
    if (key !== 'common' && !Object.hasOwn(instruments, key)) throw Error('Unknown instrument in release notes: ' + key);
    if (!data[key] || typeof data[key] !== 'object' || Array.isArray(data[key])) throw Error('Invalid notes for ' + key);
    for (const locale of Object.keys(data[key])) {
      if (!locales.includes(locale)) throw Error('Unknown release-note locale: ' + locale);
    }
  }
  for (const instrument of selected) {
    if (!Object.hasOwn(instruments, instrument)) throw Error('Unknown instrument: ' + instrument);
    const notes = { ...data.common, ...data[instrument] };
    applications[instrument] = locales.map(language => {
      const text = notes[language];
      if (typeof text !== 'string' || !text.trim() || text !== text.trim() || [...text].length > 500) {
        throw Error(version + ' / ' + instrument + ' / ' + language + ': expected 1–500 characters of release notes');
      }
      return { language, text };
    });
  }
  return applications;
}

module.exports = { readNotes, locales, notesDir };
