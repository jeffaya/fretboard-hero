import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {formatNote} = require('../../web/core/i18n.js');
const byLocale = new Map();

// Keep the written degree (e.g. E♯ in C♯ major) even when two pitches sound alike.
export function lessonNotation(locale) {
  if (byLocale.has(locale)) return byLocale.get(locale);
  const catalog = require(`../../web/locales/${locale}.json`);
  const names = {};
  for (const letter of 'CDEFGAB') {
    if (!catalog['Note name ' + letter]) throw new Error(`Missing note ${letter} in ${locale}`);
    for (const accidental of ['', '♯', '♭', '♯♯', '♭♭']) {
      const spelling = letter + accidental;
      names[spelling] = formatNote(spelling, locale, catalog);
    }
  }
  // In tab, lowercase distinguishes the high e on guitar and re-entrant g on ukulele.
  for (const letter of ['E', 'G']) names[letter.toLowerCase()] = names[letter].toLocaleLowerCase(locale);
  byLocale.set(locale, names);
  return names;
}
