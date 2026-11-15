const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

test('Guide footer preserves its shared download dialog and article language routes',async()=>{
 for(const locale of ['en','fr']){
  const menus=[{id:'learn'},{id:'routine'}],opened=[],calls={},events={};
  const node=()=>({children:[],events:{},append(...children){this.children.push(...children)},setAttribute(){},addEventListener(name,fn){this.events[name]=fn}});
  const privacy={href:'https://fretboard-hero.com/privacy?lang='+locale},footer=node();footer.querySelector=()=>privacy;
  const overlay={},host={querySelector:s=>s==='.home-footer'?footer:overlay},button=node();button.disabled=true;
  const data={locale,instrument:'guitar',stores:{guitar:{android:'https://play.google.com/store/apps/details?id=com.guitar.fretboardhero'}},languages:[{locale:'en',label:'English',href:'/en/guitar/triads/'},{locale:'fr',label:'Français',href:'/fr/guitare/triades/'}]};
  const context={URL,console,location:{search:'',assign:href=>calls.destination=href},document:{
   querySelector:s=>({'#chord-quality':null,'#guideConfig':{textContent:JSON.stringify(data)},'.public-shell':host,'#guideAppMenu':{content:{querySelectorAll:()=>menus}}}[s]),
   querySelectorAll:()=>[],createElement:node
  },window:{FretboardDocumentBranding:{apply:async()=>{}},FretboardI18n:{initialize:async value=>{calls.locale=value},text:v=>v,mount:options=>{calls.picker=options}},
   FretboardAccess:{create:unlocked=>({unlocked}),mount(config,access,options){calls.modal={config,access,options};return {open:trigger=>opened.push(trigger)}}}}};
  vm.createContext(context);for(const file of ['web/core/footer.js','web/guide.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls.locale,locale);assert.equal(calls.modal.options.host,host);assert.equal(calls.modal.options.menus,menus);
  assert.equal(calls.modal.config.instrument,'guitar');assert.equal(calls.modal.access.unlocked,false);
  const download=footer.children[0].children[1];download.events.click();assert.deepEqual(opened,[download]);
  assert.equal(calls.destination,undefined,'opening a dialog must not navigate away');
  assert.equal(calls.picker.updateMetadata,false);assert.deepEqual(Array.from(calls.picker.roots),[footer,overlay]);
  assert.equal(calls.picker.selected,locale);
  calls.picker.navigate(locale==='fr'?'en':'fr');assert.equal(calls.destination,locale==='fr'?'/en/guitar/triads/':'/fr/guitare/triades/');
  assert.equal(new URL(privacy.href).searchParams.get('instrument'),'guitar');
 }
});
