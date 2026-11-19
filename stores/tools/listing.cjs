const path = require('node:path');

const languages = { 'en-US': 'en', 'fr-FR': 'fr' };
const additionalLanguages = { 'de-DE': 'de', 'es-ES': 'es', 'it-IT': 'it', 'pt-BR': 'pt-BR', 'hi-IN': 'hi', id: 'id', 'ja-JP': 'ja', 'ko-KR': 'ko', 'zh-CN': 'zh-CN' };
const locale = process.env.STORE_LOCALE || 'en-US';
const instruments = {
  guitar: { appInstrument: 'guitar', profileId: 'guitar-6', strings: 6 },
  bass: { appInstrument: 'bass-4', profileId: 'bass-4', strings: 4 },
  ukulele: { appInstrument: 'ukulele', profileId: 'ukulele', strings: 4 }
};
const instrument = process.env.STORE_INSTRUMENT || 'guitar';
if (!Object.hasOwn(instruments, instrument)) {
  throw new Error(`Unsupported store instrument: ${instrument}`);
}
if (instrument === 'guitar' || instrument === 'bass') Object.assign(languages, additionalLanguages);
if (!Object.hasOwn(languages, locale)) {
  throw new Error(`Unsupported store locale: ${locale}. Expected ${Object.keys(languages).join(', ')}`);
}

module.exports = {
  instrument,
  ...instruments[instrument],
  locale,
  language: languages[locale],
  out: path.resolve(__dirname, '../google-play', instrument, locale)
};

