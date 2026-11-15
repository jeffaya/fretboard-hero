const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup({native=false,unlocked=false,blocked=false,locale='fr',platform='web',instrument='guitar'}={}){
 const stored={},rows=[],footer=[],privacy={href:'https://fretboard-hero.com/privacy?lang=fr'},guide={};let destination,opens=0;
 const node=()=>({dataset:{},events:{},children:[],setAttribute(){},addEventListener(name,fn){this.events[name]=fn},append(...items){this.children.push(...items)}});
 const buttons=['guitar','bass-4','ukulele'].map(instrument=>{const b=node();b.dataset.homeInstrument=instrument;return b});
 const c={URL,location:{href:'https://fretboard-hero.com/?lang=fr',assign(url){destination=url}},localStorage:{setItem(key,value){if(blocked)throw Error('Unavailable');stored[key]=value}},document:{querySelector:s=>s==='a[href^="https://fretboard-hero.com/privacy"]'?privacy:s==='.guide-card'?guide:s==='.home-instruments'?{prepend(){}}:s==='.home-footer'?{append:(...items)=>footer.push(...items)}:{append:row=>rows.push(row)},querySelectorAll:()=>buttons,createElement:node},window:{FretboardI18n:{locale,text:v=>v},Capacitor:{getPlatform:()=>platform},FRETBOARD_SITE_CONFIG:{nativeBilling:native,instrument,defaultInstrument:'guitar'},FRETBOARD_ACCESS:{unlocked},FRETBOARD_PREMIUM:{open(){opens++}}}};
 vm.createContext(c);for(const file of ['web/core/footer.js','web/core/guide-routes.js','web/home.js'])vm.runInContext(fs.readFileSync(file,'utf8'),c);
 return {buttons,stored,rows,footer,guide,get destination(){return destination},get opens(){return opens}};
}
test('Guide navigation uses the resolved language, a supported fallback and external native URLs',()=>{
 for(const instrument of ['guitar','bass-4','ukulele'])for(const locale of ['fr','en','es','de','it','ja','ko','zh-CN','pt-BR','hi','id'])for(const platform of ['web','android','ios']){
  const {guide,opens}=setup({locale,platform,instrument,blocked:true,native:platform!=='web'});
  const family=instrument==='bass-4'?'bass':instrument;
  const name=locale==='fr'?({guitar:'guitare',bass:'basse',ukulele:'ukulele'})[family]:family;
  const route=`/${locale}/${name}/`;
  assert.equal(guide.href,platform==='web'?route:'https://fretboard-hero.com'+route);
  assert.equal(guide.target,platform==='web'?undefined:'_blank');
  assert.equal(guide.rel,platform==='web'?undefined:'noopener noreferrer');
  assert.equal(opens,0);
 }
});
test('Web and native demos open their dialog from the same footer link without adding a menu row',()=>{
 for(const native of [false,true]){
  const s=setup({native});assert.equal(s.rows.length,0);assert.equal(s.footer.length,1);
  const entry=s.footer[0];assert.equal(entry.className,'home-footer-entry');assert.equal(entry.children[0].className,'home-footer-separator');
  const link=entry.children[1];assert.equal(link.className,'home-footer-link');assert.equal(link.textContent,native?'Unlock full access':'Get the app');link.events.click();assert.equal(s.opens,1);
  const paid=setup({native,unlocked:true});assert.equal(paid.rows.length,0);assert.equal(paid.footer.length,0);
 }
});
test('Switching universe persists the choice, retains the language and still works with blocked storage',()=>{
 for(const blocked of [false,true]){const s=setup({native:true,unlocked:true,blocked});s.buttons[1].events.click();const url=new URL(s.destination);assert.equal(url.searchParams.get('instrument'),'bass-4');assert.equal(url.searchParams.get('lang'),'fr');if(!blocked)assert.equal(s.stored['fretboard-instrument'],'bass-4')}
});
test('Website instrument destinations use the corresponding distinct Android application',()=>{
 const config=JSON.parse(fs.readFileSync('web/site.config.json','utf8')),catalog=JSON.parse(fs.readFileSync('app/instruments.json','utf8'));
 for(const instrument of ['guitar','bass-4','ukulele'])assert.equal(new URL(config.stores[instrument].android).searchParams.get('id'),catalog[instrument].appId);
});
