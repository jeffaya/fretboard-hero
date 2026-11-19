import {appRoutes} from './routes.js';

export const ogLocales = {
  en:'en_US', fr:'fr_FR', es:'es_ES', de:'de_DE', it:'it_IT', 'pt-BR':'pt_BR',
  hi:'hi_IN', id:'id_ID', ja:'ja_JP', ko:'ko_KR', 'zh-CN':'zh_CN', ar:'ar_SA', bn:'bn_BD', ru:'ru_RU'
};

export function requestedLocale(url) {
  const base = url.searchParams.get('lang')?.toLowerCase().split(/[-_]/)[0];
  if (base === 'zh') return 'zh-CN';
  if (base === 'pt') return 'pt-BR';
  return Object.hasOwn(ogLocales, base) ? base : null;
}

// Bare routes keep automatic language selection. An explicit language is shareable
// even when the recipient has different browser preferences.
export function appCanonical(screen, instrument, locale) {
  const url = new URL(appRoutes[screen].path, 'https://fretboard-hero.com');
  if (instrument !== 'guitar') url.searchParams.set('instrument', instrument);
  if (locale) url.searchParams.set('lang', locale);
  return url.href;
}

export function appAlternates(screen, instrument) {
  return Object.keys(ogLocales).map(lang => ({lang, href:appCanonical(screen, instrument, lang)}))
    .concat({lang:'x-default', href:appCanonical(screen, instrument, null)});
}

export function appSummary(screen, instrument, brand, localized) {
  if (localized) {
    const [label, description] = localized[screen];
    return {title:label + ' · ' + brand, description};
  }
  const route = appRoutes[screen];
  const name = brand.replace(' Fretboard Hero', '').toLowerCase();
  const shapes = instrument === 'bass-4' ? 'arpeggios' : 'chords';
  return {
    title:(route.title ? route.title + ' · ' : '') + brand + ' — Pentatonic Scales, Notes & Triads',
    description:route.description || `Practice ${name} with pentatonic positions, note maps, triads, ${shapes} and a guided daily routine. Start with the free demo in A.`
  };
}
