import {routeLocales} from './route-locales.js?v=10.58.1';
import {appAlternates, appCanonical, appSummary, ogLocales, requestedLocale} from './route-seo.js';
import {entryScreen, routeURL} from './routes.js';

export function createNavigation() {
  const native = ['android','ios'].includes(window.Capacitor?.getPlatform?.());
  const listeners = new Set();
  let screen = entryScreen(new URL(location.href));

  function metadata() {
    const explicit = requestedLocale(new URL(location.href));
    const locale = window.FretboardI18n.locale;
    const instrument = window.FRETBOARD_SITE_CONFIG.instrument;
    const {title, description} = appSummary(screen, instrument, window.FRETBOARD_ACTIVE_PRODUCT.name, locale === 'en' ? null : routeLocales[locale]);
    const canonical = appCanonical(screen, instrument, explicit);
    for (const {lang, href} of appAlternates(screen, instrument)) {
      let link = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
      if (!link) {
        link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = lang;
        document.head.append(link);
      }
      link.href = href;
    }
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', ogLocales[locale]);
    document.title = title;
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);
    for (const selector of ['meta[property="og:title"]','meta[name="twitter:title"]']) document.querySelector(selector)?.setAttribute('content', title);
    for (const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]']) document.querySelector(selector)?.setAttribute('content', description);
    if (locale !== 'en') {
      for (const selector of ['meta[property="og:image:alt"]','meta[name="twitter:image:alt"]']) document.querySelector(selector)?.setAttribute('content', title);
    }
    const structured = document.querySelector('#productStructuredData');
    if (structured) {
      const data = JSON.parse(structured.textContent); data.inLanguage = locale; data.url = canonical; data.description = description;
      if (locale !== 'en') data.featureList = Object.entries(routeLocales[locale]).filter(([name]) => name !== 'home').map(([,pair]) => pair[0]);
      structured.textContent = JSON.stringify(data);
    }
  }
  function destination(next) {
    const url = routeURL(next, location.href);
    // A remembered instrument must also survive sharing or opening a fresh tab.
    if (window.FRETBOARD_SITE_CONFIG.instrument !== 'guitar' || url.searchParams.has('instrument')) url.searchParams.set('instrument', window.FRETBOARD_SITE_CONFIG.instrument);
    return url;
  }
  function write(next, {replace = false} = {}) {
    screen = next;
    if (!native) {
      const url = destination(screen);
      if (url.href !== location.href) history[replace ? 'replaceState' : 'pushState'](null, '', url);
    }
    metadata();
  }
  function canHandle(event) {
    return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && (!event.currentTarget.target || event.currentTarget.target === '_self');
  }
  for (const link of document.querySelectorAll('#home a[data-go],#home a[data-open-tuner]')) {
    const url = destination(link.dataset.go || 'tuner');
    link.href = url.pathname + url.search;
  }
  window.addEventListener('popstate', () => {
    screen = entryScreen(new URL(location.href));
    metadata();
    listeners.forEach(listener => listener(screen));
  });
  return {read: () => screen, write, canHandle, subscribe: listener => listeners.add(listener)};
}

window.FretboardNavigation = createNavigation();
