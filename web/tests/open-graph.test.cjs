const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('web/index.html','utf8');
const meta=name=>new RegExp(`<meta (?:property|name)="${name}" content="([^"]+)"`).exec(html)?.[1];
const imageUrl=key=>`https://fretboard-hero.com/assets/instruments/${key}/og.jpg${new URL(meta('og:image')).search}`;

test('Initial share metadata uses the existing lightweight JPEG artwork',()=>{
 assert.equal(meta('og:image'),imageUrl('guitar'));assert.equal(meta('twitter:image'),meta('og:image'));
 assert.equal(meta('og:image:type'),'image/jpeg');assert.equal(meta('og:image:width'),'1024');assert.equal(meta('og:image:height'),'500');
 for(const key of ['guitar','bass','ukulele']){
  const image=fs.readFileSync(`web/assets/instruments/${key}/og.jpg`);
  assert.equal(image.readUInt16BE(0),0xffd8);assert.equal(image.readUInt16BE(image.length-2),0xffd9);
  assert.ok(image.length<300000,`${key}: keep social previews below our 300 KB budget`);
 }
});

async function worker(source){
 class Rewriter {
  constructor(){this.handlers=[]}
  on(selector,handler){this.handlers.push([selector,handler]);return this}
  transform(response){
   // Exercise the worker's actual element handlers without a Cloudflare runtime.
   const attributes=new Map();
   for(const [selector,handler] of this.handlers)for(const part of selector.split(', ')){
    const values={};handler.element({setAttribute:(name,value)=>values[name]=value,setInnerContent:value=>values.textContent=value,append:markup=>values.appended=markup});attributes.set(part,values);
   }
   return {response,attributes};
  }
 }
 source=source.replace(/^import .*;\r?\n/gm,'').replace('export default','globalThis.worker =');
 const routes=await import('../core/routes.js');
 const seo=await import('../core/route-seo.js');
 const {routeLocales}=await import('../core/route-locales.js');
 const c=vm.createContext({URL,Request,...routes,...seo,routeLocales,HTMLRewriter:Rewriter});vm.runInContext(source,c);return c.worker;
}
for(const [format,newline] of [['LF','\n'],['CRLF','\r\n']])test(`Worker supplies instrument JPEG metadata before client JavaScript, including shared query URLs (${format})`,async()=>{
 const source=fs.readFileSync('worker.js','utf8').replace(/\r?\n/g,newline);
 const app=await worker(source),response=new Response(html,{headers:{'content-type':'text/html'}});
 for(const pathname of ['/','/index.html'])for(const [instrument,key] of [['guitar','guitar'],['bass-4','bass'],['ukulele','ukulele'],['unknown','guitar']]){
  const {attributes}=await app.fetch(new Request(`https://fretboard-hero.com${pathname}?instrument=${instrument}&lang=fr`),{ASSETS:{fetch:async()=>response}});
  for(const selector of ['meta[property="og:image"]','meta[name="twitter:image"]'])assert.equal(attributes.get(selector).content,imageUrl(key));
  assert.equal(attributes.get('meta[property="og:image:type"]').content,'image/jpeg');
  assert.equal(attributes.get('meta[property="og:image:width"]').content,'1024');assert.equal(attributes.get('meta[property="og:image:height"]').content,'500');
  const structured=JSON.parse(attributes.get('#productStructuredData').textContent);
  assert.equal(structured['@type'],'WebApplication');
  assert.equal(structured.url,attributes.get('link[rel="canonical"]').href);
  assert.equal(structured.image,imageUrl(key));
  assert.equal(structured.inLanguage,'fr');
  assert.equal(structured.description,require('../locales/fr.json')['Learn notes, scales, triads and chords. Build a daily routine and test your fretboard knowledge.']);
  assert.equal(structured.name,attributes.get('#home .hero-name').textContent);
 }
 const image=new Response('image',{headers:{'content-type':'image/jpeg'}});
 assert.equal(await app.fetch(new Request(imageUrl('bass')),{ASSETS:{fetch:async()=>image}}),image,'image responses pass through unchanged');
});
test('All client product profiles preserve the server JPEG URL, MIME type and dimensions',()=>{
 for(const key of ['guitar','bass','ukulele']){
  const nodes=new Map(),get=selector=>{if(!nodes.has(selector))nodes.set(selector,{setAttribute(name,value){this[name]=String(value)}});return nodes.get(selector)};
  const c=vm.createContext({URL,location:{href:'https://fretboard-hero.com/'},document:{querySelector:get},ModeRegistry:{list:()=>[]}});c.window=c;
  for(const path of [`web/products/${key}-fretboard-hero.js`,'web/core/product-shell.js'])vm.runInContext(fs.readFileSync(path,'utf8'),c);
  c.ProductShell.apply(c.FRETBOARD_PRODUCTS[key],{});
  assert.equal(get('meta[property="og:image"]').content,imageUrl(key));assert.equal(get('meta[name="twitter:image"]').content,imageUrl(key));
  assert.equal(get('meta[property="og:image:type"]').content,'image/jpeg');assert.equal(get('meta[property="og:image:width"]').content,'1024');assert.equal(get('meta[property="og:image:height"]').content,'500');
 }
});

