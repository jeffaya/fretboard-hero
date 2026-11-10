import {appRoutes, entryScreen, routeURL} from './routes.js';

export function createNavigation() {
  const native = ['android','ios'].includes(window.Capacitor?.getPlatform?.());
  const listeners = new Set();
  let screen = entryScreen(new URL(location.href));
  let baseTitle = document.title;
  let baseDescription = document.querySelector('meta[name="description"]')?.content;

  function metadata() {
    const route = appRoutes[screen];
    const title = screen === 'home' ? baseTitle : `${window.FretboardI18n?.text(route.title) || route.title} · ${window.FRETBOARD_ACTIVE_PRODUCT.name}`;
    const canonical = new URL(route.path, 'https://fretboard-hero.com');
    if (window.FRETBOARD_SITE_CONFIG.instrument !== 'guitar') canonical.searchParams.set('instrument', window.FRETBOARD_SITE_CONFIG.instrument);
    document.title = title;
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical.href);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical.href);
    for (const selector of ['meta[property="og:title"]','meta[name="twitter:title"]']) document.querySelector(selector)?.setAttribute('content', title);
    for (const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]']) document.querySelector(selector)?.setAttribute('content', route.description || baseDescription);
    const structured = document.querySelector('#productStructuredData');
    if (structured) {
      const data = JSON.parse(structured.textContent); data.url = canonical.href;
      structured.textContent = JSON.stringify(data);
    }
  }
  function write(next, {replace = false} = {}) {
    screen = next;
    if (!native) {
      const url = routeURL(screen, location.href);
      if (url.href !== location.href) history[replace ? 'replaceState' : 'pushState'](null, '', url);
    }
    metadata();
  }
  function canHandle(event) {
    return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && (!event.currentTarget.target || event.currentTarget.target === '_self');
  }
  for (const link of document.querySelectorAll('#home a[data-go],#home a[data-open-tuner]')) {
    const url = routeURL(link.dataset.go || 'tuner', location.href);
    url.searchParams.set('instrument', window.FRETBOARD_SITE_CONFIG.instrument);
    url.searchParams.set('lang', window.FretboardI18n.locale);
    link.href = url.pathname + url.search;
  }
  window.addEventListener('popstate', () => {
    screen = entryScreen(new URL(location.href));
    metadata();
    listeners.forEach(listener => listener(screen));
  });
  return {read: () => screen, write, canHandle, refresh: () => {baseTitle = document.title; baseDescription = document.querySelector('meta[name="description"]')?.content;}, subscribe: listener => listeners.add(listener)};
}

window.FretboardNavigation = createNavigation();
