import {routeLocales} from './web/core/route-locales.js';
import {appAlternates, appCanonical, appSummary, ogLocales, requestedLocale} from './web/core/route-seo.js';
import {entryScreen, matchRoute} from './web/core/routes.js';
import { handlePlayBilling } from './server/play-billing.mjs';
// Social crawlers need instrument metadata in the initial HTML, before JavaScript.
const products = {
  guitar: { name: 'Guitar', key: 'guitar', neck: 'six-string guitar' },
  'bass-4': { name: 'Bass', key: 'bass', neck: 'four-string bass' },
  ukulele: { name: 'Ukulele', key: 'ukulele', neck: 'four-string ukulele' }
};
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/billing/google/verify') return handlePlayBilling(request, env);
    const route = matchRoute(url.pathname);
    const screen = route && entryScreen(url);
    const assetUrl = new URL(url);
    if (screen && screen !== 'home') assetUrl.pathname = '/';
    const response = await env.ASSETS.fetch(screen && screen !== 'home' ? new Request(assetUrl, request) : request);
    if (!screen || !response.headers.get('content-type')?.includes('text/html')) return response;
    const requested = url.searchParams.get('instrument');
    const instrumentId = Object.hasOwn(products, requested) ? requested : 'guitar';
    const instrument = products[instrumentId];
    const language = requestedLocale(url);
    const canonical = appCanonical(screen, instrumentId, language);
    const alternates = appAlternates(screen, instrumentId);
    const localized = language && language !== 'en' ? routeLocales[language] : null;
    const {title, description} = appSummary(screen, instrumentId, instrument.name + ' Fretboard Hero', localized);
    const image = `https://fretboard-hero.com/assets/instruments/${instrument.key}/og.jpg?v=20261020.1`;
    const imageAlt = localized ? title : `${instrument.name} Fretboard Hero neon concert artwork with a ${instrument.neck} neck, Tuner, Daily Routine with live mic feedback, Learn, Fretboard Map, Circle of Fifths and Quiz`;
    const attr = (name, value) => ({ element(el) { el.setAttribute(name, value); } });
    const rewriter = new HTMLRewriter()
      .on('html', { element(el) {
        el.setAttribute('lang', language || 'en');
        el.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
      } })
      .on('head', { element(el) {
        // Only URLs built from the route, instrument and language registries enter this markup.
        el.append(alternates.map(({lang, href}) =>
          `<link rel="alternate" hreflang="${lang}" href="${href.replace(/&/g, '&amp;')}">`
        ).join(''), {html:true});
      } })
      .on('title', { element(el) { el.setInnerContent(title); } })
      .on('link[rel="canonical"]', attr('href', canonical))
      .on('meta[property="og:url"]', attr('content', canonical))
      .on('meta[property="og:locale"]', attr('content', ogLocales[language || 'en']))
      .on('meta[property="og:title"], meta[name="twitter:title"]', attr('content', title))
      .on('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]', attr('content', description))
      .on('meta[property="og:image"], meta[name="twitter:image"]', attr('content', image))
      .on('meta[property="og:image:type"]', attr('content', 'image/jpeg'))
      .on('meta[property="og:image:width"]', attr('content', '1024'))
      .on('meta[property="og:image:height"]', attr('content', '500'))
      .on('meta[property="og:image:alt"], meta[name="twitter:image:alt"]', attr('content', imageAlt))
      .on('#home .hero-name', { element(el) { el.setInnerContent(`${instrument.name} Fretboard Hero`); } })
      .on('#productStructuredData', { element(el) {
        el.setInnerContent(JSON.stringify({
          '@context':'https://schema.org', '@type':'WebApplication',
          name:`${instrument.name} Fretboard Hero`, url:canonical, description,
          applicationCategory:'EducationalApplication', operatingSystem:'Web browser',
          isAccessibleForFree:true, inLanguage:language || 'en', image,
          author:{'@type':'Person',name:'Jean-François Seignemorte'},
          featureList:localized ? Object.entries(localized).filter(([name])=>name!=='home').map(([,pair])=>pair[0]) : ['Pentatonic positions','Fretboard note map','Triads','Daily Routine','Tuner','Circle of Fifths','Quiz']
        }).replace(/</g, '\\u003c'), {html:true});
      } });
    // These are also the initial crawlable links before the app mounts.
    for (const [target, labels] of Object.entries(routeLocales[language || 'en'])) {
      if (target === 'home') continue;
      const selector = target === 'tuner' ? '#homeTuner' : `#home a[data-go="${target}"]`;
      rewriter.on(selector, attr('href', appCanonical(target, instrumentId, language)));
      if (localized) {
        rewriter.on(selector + ' strong', {element(el) { el.setInnerContent(labels[0]); }});
        rewriter.on(selector + ' small', {element(el) { el.setInnerContent(labels[1]); }});
      }
    }
    return rewriter.transform(response);
  }
};

