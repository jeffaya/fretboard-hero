const path = require('node:path');

const languages = { 'en-US': 'en', 'fr-FR': 'fr' };
const locale = process.env.STORE_LOCALE || 'en-US';
if (!Object.hasOwn(languages, locale)) {
  throw new Error(`Unsupported store locale: ${locale}. Expected ${Object.keys(languages).join(', ')}`);
}

module.exports = {
  locale,
  language: languages[locale],
  out: path.resolve(__dirname, '../google-play/guitar', locale)
};
