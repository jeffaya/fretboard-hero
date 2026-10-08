// Social crawlers need instrument metadata in the initial HTML, before JavaScript.
const products = {
  guitar: { name: 'Guitar', key: 'guitar' },
  'bass-4': { name: 'Bass', key: 'bass' },
  ukulele: { name: 'Ukulele', key: 'ukulele' }
};
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);
    if (!['/', '/index.html'].includes(url.pathname) || !response.headers.get('content-type')?.includes('text/html')) return response;
    const requested = url.searchParams.get('instrument');
    const instrument = Object.hasOwn(products, requested) ? products[requested] : products.guitar;
    const canonical = `https://fretboard-hero.com/${instrument.key === 'guitar' ? '' : `?instrument=${instrument.key === 'bass' ? 'bass-4' : instrument.key}`}`;
    const title = `${instrument.name} Fretboard Hero — Master the Neck`;
    const description = `Learn the ${instrument.name.toLowerCase()} fretboard with Learn, Daily Routine, Fretboard Map, Quiz and Circle of Fifths.`;
    const image = `https://fretboard-hero.com/assets/instruments/${instrument.key}/og.jpg`;
    const attr = (name, value) => ({ element(el) { el.setAttribute(name, value); } });
    return new HTMLRewriter()
      .on('title', { element(el) { el.setInnerContent(title); } })
      .on('link[rel="canonical"]', attr('href', canonical))
      .on('meta[property="og:url"]', attr('content', canonical))
      .on('meta[property="og:title"], meta[name="twitter:title"]', attr('content', title))
      .on('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]', attr('content', description))
      .on('meta[property="og:image"], meta[name="twitter:image"]', attr('content', image))
      .on('meta[property="og:image:alt"]', attr('content', description))
      .transform(response);
  }
};
