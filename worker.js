import { handlePlayBilling } from './server/play-billing.mjs';
// Social crawlers need instrument metadata in the initial HTML, before JavaScript.
const products = {
  guitar: { name: 'Guitar', key: 'guitar', neck: 'six-string guitar', shapes: 'chords' },
  'bass-4': { name: 'Bass', key: 'bass', neck: 'four-string bass', shapes: 'arpeggios' },
  ukulele: { name: 'Ukulele', key: 'ukulele', neck: 'four-string ukulele', shapes: 'chords' }
};
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/billing/google/verify') return handlePlayBilling(request, env);
    const response = await env.ASSETS.fetch(request);
    if (!['/', '/index.html'].includes(url.pathname) || !response.headers.get('content-type')?.includes('text/html')) return response;
    const requested = url.searchParams.get('instrument');
    const instrument = Object.hasOwn(products, requested) ? products[requested] : products.guitar;
    const canonical = `https://fretboard-hero.com/${instrument.key === 'guitar' ? '' : `?instrument=${instrument.key === 'bass' ? 'bass-4' : instrument.key}`}`;
    const title = `${instrument.name} Fretboard Hero — Tune, Learn & Play`;
    const description = `Tune your ${instrument.name.toLowerCase()}, play Daily Routine with live mic feedback, and explore fretboard notes, scales, triads and ${instrument.shapes}. Test yourself in the quiz.`;
    const image = `https://fretboard-hero.com/assets/instruments/${instrument.key}/og.jpg?v=10.35.0`;
    const imageAlt = `${instrument.name} Fretboard Hero neon concert artwork with a ${instrument.neck} neck, Tuner, Daily Routine with live mic feedback, Learn, Fretboard Map, Circle of Fifths and Quiz`;
    const attr = (name, value) => ({ element(el) { el.setAttribute(name, value); } });
    return new HTMLRewriter()
      .on('title', { element(el) { el.setInnerContent(title); } })
      .on('link[rel="canonical"]', attr('href', canonical))
      .on('meta[property="og:url"]', attr('content', canonical))
      .on('meta[property="og:title"], meta[name="twitter:title"]', attr('content', title))
      .on('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]', attr('content', description))
      .on('meta[property="og:image"], meta[name="twitter:image"]', attr('content', image))
      .on('meta[property="og:image:alt"], meta[name="twitter:image:alt"]', attr('content', imageAlt))
      .transform(response);
  }
};
