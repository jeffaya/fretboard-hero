const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const routes=require('../core/guide-routes.js');
const origin='https://fretboard-hero.com';
const decode=s=>s.replace(/&amp;/g,'&');
let generated,copy;
async function content(){generated||=(await import('../../scripts/build-seo.mjs')).generatedFiles();copy||=(await import('../../scripts/lessons/translations.mjs')).copy;return generated;}
test('All instrument lessons, Privacy and existing About pages are reproducible',async()=>{
 const {languages: about}=await import('../../scripts/seo/content.mjs');
 assert.equal((await content()).size,routes.languages.length*routes.instruments.length*routes.topics.length+Object.keys(about).length+3);
 for(const [filename,html] of generated)assert.equal(fs.readFileSync(filename,'utf8'),html,filename);
});
test('Every app language has complete translated courses and UI, with no paragraph fallback',async()=>{
 await content();const ctx={window:{}};require('node:vm').runInNewContext(fs.readFileSync('web/core/i18n.js','utf8'),ctx);
 assert.deepEqual([...routes.languages].sort(),Array.from(ctx.window.FretboardI18n.languages,x=>x[0]).sort());
 const {lessonCopy}=await import('../../scripts/lessons/translations.mjs');
 for(const locale of routes.languages){const t=lessonCopy(locale);
  assert.equal(t.nav.length,7);assert.equal(t.tuning.length,3);assert.equal(t.bass.length,3);assert.equal(Object.keys(t.ui).length,40);
  const catalog=JSON.parse(fs.readFileSync(`web/locales/${locale}.json`,'utf8'));
  assert.equal(t.nav[0],catalog['Music theory'],locale);
  for(const topic of routes.topics){assert.equal(t[topic].length,5);for(const [i,p] of t[topic].entries()){assert.ok(p.trim().length>0);if(locale!=='en')assert.notEqual(p,lessonCopy('en')[topic][i],`${locale} ${topic} ${i}`);}}
 }
});
test('Every lesson has initial HTML illustrations, correct product branding and reciprocal language routes',async()=>{
 await content();const canonicals=new Set();
 for(const locale of routes.languages)for(const instrument of routes.instruments)for(const topic of routes.topics){
  const route=routes.route(locale,instrument,topic),html=generated.get('web'+route+'index.html');
  assert.match(html,new RegExp(`<html lang="${locale}"${locale==='ar'?' dir="rtl"':''}>`));assert.equal((html.match(/<h1>/g)||[]).length,1);
  assert.equal((html.match(/class="content-section(?: lesson-sources)?"/g)||[]).length,topic==='tabs'?8:7);assert.match(html,/class="tab-diagram/);
  assert.ok(html.includes((await import('../../scripts/lessons/translations.mjs')).lessonCopy(locale)[topic][0]));assert.match(html,/data-exercise-link/);
  assert.doesNotMatch(html,/class="byline"|class="page-aside"|data-get-app|Written by|Start with the free demo/);
  const canonical=html.match(/rel="canonical" href="([^"]+)"/)[1];assert.equal(canonical,origin+route);assert.ok(!canonicals.has(canonical));canonicals.add(canonical);
  const expectedViewport={guitar:'0 0 900 550','bass-4':'900 0 900 550',ukulele:'1800 0 900 550'}[instrument];
  assert.ok(html.includes(`viewBox="${expectedViewport}"`));
  if(topic==='chords'){
   assert.equal((html.match(/data-chord-family="/g)||[]).length,12,route);
   assert.doesNotMatch(html,/chord-quality|quality-picker/);
  }
  const config=JSON.parse(html.match(/id="guideConfig">([\s\S]*?)<\/script>/)[1]);assert.equal(config.instrument,instrument);assert.equal(config.locale,locale);assert.equal(config.languages.length,routes.languages.length);
  for(const other of routes.languages){const target=origin+routes.route(other,instrument,topic);assert.ok(html.includes(`hreflang="${other}" href="${target}"`));const counterpart=generated.get('web'+routes.route(other,instrument,topic)+'index.html');assert.ok(counterpart.includes(`hreflang="${locale}" href="${canonical}"`));}
  const graph=JSON.parse(html.match(/type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.ok(graph['@graph'].some(n=>n.url===canonical&&n.inLanguage===locale));
  const header=html.match(/<header class="site-header">([\s\S]*?)<\/header>/)[1];assert.doesNotMatch(header,/language|<details/);
  const home=new URL(decode(header.match(/class="brand" href="([^"]+)"/)[1]),origin);
  assert.equal(home.pathname,'/');assert.equal(home.searchParams.get('instrument'),instrument);assert.equal(home.searchParams.get('lang'),locale);
  const menus=[...html.matchAll(/<nav\b[^>]*>([\s\S]*?)<\/nav>/g)];
  assert.equal(menus.length,1,route);
  const links=[...menus[0][1].matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)];
  assert.deepEqual(links.map(link=>link[1]),routes.topics.map(t=>routes.route(locale,instrument,t)));
  assert.equal(links[0][2],copy[locale].nav[0]);
  for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   const value=decode(match[1]);if(value.startsWith('#')||value.startsWith('mailto:'))continue;
   const url=new URL(value,origin);if(url.origin!==origin)continue;
   let pathname=url.pathname;if(pathname==='/')pathname='/index.html';if(pathname==='/privacy')pathname='/privacy.html';if(pathname.endsWith('/'))pathname+='index.html';
   assert.ok(generated.has('web'+pathname)||fs.existsSync('web'+pathname),route+': '+pathname);
  }
 }
 assert.equal(canonicals.size,routes.languages.length*routes.instruments.length*routes.topics.length);
});
test('Sitemap contains every course once, preserving older canonical routes',async()=>{
 const files=await content(),xml=files.get('web/sitemap.xml');const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>decode(m[1]));assert.equal(new Set(urls).size,urls.length);
 for(const locale of routes.languages)for(const instrument of routes.instruments)for(const topic of routes.topics)assert.ok(urls.includes(origin+routes.route(locale,instrument,topic)));
 for(const route of ['/fr/guitare/pentatonique/','/en/guitar/triads/','/fr/a-propos/','/en/about/'])assert.ok(urls.includes(origin+route));
 assert.equal(routes.route('hi','bass-4','chords'),'/hi/bass/chords/');
});
