const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const origin='https://fretboard-hero.com';
const decode=s=>s.replace(/&amp;/g,'&');
const read=p=>fs.readFileSync(p,'utf8');
const moduleURL=p=>pathToFileURL(path.resolve(p)).href;

test('Public pages and sitemap are reproducible from the reviewed bilingual content',async()=>{
 const {generatedFiles}=await import(moduleURL('scripts/build-seo.mjs'));
 const {languages}=await import(moduleURL('scripts/seo/content.mjs'));
 const generated=generatedFiles();
 assert.equal(generated.size,Object.values(languages).reduce((total,language)=>total+language.pages.length,0)+2);
 for(const [filename,content] of generated)assert.equal(read(filename),content,`${filename}: run node scripts/build-seo.mjs`);
});

test('Privacy and editorial pages share the same style dependencies and existing product logo',async()=>{
 const {generatedFiles}=await import(moduleURL('scripts/build-seo.mjs'));
 const expected=['/theme.css','/locales.css','/public-pages.css'];
 for(const [file,html] of generatedFiles()){
  if(!file.endsWith('.html'))continue;
  const styles=[...html.matchAll(/rel="stylesheet" href="([^"]+)"/g)].map(m=>new URL(m[1],origin).pathname);
  assert.deepEqual(styles,file==='web/privacy.html'?expected:expected.concat('/footer.css','/premium.css'),file);
  assert.match(html,/class="public-page"/);assert.match(html,/class="site-header"/);assert.match(html,file==='web/privacy.html'?/class="site-footer"/:/class="home-footer"/);
  assert.match(html,/assets\/home\/product-wordmarks.webp/);
  assert.doesNotMatch(html,/<style\b|style="|guides\.css|privacy\.css/);
 }
 assert.ok(!fs.existsSync('web/privacy.css')&&!fs.existsSync('web/guides.css'));
});

test('Every guide has readable initial HTML, a unique canonical and reciprocal language links',async()=>{
 const {languages}=await import(moduleURL('scripts/seo/content.mjs'));
 const canonicals=new Set(),titles=new Set();
 for(const [lang,copy] of Object.entries(languages))for(const page of copy.pages){
  const route=page.id==='about'?copy.about:copy.base+page.slug;
  const html=read(`web${route}index.html`);
  assert.match(html,new RegExp(`<html lang="${lang}">`));
  assert.equal((html.match(/<h1>/g)||[]).length,1);
  assert.ok(html.includes(page.heading));assert.ok(html.includes(page.intro));
  assert.ok(page.sections.length>=3,'Substantive guide sections must ship in HTML');
  const canonical=html.match(/rel="canonical" href="([^"]+)"/)[1];
  assert.equal(canonical,origin+route);assert.ok(!canonicals.has(canonical));canonicals.add(canonical);
  const title=html.match(/<title>(.*?)<\/title>/)[1];assert.ok(!titles.has(title));titles.add(title);
  assert.doesNotMatch(html,/noindex/);
  const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
  assert.deepEqual(scripts,['/core/i18n.js','/core/modal.js','/core/access.js','/core/footer.js','/guide.js']);
  for(const other of Object.keys(languages)){
   const match=html.match(new RegExp(`hreflang="${other}" href="([^"]+)"`));assert.ok(match);
   const target=read(`web${new URL(match[1]).pathname}index.html`);
   assert.ok(target.includes(`hreflang="${lang}" href="${canonical}"`),'Language links must be reciprocal');
  }
  const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  assert.ok(graph.some(node=>node.url===canonical&&node.inLanguage===lang));
  const app=graph.find(node=>node['@type']==='SoftwareApplication');
  assert.equal(app.downloadUrl,'https://play.google.com/store/apps/details?id=com.guitar.fretboardhero');
  assert.ok(!app.aggregateRating&&!app.review&&!app.offers,'Do not invent ratings, reviews or a universal store price');
  for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   const link=decode(match[1]);if(link.startsWith('#')||link.startsWith('mailto:'))continue;
   const url=new URL(link,origin);if(url.origin!==origin)continue;
   const pathname=url.pathname;
   const local=pathname==='/'?'web/index.html':pathname==='/privacy'?'web/privacy.html':`web${pathname}${pathname.endsWith('/')?'index.html':''}`;
   assert.ok(fs.existsSync(local),`${route}: missing local target ${link}`);
  }
 }
 assert.equal(canonicals.size,Object.values(languages).reduce((total,language)=>total+language.pages.length,0));
});

