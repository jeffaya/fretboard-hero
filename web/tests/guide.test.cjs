const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

test('Guide footer preserves its shared download dialog and article language routes',async()=>{
 for(const locale of ['en','fr']){
  const menus=[{id:'learn'},{id:'routine'}],opened=[],calls={},events={};
  const node=()=>({children:[],events:{},append(...children){this.children.push(...children)},setAttribute(){},addEventListener(name,fn){this.events[name]=fn}});
  const privacy={href:'https://fretboard-hero.com/privacy?lang=fr'},footer=node();footer.querySelector=()=>privacy;
  const overlay={},host={querySelector:s=>s==='.home-footer'?footer:overlay},button=node();button.disabled=true;
  const data={ui:{privacy:'Privacy policy',contact:'Contact us'},locale,instrument:'guitar',stores:{guitar:{android:'https://play.google.com/store/apps/details?id=com.guitar.fretboardhero'}},languages:[{locale:'en',label:'English',href:'/en/guitar/triads/'},{locale:'fr',label:'Français',href:'/fr/guitare/triades/'}]};
  const context={URL,console,location:{search:'',assign:href=>calls.destination=href},document:{
   querySelector:s=>({'#chord-positions':null,'#guideConfig':{textContent:JSON.stringify(data)},'.public-shell':host,'#documentAppMenu':{content:{querySelectorAll:()=>menus}}}[s]),
   querySelectorAll:()=>[],createElement:node
  },window:{FretboardDocumentBranding:{apply:async()=>{}},FretboardI18n:{initialize:async value=>{calls.locale=value},text:v=>v,mount:options=>{calls.picker=options}},
   FretboardAccess:{create:unlocked=>({unlocked}),mount(config,access,options){calls.modal={config,access,options};return {open:trigger=>opened.push(trigger)}}}}};
  vm.createContext(context);for(const file of ['web/core/footer.js','web/core/document-shell.js','web/guide.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls.locale,locale);assert.equal(calls.modal.options.host,host);assert.equal(calls.modal.options.menus,menus);
  assert.equal(calls.modal.config.instrument,'guitar');assert.equal(calls.modal.access.unlocked,false);
  const download=footer.children[0].children[1];download.events.click();assert.deepEqual(opened,[download]);
  assert.equal(calls.destination,undefined,'opening a dialog must not navigate away');
  assert.equal(calls.picker.updateMetadata,false);assert.deepEqual(Array.from(calls.picker.roots),[footer,overlay]);
  assert.equal(calls.picker.selected,locale);
  calls.picker.navigate(locale==='fr'?'en':'fr');assert.equal(calls.destination,locale==='fr'?'/en/guitar/triads/':'/fr/guitare/triades/');
  assert.equal(new URL(privacy.href).searchParams.get('instrument'),'guitar');
  assert.equal(new URL(privacy.href).searchParams.get('lang'),locale);
 }
});

test('Chord families follow validated roots, legacy URLs and browser history on every instrument',async()=>{
 const library=require('../core/chord-library.js'),diagrams=require('../core/lesson-diagrams.js');
 const {lessonCopy}=await import('../../scripts/lessons/translations.mjs');
 const ui=lessonCopy('en').ui;
 for(const instrument of ['guitar','bass-4','ukulele']){
  let current=new URL('https://fretboard-hero.com/en/guitar/chords/?root=9&quality=major&lang=en#chord-major');
  const events={},positions={},summary={},links=[{href:'https://fretboard-hero.com/fr/guitare/accords/?quality=m7'}];
  const buttons=Array.from({length:12},(_,root)=>({dataset:{chordRoot:String(root)},setAttribute(key,value){this[key]=value},addEventListener(event,fn){this[event]=fn}}));
  const data={instrument,ui};
  const location={get href(){return current.href},get search(){return current.search}};
  const context={URL,URLSearchParams,console,location,history:{replaceState(_,__,url){current=new URL(url)}},document:{
   querySelector:s=>({'#guideConfig':{textContent:JSON.stringify(data)},'#chord-positions':positions,'#chord-summary':summary}[s]),
   querySelectorAll:s=>s==='[data-chord-root]'?buttons:links
  },window:{FretboardDocumentBranding:{apply:async()=>{}},FretboardDocumentShell:{mount:async()=>{}},FretboardChords:library,FretboardLessonDiagrams:diagrams,addEventListener(event,fn){events[event]=fn}}};
  vm.runInNewContext(fs.readFileSync('web/guide.js','utf8'),context);
  function check(root){
   assert.equal(summary.textContent,'Root note: '+library.roots[root]);
   assert.equal(positions.innerHTML,diagrams.chordFamilies({instrument,root,ui}));
   assert.equal((positions.innerHTML.match(/data-chord-family=/g)||[]).length,12);
   assert.equal(buttons[root]['aria-pressed'],'true');
   assert.equal(buttons.filter(b=>b['aria-pressed']==='true').length,1);
   assert.equal(new URL(links[0].href).searchParams.get('root'),String(root));
   assert.equal(new URL(links[0].href).searchParams.has('quality'),false);
  }
  check(9);assert.equal(current.search,'?root=9&lang=en');assert.equal(current.hash,'#chord-major');
  for(let root=0;root<12;root++){buttons[root].click();check(root);assert.equal(current.searchParams.get('root'),String(root));}
  for(const [query,root] of [['?root=3',3],['?root=12',7],['?root=-1',7],['?root=3.5',7],['?root=bad',7],['',7]]){
   current=new URL('/en/guitar/chords/'+query,current);events.popstate();check(root);
  }
 }
});
