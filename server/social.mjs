import site from '../web/site.config.json' with { type: 'json' };
import instruments from '../app/instruments.json' with { type: 'json' };

export function socialIdentity(requestUrl) {
  const requested = new URL(requestUrl).searchParams.get('instrument');
  const instrument = Object.hasOwn(instruments, requested) ? requested : site.instrument;
  const product = instruments[instrument];
  const url = new URL(site.publicUrl);
  if (instrument !== 'guitar') url.searchParams.set('instrument', instrument);
  return {
    instrument, name: product.name, url: url.href,
    image: new URL(`assets/og/${product.iconKey}.jpg?v=10.22.0`, site.publicUrl).href,
    iconBase: new URL(`assets/icons/${product.iconKey}/`, site.publicUrl).href,
    manifest: new URL(`manifests/${product.iconKey}.webmanifest`, site.publicUrl).href,
    description: 'Practice notes, scales and chords. Play daily licks, explore the fretboard, test your skills and discover the Circle of Fifths.',
  };
}

const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderSocialHtml(html, identity) {
  const title = `${identity.name} — Master the Neck`;
  const meta = {
    'og:title': title, 'og:site_name': identity.name, 'og:url': identity.url,
    'og:image': identity.image, 'og:image:alt': `${identity.name} home: Practice, Play, Fretboard Map, Quiz and Circle of Fifths`,
    'og:description': identity.description, 'twitter:title': title,
    'twitter:description': identity.description, 'twitter:image': identity.image,
    'application-name': identity.name, 'apple-mobile-web-app-title': identity.name,
    'description': identity.description, 'msapplication-TileImage': `${identity.iconBase}favicon-144.png?v=10.22.0`,
  };
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escape(title)}</title>`);
  html = html.replace(/<meta\s[^>]*>/g, tag => {
    const key = tag.match(/(?:property|name)="([^"]+)"/)?.[1];
    return Object.hasOwn(meta, key) ? tag.replace(/content="[^"]*"/, `content="${escape(meta[key])}"`) : tag;
  });
  html = html.replace(/<link\s[^>]*>/g, tag => {
    const rel = tag.match(/rel="([^"]+)"/)?.[1], size = tag.match(/sizes="([^"]+)"/)?.[1];
    let href;
    if (rel === 'canonical') href = identity.url;
    else if (rel === 'manifest') href = identity.manifest;
    else if (rel === 'apple-touch-icon') href = `${identity.iconBase}${size==='180x180'?'apple-touch-icon.png':`favicon-${size.split('x')[0]}.png`}?v=10.22.0`;
    else if (rel === 'shortcut icon' || (rel === 'icon' && size?.includes(' '))) href = `${identity.iconBase}favicon.ico?v=10.22.0`;
    else if (rel === 'icon' && size) href = `${identity.iconBase}favicon-${size.split('x')[0]}.png?v=10.22.0`;
    if (!href) return tag;
    return /href=/.test(tag) ? tag.replace(/href="[^"]*"/, `href="${escape(href)}"`) : tag.replace(/>$/, ` href="${escape(href)}">`);
  });
  const data = JSON.stringify({'@context':'https://schema.org','@type':'WebApplication',name:identity.name,url:identity.url,image:identity.image,description:identity.description,applicationCategory:'EducationalApplication',operatingSystem:'Any'}).replace(/</g, '\\u003c');
  return html.replace(/(<script id="productStructuredData"[^>]*>).*?(<\/script>)/s, `$1${data}$2`);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!['/', '/index.html'].includes(url.pathname) || !['GET', 'HEAD'].includes(request.method)) return env.ASSETS.fetch(request);
    const assetUrl = new URL('/', url); // Strip query parameters from the asset lookup.
    const response = await env.ASSETS.fetch(new Request(assetUrl, {method:'GET'}));
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return response;
    const html = renderSocialHtml(await response.text(), socialIdentity(request.url));
    const headers = new Headers(response.headers);
    headers.delete('content-length'); headers.delete('etag'); headers.delete('content-encoding');
    headers.set('cache-control', 'no-cache');
    return new Response(request.method === 'HEAD' ? null : html, {status:response.status,headers});
  },
};
