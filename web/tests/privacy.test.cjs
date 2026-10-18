const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('web/privacy.html','utf8'),source=fs.readFileSync('web/privacy.js','utf8');
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|#x27);/g,key=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#x27;':"'"})[key]);
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
const policies=[...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g)].map(m=>({attrs:attrs(m[1]),body:m[2]}));
const menuLinks=[...html.matchAll(/<a\b([^>]*data-policy-language[^>]*)>([^<]*)<\/a>/g)].map(m=>({attrs:attrs(m[1]),name:decode(m[2])}));
function setup({url='https://fretboard-hero.com/privacy',saved=null,languages=['en'],storageBlocked=false,instrument=null,session=null,defaultInstrument='guitar',configUnavailable=false}={}){
 let focused;const stored={'fretboard-language':saved,'fretboard-instrument':instrument},events={},windowEvents={};
 const el=(text='')=>({textContent:text,attrs:{},events:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,fn){this.events[k]=fn},focus(){focused=this},scrollIntoView(){this.scrolled=true}});
 const articles=policies.map(p=>({...el(),lang:p.attrs.lang,hidden:false,dataset:{languageLabel:p.attrs['data-language-label'],backLabel:p.attrs['data-back-label'],skipLabel:p.attrs['data-skip-label']},querySelector:selector=>({textContent:decode(p.body.match(selector==='h1'?/<h1[^>]*>([^<]*)/:/<p class="policy-intro">([^<]*)/)[1])})}));
 const links=menuLinks.map(l=>({...el(l.name),dataset:{policyLanguage:l.attrs['data-policy-language']}}));
 const trigger=el(),nav=el(),label=el(),main=el(),skip=el(),back=el(),description=el(),home=[el(),el()],logo=el(),icon=el();
 const menu={...el(),open:false,contains:node=>[menu,trigger,nav,label,...links].includes(node),querySelector:selector=>selector==='summary'?trigger:nav};
 const single={'.language-menu':menu,'#language-label':label,main,'.skip-link':skip,'#back-label':back,'meta[name="description"]':description,'.brand':home[0],'.brand svg':logo,'link[rel="icon"]':icon};
 const document={documentElement:{dataset:{}},querySelector:selector=>single[selector],querySelectorAll:selector=>selector==='article[lang]'?articles:selector==='[data-policy-language]'?links:home,addEventListener:(name,fn)=>events[name]=fn,createElement:el,head:{appendChild(script){queueMicrotask(()=>{try{vm.runInContext(fs.readFileSync('web/'+script.src.slice(2).split('?')[0],'utf8'),ctx);script.onload()}catch{script.onerror()}})}}};
 const location={href:url,get search(){return new URL(this.href).search}},history={pushState(_,__,url){location.href=String(url)}};
 const localStorage={getItem(key){if(storageBlocked)throw Error('blocked');return stored[key]},setItem(key,value){if(storageBlocked)throw Error('blocked');stored[key]=value},removeItem(key){delete stored[key]}};
 const ctx=vm.createContext({document,window:{addEventListener:(name,fn)=>windowEvents[name]=fn},URL,URLSearchParams,location,history,navigator:{languages},localStorage,sessionStorage:{getItem(){return session},removeItem(){session=null}},fetch:async()=>{if(configUnavailable)throw Error('offline');return {ok:true,json:async()=>({instrument:defaultInstrument})}}});
 vm.runInContext(fs.readFileSync('web/core/instrument-selection.js','utf8'),ctx);vm.runInContext(source,ctx);
 return {articles,links,menu,trigger,nav,label,main,skip,back,description,home,logo,icon,document,location,events,windowEvents,ready:()=>new Promise(setImmediate),get product(){const key=ctx.window.FretboardInstrumentSelection.catalog[document.documentElement.dataset.instrument].productKey;return ctx.window.FRETBOARD_PRODUCTS[key]},get stored(){return stored['fretboard-language']},get focused(){return focused},click(locale,extra={}){const event={button:0,preventDefault(){this.prevented=true},...extra};links.find(l=>l.dataset.policyLanguage===locale).events.click(event);return event}};
}
test('Every app language has a complete static policy, contact, retention and deletion sections',()=>{
 const ctx={window:{}};vm.runInNewContext(fs.readFileSync('web/core/i18n.js','utf8'),ctx);
 assert.deepEqual(policies.map(p=>p.attrs.lang).sort(),Array.from(ctx.window.FretboardI18n.languages,x=>x[0]).sort());
 assert.deepEqual(menuLinks.map(l=>l.attrs['data-policy-language']).sort(),policies.map(p=>p.attrs.lang).sort());
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const p of policies){
  assert.equal(p.attrs.hidden,undefined);assert.equal((p.body.match(/<section /g)||[]).length,9,p.attrs.lang);
  for(const id of ['contact','mic','local','payments','network','sharing','security','rights','children'])assert.ok(p.body.includes('id="'+p.attrs.lang+'-'+id+'"'));
  const payment=p.body.match(/<section[^>]*payments[^>]*>([\s\S]*?)<\/section>/)[1];
  assert.equal((payment.match(/<p>/g)||[]).length,6);for(const name of ['Lifetime Access','Google Play','Cloudflare','HTTPS','Android Keystore','StoreKit'])assert.ok(payment.includes(name),p.attrs.lang+': '+name);
  assert.ok(p.body.includes('mailto:hello@fretboard-hero.com'));assert.ok(p.body.includes('datetime="2026-10-18"'));
  assert.ok(p.body.includes('https://www.cnil.fr/fr/adresser-une-plainte'));
  assert.equal((p.body.match(/<li>/g)||[]).length,11);
 }
 for(const link of menuLinks)assert.equal(link.attrs.href,'#'+link.attrs['data-policy-language']);
});
test('All policy paragraphs are translated instead of falling back to English',()=>{
 const paragraphs=p=>[...p.body.matchAll(/<p>([^<]*)<\/p>/g)].map(m=>decode(m[1]));
 const english=paragraphs(policies.find(p=>p.attrs.lang==='en'));
 for(const p of policies.filter(p=>p.attrs.lang!=='en')){const text=paragraphs(p);assert.equal(text.length,english.length);text.forEach((line,i)=>assert.notEqual(line,english[i],p.attrs.lang+': '+i))}
});
test('Initial selection respects explicit URLs, old anchors, saved choice and browser language',()=>{
 const cases=[
  [{url:'https://fretboard-hero.com/privacy?lang=ja',saved:'de'},'ja'],
  [{url:'https://fretboard-hero.com/privacy?lang=de#fr-payments'},'fr'],
  [{url:'https://fretboard-hero.com/privacy#en'},'en'],
  [{saved:'it',languages:['fr']},'it'],[{saved:'auto',languages:['xx','ko-KR']},'ko'],
  [{languages:['pt-PT']},'pt-BR'],[{languages:['zh-Hant']},'zh-CN'],
  [{storageBlocked:true,languages:['fr-CA']},'fr'],[{languages:['xx']},'en']
 ];
 for(const [options,expected] of cases){const s=setup(options);assert.equal(s.document.documentElement.lang,expected);assert.deepEqual(s.articles.filter(a=>!a.hidden).map(a=>a.lang),[expected])}
});
test('Switching among all languages updates content, accessibility, metadata, URL and return links',()=>{
 const s=setup();
 for(const p of policies){const lang=p.attrs.lang;s.menu.open=true;assert.equal(s.click(lang).prevented,true);
  assert.equal(s.stored,lang);assert.equal(new URL(s.location.href).searchParams.get('lang'),lang);assert.equal(s.menu.open,false);
  assert.deepEqual(s.articles.filter(a=>!a.hidden).map(a=>a.lang),[lang]);assert.equal(s.focused,s.main);assert.equal(s.main.scrolled,true);
  assert.equal(s.trigger.attrs['aria-label'],p.attrs['data-language-label']);assert.equal(s.nav.attrs['aria-label'],p.attrs['data-language-label']);
  assert.equal(s.skip.textContent,p.attrs['data-skip-label']);assert.equal(s.back.textContent,p.attrs['data-back-label']);
  assert.equal(s.label.textContent,menuLinks.find(l=>l.attrs.lang===lang).name);
  assert.equal(s.links.filter(l=>l.attrs['aria-current']==='true').length,1);
  assert.ok(s.document.title.startsWith(s.articles.find(a=>a.lang===lang).querySelector('h1').textContent));
  assert.equal(s.description.content,s.articles.find(a=>a.lang===lang).querySelector('.policy-intro').textContent);
  s.home.forEach(link=>assert.equal(link.href,'./?lang='+lang+'&instrument=guitar'));
 }
});
test('Privacy reuses each home product wordmark and keeps instrument and language across navigation',async()=>{
 for(const instrument of ['guitar','bass-4','ukulele']){
  // Simulate the external browser with conflicting storage, including denied storage.
  for(const storageBlocked of [false,true]){
   const s=setup({url:'https://fretboard-hero.com/privacy?lang=fr&instrument='+instrument,instrument:instrument==='guitar'?'bass-4':'guitar',storageBlocked});await s.ready();
   assert.equal(s.document.documentElement.dataset.instrument,instrument);
   assert.equal(s.logo.attrs.viewBox,s.product.assets.heroLogoViewport);
   assert.equal(s.home[0].attrs['aria-label'],s.product.branding.name);
   assert.ok(s.icon.href.includes('/'+s.product.id.replace('-fretboard-hero','')+'/favicon.ico'));
   for(const lang of policies.map(p=>p.attrs.lang)){
    s.click(lang);assert.equal(new URL(s.location.href).searchParams.get('instrument'),instrument);
    assert.ok(s.document.title.endsWith(s.product.branding.name));
    for(const link of s.home){const url=new URL(link.href,s.location.href);assert.equal(url.searchParams.get('instrument'),instrument);assert.equal(url.searchParams.get('lang'),lang)}
   }
  }
 }
});
test('Direct Privacy visits share home preference, legacy session and build-default precedence',async()=>{
 const cases=[
  [{instrument:'bass-4',defaultInstrument:'ukulele'},'bass-4'],
  [{session:'ukulele'},'ukulele'],
  [{defaultInstrument:'bass-4'},'bass-4'],
  [{instrument:'invalid',defaultInstrument:'ukulele'},'ukulele'],
  [{url:'https://fretboard-hero.com/privacy?instrument=constructor',instrument:'bass-4'},'bass-4'],
  [{storageBlocked:true,defaultInstrument:'ukulele'},'ukulele'],
  [{url:'https://fretboard-hero.com/privacy?instrument=bass-4',configUnavailable:true},'bass-4'],
  [{configUnavailable:true},'guitar']
 ];
 for(const [options,expected] of cases){const s=setup(options);await s.ready();assert.equal(s.document.documentElement.dataset.instrument,expected);assert.equal(s.logo.attrs.viewBox,s.product.assets.heroLogoViewport)}
});
test('History navigation restores the matching product branding as well as the language',async()=>{
 const s=setup({url:'https://fretboard-hero.com/privacy?instrument=bass-4&lang=fr'});await s.ready();
 s.location.href='https://fretboard-hero.com/privacy?instrument=ukulele&lang=ja';s.windowEvents.popstate();await s.ready();
 assert.equal(s.document.documentElement.lang,'ja');assert.equal(s.document.documentElement.dataset.instrument,'ukulele');assert.equal(s.logo.attrs.viewBox,s.product.assets.heroLogoViewport);
 assert.ok(s.home.every(link=>link.href==='./?lang=ja&instrument=ukulele'));
});
test('Selection works with blocked storage and browser navigation restores the visible policy',()=>{
 const s=setup({storageBlocked:true});s.click('hi');assert.equal(s.document.documentElement.lang,'hi');
 s.location.href='https://fretboard-hero.com/privacy?lang=de';s.windowEvents.popstate();assert.equal(s.document.documentElement.lang,'de');
 s.location.href='https://fretboard-hero.com/privacy#fr-rights';s.windowEvents.hashchange();assert.equal(s.document.documentElement.lang,'fr');
 assert.equal(s.click('en',{ctrlKey:true}).prevented,undefined);assert.equal(s.document.documentElement.lang,'fr');
});
test('The language disclosure closes on Escape, outside click and keyboard focus leaving',()=>{
 const s=setup();s.menu.open=true;s.menu.events.keydown({key:'Escape',preventDefault(){}});assert.equal(s.menu.open,false);assert.equal(s.focused,s.trigger);
 s.menu.open=true;s.events.click({target:s.label});assert.equal(s.menu.open,true);s.events.click({target:s.main});assert.equal(s.menu.open,false);
 s.menu.open=true;s.menu.events.focusout({relatedTarget:s.links[0]});assert.equal(s.menu.open,true);s.menu.events.focusout({relatedTarget:s.main});assert.equal(s.menu.open,false);
});
