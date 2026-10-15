const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup({native=false,unlocked=false,blocked=false}={}){
 const stored={},rows=[];let destination,opens=0;
 const node=()=>({dataset:{},events:{},children:[],setAttribute(){},addEventListener(name,fn){this.events[name]=fn},append(...items){this.children.push(...items)}});
 const buttons=['guitar','bass-4','ukulele'].map(instrument=>{const b=node();b.dataset.homeInstrument=instrument;return b});
 const c={URL,location:{href:'https://fretboard-hero.com/?lang=fr',assign(url){destination=url}},localStorage:{setItem(key,value){if(blocked)throw Error('Unavailable');stored[key]=value}},document:{querySelector:s=>s==='.home-instruments'?{prepend(){}}:{append:row=>rows.push(row)},querySelectorAll:()=>buttons,createElement:node},window:{FRETBOARD_SITE_CONFIG:{nativeBilling:native,instrument:'guitar',defaultInstrument:'guitar'},FRETBOARD_ACCESS:{unlocked},FRETBOARD_PREMIUM:{open(){opens++}}}};
 vm.runInNewContext(fs.readFileSync('web/home.js','utf8'),c);
 return {buttons,stored,rows,get destination(){return destination},get opens(){return opens}};
}
test('Web demo exposes download action; native and unlocked preview do not duplicate it',()=>{
 const web=setup();assert.equal(web.rows.length,1);assert.equal(web.rows[0].children[0].textContent,'Get the app');web.rows[0].children[0].events.click();assert.equal(web.opens,1);
 assert.equal(setup({native:true}).rows.length,0);assert.equal(setup({unlocked:true}).rows.length,0);
});
test('Switching universe persists the choice, retains the language and still works with blocked storage',()=>{
 for(const blocked of [false,true]){const s=setup({native:true,unlocked:true,blocked});s.buttons[1].events.click();const url=new URL(s.destination);assert.equal(url.searchParams.get('instrument'),'bass-4');assert.equal(url.searchParams.get('lang'),'fr');if(!blocked)assert.equal(s.stored['fretboard-instrument'],'bass-4')}
});
test('Website instrument destinations use the corresponding distinct Android application',()=>{
 const config=JSON.parse(fs.readFileSync('web/site.config.json','utf8')),catalog=JSON.parse(fs.readFileSync('app/instruments.json','utf8'));
 for(const instrument of ['guitar','bass-4','ukulele'])assert.equal(new URL(config.stores[instrument].android).searchParams.get('id'),catalog[instrument].appId);
});