test('Sitemap contains only canonical public pages and robots leaves search crawling open',async()=>{
 const {languages}=await import(moduleURL('scripts/seo/content.mjs'));
 const sitemap=read('web/sitemap.xml');
 const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>decode(m[1]));
 assert.equal(urls.length,Object.values(languages).reduce((total,language)=>total+language.pages.length,0)+10);
 assert.equal(new Set(urls).size,urls.length);
 for(const value of urls){const url=new URL(value);assert.equal(url.origin,origin);assert.ok(!url.hash);assert.ok(!url.searchParams.has('screen'));assert.ok(!url.searchParams.has('key'));assert.ok(!url.pathname.startsWith('/api/'));}
 const robots=read('web/robots.txt');assert.match(robots,/User-agent: \*/);assert.match(robots,/Disallow: \/api\//);
 assert.doesNotMatch(robots,/Disallow:\s*\/$/m);assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
 const home=read('web/index.html');assert.match(home,/<a class="hero-btn guide-card" href="\/en\/guitar\/">/);
 assert.doesNotMatch(home,/class="home-guides"/);
});

test('Pentatonic example is available as real note and fret data, with an accessible diagram',()=>{
 for(const route of ['fr/guitare/pentatonique','en/guitar/pentatonic-scales']){
  const html=read(`web/${route}/index.html`);
  assert.match(html,/aria-labelledby="penta-title penta-desc"/);
  assert.match(html,/<caption>/);assert.match(html,/5 → 8/);assert.match(html,/5 → 7/);
  assert.match(html,/screen=learn&amp;mode=penta/);
 }
});

test('Every guide reuses the home footer, moves language links out of the header and opens the shared dialog',async()=>{
 const {generatedFiles}=await import(moduleURL('scripts/build-seo.mjs'));
 const home=read('web/index.html'),homeFooter=home.match(/<footer class="home-footer">([\s\S]*?)<\/footer>/)[1];
 const shape=html=>[...html.matchAll(/class="([^"]+)"/g)].map(m=>m[1]);
 const homeMenus=[...home.matchAll(/<a class="hero-btn [^"]*"[^>]*data-go="[^"]+"[\s\S]*?<\/a>/g)].map(m=>m[0].replace(/ href="[^"]*"/g,'')).join('');
 for(const [file,html] of generatedFiles()){
  if(!file.endsWith('.html')||file==='web/privacy.html')continue;
  const footer=html.match(/<footer class="home-footer">([\s\S]*?)<\/footer>/)[1];
  assert.deepEqual(shape(footer),shape(homeFooter),file);
  const header=html.match(/<header class="site-header">([\s\S]*?)<\/header>/)[1];
  assert.doesNotMatch(header,/language|<details|<summary/);
  assert.match(footer,/hreflang="en"/);assert.match(footer,/hreflang="fr"/);
  assert.match(footer,/mailto:hello@fretboard-hero.com/);
  assert.match(html,/<button[^>]*data-get-app[^>]*aria-haspopup="dialog"/);
  assert.doesNotMatch(html,/<a[^>]*href="https:\/\/play.google.com/);
  assert.equal(html.match(/<template id="guideAppMenu">([\s\S]*?)<\/template>/)[1],homeMenus);
  const data=JSON.parse(html.match(/<script type="application\/json" id="guideConfig">([\s\S]*?)<\/script>/)[1]);
  assert.equal(data.locale,file.startsWith('web/fr/')?'fr':'en');
  assert.equal(data.languages.find(l=>l.locale===data.locale).href,file.slice(3).replace('index.html',''));
 }
});
