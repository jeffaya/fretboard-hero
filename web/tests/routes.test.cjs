const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const routeModule=()=>import(pathToFileURL(path.resolve('web/core/routes.js')).href);

test('Public routes resolve direct URLs, trailing slashes and legacy links without trusting arbitrary screen names',async()=>{
 const {appRoutes,entryScreen,matchRoute,routeURL}=await routeModule();
 for(const [screen,route] of Object.entries(appRoutes)){
  for(const suffix of ['', '/'])assert.equal(matchRoute(route.path+suffix),screen);
  assert.equal(entryScreen(new URL('https://example.com'+route.path+'?screen=quiz')),screen==='home'?'quiz':screen);
  const url=routeURL(screen,'https://example.com/?instrument=bass-4&lang=fr&screen=learn&mode=triad');
  assert.equal(url.pathname,route.path);assert.equal(url.searchParams.get('instrument'),'bass-4');assert.equal(url.searchParams.get('lang'),'fr');
  assert.equal(url.searchParams.get('screen'),null);assert.equal(url.searchParams.get('mode'),screen==='learn'?'triad':null);
 }
 for(const invalid of ['__proto__','constructor','missing','../quiz'])assert.equal(entryScreen(new URL('https://example.com/?screen='+invalid)),'home');
 assert.equal(matchRoute('/practice/missing'),null);assert.equal(matchRoute('/index.html'),'home');
});

test('Every interactive home link has a real canonical route included in the sitemap and Worker configuration',async()=>{
 const {appRoutes}=await routeModule();
 const html=fs.readFileSync('web/index.html','utf8'),sitemap=fs.readFileSync('web/sitemap.xml','utf8');
 const config=JSON.parse(fs.readFileSync('wrangler.jsonc','utf8'));
 assert.match(html,/<base href="\/">/);
 for(const [screen,route] of Object.entries(appRoutes)){
  if(screen==='home')continue;
  const selector=screen==='tuner'?'data-open-tuner':`data-go="${screen}"`;
  const link=[...html.matchAll(/<a\b[^>]+>/g)].map(m=>m[0]).find(tag=>tag.includes(selector));
  assert.ok(link,screen);assert.ok(link.includes(`href="${route.path}"`));
  assert.ok(sitemap.includes(`<loc>https://fretboard-hero.com${route.path}</loc>`));
  assert.ok(config.assets.run_worker_first.some(pattern=>pattern.endsWith('*')?route.path.startsWith(pattern.slice(0,-1)):route.path===pattern));
 }
});

async function navigation({native=false,start='https://fretboard-hero.com/?instrument=bass-4&lang=fr'}={}){
 const routes=await routeModule(),nodes=new Map(),events={},writes=[];
 const node=()=>({content:'Home description',setAttribute(k,v){this[k]=v}});
 const location=new URL(start);
 const context={...routes,URL,location,history:{pushState(_state,_title,url){writes.push(['push',url.href]);location.href=url.href},replaceState(_state,_title,url){writes.push(['replace',url.href]);location.href=url.href}},
  document:{title:'Bass Fretboard Hero',querySelector(selector){if(selector==='#productStructuredData')return null;if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector)},querySelectorAll:()=>[]},
  Capacitor:{getPlatform:()=>native?'ios':'web'},FRETBOARD_SITE_CONFIG:{instrument:'bass-4'},FRETBOARD_ACTIVE_PRODUCT:{name:'Bass Fretboard Hero'},FretboardI18n:{locale:'fr',text:s=>s},addEventListener:(name,fn)=>events[name]=fn};
 context.window=context;vm.createContext(context);
 const source=fs.readFileSync('web/core/navigation.js','utf8').replace(/^import .*;\n/,'').replace('export function','function');
 vm.runInContext(source,context);
 return {nav:context.FretboardNavigation,location,events,writes,nodes};
}

test('Navigation writes history, restores back/forward state and keeps instrument canonical metadata',async()=>{
 const {nav,location,events,writes,nodes}=await navigation();
 nav.write('routine');assert.equal(location.pathname,'/practice/daily-routine');assert.equal(nav.read(),'routine');
 assert.equal(nodes.get('link[rel="canonical"]').href,'https://fretboard-hero.com/practice/daily-routine?instrument=bass-4');
 nav.write('learn');assert.equal(writes.length,2);
 const screens=[];nav.subscribe(screen=>screens.push(screen));
 location.pathname='/practice/daily-routine';events.popstate();assert.equal(nav.read(),'routine');assert.deepEqual(screens,['routine']);assert.equal(writes.length,2,'popstate never pushes another history entry');
 nav.write('home',{replace:true});assert.equal(writes.at(-1)[0],'replace');
 const click={button:0,currentTarget:{target:''}};
 assert.equal(nav.canHandle(click),true);
 for(const key of ['ctrlKey','metaKey','shiftKey','altKey','defaultPrevented'])assert.equal(nav.canHandle({...click,[key]:true}),false);
 assert.equal(nav.canHandle({...click,button:1}),false);assert.equal(nav.canHandle({...click,currentTarget:{target:'_blank'}}),false);
});

test('Native navigation keeps the packaged asset URL and legacy direct links canonicalize by replacement',async()=>{
 const native=await navigation({native:true});native.nav.write('routine');assert.equal(native.location.pathname,'/');assert.equal(native.writes.length,0);assert.equal(native.nav.read(),'routine');
 const legacy=await navigation({start:'https://fretboard-hero.com/?screen=learn&mode=triad&lang=fr'});
 legacy.nav.write(legacy.nav.read(),{replace:true});assert.equal(legacy.location.pathname,'/practice/learn');assert.equal(legacy.location.searchParams.get('mode'),'triad');assert.equal(legacy.writes[0][0],'replace');
});
