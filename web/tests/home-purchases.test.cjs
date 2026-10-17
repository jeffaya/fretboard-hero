const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup({native=false,unlocked=false,blocked=false}={}){
 const stored={},rows=[],footer=[];let destination,opens=0;
 const node=()=>({dataset:{},events:{},children:[],setAttribute(){},addEventListener(name,fn){this.events[name]=fn},append(...items){this.children.push(...items)}});
 const buttons=['guitar','bass-4','ukulele'].map(instrument=>{const b=node();b.dataset.homeInstrument=instrument;return b});
 const c={URL,location:{href:'https://fretboard-hero.com/?lang=fr',assign(url){destination=url}},localStorage:{setItem(key,value){if(blocked)throw Error('Unavailable');stored[key]=value}},document:{querySelector:s=>s==='.home-instruments'?{prepend(){}}:s==='.home-footer'?{append:(...items)=>footer.push(...items)}:{append:row=>rows.push(row)},querySelectorAll:()=>buttons,createElement:node},window:{FRETBOARD_SITE_CONFIG:{nativeBilling:native,instrument:'guitar',defaultInstrument:'guitar'},FRETBOARD_ACCESS:{unlocked},FRETBOARD_PREMIUM:{open(){opens++}}}};
 vm.runInNewContext(fs.readFileSync('web/home.js','utf8'),c);
 return {buttons,stored,rows,footer,get destination(){return destination},get opens(){return opens}};
}
test('Web demo opens the download dialog from the footer without adding a menu row',()=>{
 const web=setup();assert.equal(web.rows.length,0);assert.equal(web.footer.length,2);
 assert.equal(web.footer[0].className,'home-footer-separator');
 const download=web.footer[1];assert.equal(download.className,'home-footer-link');assert.equal(download.textContent,'Get the app');download.events.click();assert.equal(web.opens,1);
 for(const options of [{native:true},{unlocked:true}]){const app=setup(options);assert.equal(app.rows.length,0);assert.equal(app.footer.length,0)}
});
test('Switching universe persists the choice, retains the language and still works with blocked storage',()=>{
 for(const blocked of [false,true]){const s=setup({native:true,unlocked:true,blocked});s.buttons[1].events.click();const url=new URL(s.destination);assert.equal(url.searchParams.get('instrument'),'bass-4');assert.equal(url.searchParams.get('lang'),'fr');if(!blocked)assert.equal(s.stored['fretboard-instrument'],'bass-4')}
});
test('Website instrument destinations use the corresponding distinct Android application',()=>{
 const config=JSON.parse(fs.readFileSync('web/site.config.json','utf8')),catalog=JSON.parse(fs.readFileSync('app/instruments.json','utf8'));
 for(const instrument of ['guitar','bass-4','ukulele'])assert.equal(new URL(config.stores[instrument].android).searchParams.get('id'),catalog[instrument].appId);
});
