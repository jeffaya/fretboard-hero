const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('web/privacy.html','utf8'),source=fs.readFileSync('web/privacy.js','utf8');
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|#x27);/g,key=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#x27;':"'"})[key]);
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
const policies=[...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g)].map(m=>({attrs:attrs(m[1]),body:m[2]}));
const menuLinks=[...html.matchAll(/<a\b([^>]*data-policy-language[^>]*)>([^<]*)<\/a>/g)].map(m=>({attrs:attrs(m[1]),name:decode(m[2])}));
function setup({url='https://fretboard-hero.com/privacy',saved=null,languages=['en'],storageBlocked=false,instrument=null,session=null,defaultInstrument='guitar',configUnavailable=false}={}){
 const stored={'fretboard-language':saved,'fretboard-instrument':instrument},events={},calls={};
 const el=()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v}});
 const articles=policies.map(p=>({lang:p.attrs.lang,hidden:false,dataset:{skipLabel:p.attrs['data-skip-label']},querySelector:s=>({textContent:decode(p.body.match(s==='h1'?/<h1[^>]*>([^<]*)/:/<p class="policy-intro">([^<]*)/)[1])})}));
 const home=[el()],logo=el(),icon=el(),description={},skip={};
 const data=JSON.parse(html.match(/id="policyConfig">([\s\S]*?)<\/script>/)[1]);
 const single={'#policyConfig':{textContent:JSON.stringify(data)},'meta[name="description"]':description,'.skip-link':skip,'.brand':home[0],'.brand svg':logo,'link[rel="icon"]':icon};
 const document={documentElement:{dataset:{}},querySelector:s=>single[s],querySelectorAll:s=>s==='article[lang]'?articles:home,createElement:el,head:{appendChild(script){queueMicrotask(()=>{try{vm.runInContext(fs.readFileSync('web/'+script.src.slice(2).split('?')[0],'utf8'),ctx);script.onload()}catch{script.onerror()}})}}};
 const location={href:url,get search(){return new URL(this.href).search},assign(value){this.href=value},reload(){calls.reloaded=true}};
 const ctx=vm.createContext({console,document,window:{addEventListener:(name,fn)=>events[name]=fn,FretboardDocumentShell:{async mount(data,options){calls.shell=data;calls.navigate=options.navigate}}},URL,URLSearchParams,location,navigator:{languages},localStorage:{getItem(key){if(storageBlocked)throw Error('blocked');return stored[key]}},sessionStorage:{getItem(){return session},removeItem(){session=null}},fetch:async()=>{if(configUnavailable)throw Error('offline');return {ok:true,json:async()=>({instrument:defaultInstrument})}}});
 for(const file of ['web/core/instrument-selection.js','web/core/document-branding.js','web/privacy.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 return {articles,document,home,logo,icon,description,skip,location,events,calls,ready:()=>new Promise(setImmediate),get product(){const key=ctx.window.FretboardInstrumentSelection.catalog[document.documentElement.dataset.instrument].productKey;return ctx.window.FRETBOARD_PRODUCTS[key]}};
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
test('Selection respects URL, legacy anchor, storage and browser preferences',async()=>{
 const cases=[[{url:'https://fretboard-hero.com/privacy?lang=ja',saved:'de'},'ja'],[{url:'https://fretboard-hero.com/privacy?lang=de#fr-payments'},'fr'],[{saved:'it'},'it'],[{saved:'auto',languages:['xx','ko-KR']},'ko'],[{languages:['pt-PT']},'pt-BR'],[{languages:['zh-Hant']},'zh-CN'],[{storageBlocked:true,languages:['fr-CA']},'fr'],[{languages:['xx']},'en']];
 for(const [options,expected] of cases){const s=setup(options);await s.ready();assert.equal(s.document.documentElement.lang,expected);assert.deepEqual(s.articles.filter(a=>!a.hidden).map(a=>a.lang),[expected]);assert.equal(s.calls.shell.locale,expected)}
});
test('Every footer language navigates with the instrument and translated labels',async()=>{
 for(const instrument of ['guitar','bass-4','ukulele'])for(const policy of policies){const locale=policy.attrs.lang;
  const s=setup({url:'https://fretboard-hero.com/privacy?lang='+locale+'&instrument='+instrument,saved:'en',storageBlocked:true});await s.ready();
  assert.equal(s.calls.shell.locale,locale);assert.equal(s.calls.shell.instrument,instrument);assert.equal(s.calls.shell.languages.length,11);
  assert.ok(s.calls.shell.ui.privacy);assert.ok(s.calls.shell.ui.contact);if(locale!=='en')assert.notEqual(s.calls.shell.ui.privacy,'Privacy policy');
  assert.equal(s.logo.attrs.viewBox,s.product.assets.heroLogoViewport);assert.equal(s.home[0].attrs['aria-label'],s.product.branding.name);
  assert.ok(s.document.title.endsWith(s.product.branding.name));assert.equal(s.description.content,s.articles.find(a=>a.lang===locale).querySelector('.policy-intro').textContent);
  assert.equal(s.home[0].href,'./?lang='+locale+'&instrument='+instrument);
  s.calls.navigate('hi');const target=new URL(s.location.href);assert.equal(target.searchParams.get('lang'),'hi');assert.equal(target.searchParams.get('instrument'),instrument);assert.equal(target.hash,'');
 }
});
test('Privacy shares the application instrument precedence, including offline configuration',async()=>{
 const cases=[[{instrument:'bass-4',defaultInstrument:'ukulele'},'bass-4'],[{session:'ukulele'},'ukulele'],[{defaultInstrument:'bass-4'},'bass-4'],[{instrument:'invalid',defaultInstrument:'ukulele'},'ukulele'],[{url:'https://fretboard-hero.com/privacy?instrument=constructor',instrument:'bass-4'},'bass-4'],[{storageBlocked:true,defaultInstrument:'ukulele'},'ukulele'],[{url:'https://fretboard-hero.com/privacy?instrument=bass-4',configUnavailable:true},'bass-4'],[{configUnavailable:true},'guitar']];
 for(const [options,expected] of cases){const s=setup(options);await s.ready();assert.equal(s.document.documentElement.dataset.instrument,expected);assert.equal(s.calls.shell.instrument,expected)}
});
test('History and legacy language anchors reload the complete shell when its context changes',async()=>{
 const s=setup({url:'https://fretboard-hero.com/privacy?lang=en&instrument=guitar'});await s.ready();
 s.location.href='https://fretboard-hero.com/privacy?lang=en#fr-rights';s.events.hashchange();assert.equal(s.calls.reloaded,true);
 s.calls.reloaded=false;s.location.href='https://fretboard-hero.com/privacy?lang=en&instrument=ukulele';s.events.popstate();assert.equal(s.calls.reloaded,true);
});
test('Privacy uses the same footer and contains no language control in its header',()=>{
 assert.doesNotMatch(html.match(/<header[\s\S]*?<\/header>/)[0],/language|<details/);
 assert.match(html,/<footer class="home-footer">/);assert.doesNotMatch(html,/class="site-footer"|document-language-menu/);
 assert.match(html,/core\/document-shell\.js/);
});