test('Worker serves every deep link from the app shell with route-specific canonical metadata',async()=>{
 const {appRoutes}=await import('../core/routes.js');
 const app=await worker(fs.readFileSync('worker.js','utf8'));
 for(const [screen,route] of Object.entries(appRoutes)){
  if(screen==='home')continue;
  for(const suffix of ['', '/']){
   let requested;
   const response=new Response(html,{headers:{'content-type':'text/html'}});
   const result=await app.fetch(new Request(`https://fretboard-hero.com${route.path}${suffix}?instrument=ukulele`),{ASSETS:{fetch:async request=>{requested=new URL(request.url);return response}}});
   assert.equal(requested.pathname,'/');assert.equal(requested.searchParams.get('instrument'),'ukulele');
   assert.equal(result.attributes.get('link[rel="canonical"]').href,`https://fretboard-hero.com${route.path}?instrument=ukulele`);
   assert.ok(result.attributes.get('title').textContent.startsWith(route.title));assert.equal(result.attributes.get('meta[name="description"]').content,route.description);
  }
 }
 const missing=new Response('Not found',{status:404});
 assert.equal(await app.fetch(new Request('https://fretboard-hero.com/practice/unknown'),{ASSETS:{fetch:async()=>missing}}),missing);
});

test('Every published interactive variant agrees with the sitemap before JavaScript', async () => {
 const {appRoutes} = await import('../core/routes.js');
 const {languages, instruments} = require('../core/guide-routes.js');
 const app = await worker(fs.readFileSync('worker.js', 'utf8'));
 const xml = fs.readFileSync('web/sitemap.xml', 'utf8').replaceAll('&amp;', '&');
 const entries = new Map([...xml.matchAll(/<url><loc>([^<]+)<\/loc>(.*?)<\/url>/g)].map(([,url,body]) => [url,body]));
 const response = new Response(html, {headers:{'content-type':'text/html'}});
 const assets = {ASSETS:{fetch:async () => response}};
 for (const route of Object.values(appRoutes)) for (const instrument of instruments) {
  const group = new Map();
  for (const lang of [...languages, 'x-default']) {
   const url = new URL(route.path, 'https://fretboard-hero.com');
   if (instrument !== 'guitar') url.searchParams.set('instrument',instrument);
   if (lang !== 'x-default') url.searchParams.set('lang',lang);
   group.set(lang,url.href);
  }
  for (const [lang,url] of group) {
   const {attributes} = await app.fetch(new Request(url), assets);
   const head = attributes.get('head').appended.replaceAll('&amp;', '&');
   const entry = entries.get(url);
   assert.ok(entry, url);
   for (const [other,href] of group) {
    const alternate = `hreflang="${other}" href="${href}"`;
    assert.ok(head.includes(alternate),url+' HTML '+other);
    assert.ok(entry.includes(alternate),url+' sitemap '+other);
   }
   assert.equal(attributes.get('link[rel="canonical"]').href, url);
   assert.equal(attributes.get('meta[property="og:url"]').content,url);
   assert.equal(attributes.get('html').lang,lang==='x-default'?'en':lang);
   assert.equal(attributes.get('html').dir,lang==='ar'?'rtl':'ltr');
   const data = JSON.parse(attributes.get('#productStructuredData').textContent);
   assert.equal(data.url, url);
   assert.equal(data.inLanguage, attributes.get('html').lang);
   assert.equal(data.description, attributes.get('meta[name="description"]').content);
  }
 }
 for (const [query,expected] of [['lang=pt_BR&screen=quiz','/practice/quiz?lang=pt-BR'],['lang=RU-ru&screen=tuner&mode=extra','/tuner?lang=ru'],['lang=unknown&instrument=bad','/']]) {
  const {attributes} = await app.fetch(new Request('https://fretboard-hero.com/?'+query),assets);
  assert.equal(attributes.get('link[rel="canonical"]').href,'https://fretboard-hero.com'+expected);
 }
});
