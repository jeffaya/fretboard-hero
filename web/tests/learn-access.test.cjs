const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

// Minimal DOM for the real app controller. Musical engines and access decisions
// run unchanged, including the circle renderer; fretboard drawing and unrelated
// modal/audio lifecycles are stubbed.
class Element {
 constructor(tag='div'){
  this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.events={};this.textContent='';
  this.style={setProperty(){}};const classes=new Set();
  this.classList={add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),contains:n=>classes.has(n),toggle(n,on){if(on??!classes.has(n))classes.add(n);else classes.delete(n)}};
 }
 set innerHTML(value){this.children=[];this.html=value} get innerHTML(){return this.html||''}
 append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node)}} appendChild(node){this.append(node);return node}
 replaceChildren(...nodes){this.children=[];this.append(...nodes)}
 getBoundingClientRect(){return {left:0,top:0,width:600,height:600}}
 setPointerCapture(id){this.capturedPointer=id}
 setAttribute(name,value){this.attrs[name]=String(value)} getAttribute(name){return this.attrs[name]}
 addEventListener(name,fn){(this.events[name]??=[]).push(fn)}
 emit(name,properties={}){const event={target:this,preventDefault(){},...properties};for(const fn of this.events[name]||[])fn(event)}
 matches(selector){
  const tag=/^[a-z]+/.exec(selector)?.[0];if(tag&&this.tag!==tag)return false;
  const id=/#([\w-]+)/.exec(selector)?.[1];if(id&&this.id!==id)return false;
  if([...selector.matchAll(/\.([\w-]+)/g)].some(([,c])=>!this.classList.contains(c)))return false;
  for(const [,name,value] of selector.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)){
   const actual=name.startsWith('data-')?this.dataset[name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]:this.attrs[name];
   if(actual===undefined||(value!==undefined&&actual!==value))return false;
  }
  return true;
 }
 querySelectorAll(selector){
  const parts=selector.trim().split(/\s+/),last=parts.pop(),result=[];
  const visit=node=>{for(const child of node.children){
   if(child.matches(last)){let parent=child.parentElement,index=parts.length-1;while(parent&&index>=0){if(parent.matches(parts[index]))index--;parent=parent.parentElement}if(index<0)result.push(child)}
   visit(child);
  }};visit(this);return result;
 }
 querySelector(selector){return this.querySelectorAll(selector)[0]||null}
 closest(selector){return this.matches(selector)?this:this.parentElement?.closest(selector)||null}
 click(){for(let node=this;node;node=node.parentElement)node.emit('click',{target:this})}
}

function setup(instrument,unlocked=false){
 const body=new Element('body'),add=(id,parent=body,tag='div')=>{const node=new Element(tag);node.id=id;parent.append(node);return node};
 for(const id of ['home','learn','circle','rootControls','modeControls','qualityControls','fretCountControls','learnPositionButtons','learnPositionLabel','learnTitle','learnFormula','learnHint','legendFourth','legendSeventh','circlePrevious','circleNext','circleWheel','circleKeyTitle','circleRelative','circleSignature','circleProgressions','resultModal','replayQuiz','shareScore'])add(id);
 const screen=body.querySelector('#learn');screen.classList.add('screen');body.querySelector('#home').classList.add('screen');
 const open=add('openLearn',body,'button');open.dataset.go='learn';
 const openCircle=add('openCircle',body,'button');openCircle.dataset.go='circle';body.querySelector('#circle').classList.add('screen');
 const navigation=add('circleNavigation');navigation.classList.add('circle-navigation');navigation.append(new Element('p'));
 add('learnFretboard',add('stage',screen),'svg');
 for(const quality of ['minor','major']){const b=add(quality,body.querySelector('#qualityControls'),'button');b.dataset.quality=quality}
 const c=vm.createContext({document:{body,querySelector:s=>body.querySelector(s),querySelectorAll:s=>body.querySelectorAll(s),createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t),addEventListener(){}},
  navigator:{maxTouchPoints:1},innerWidth:390,matchMedia:()=>({matches:true,addEventListener(){}}),addEventListener(){},requestAnimationFrame:fn=>{fn(0);return 1},cancelAnimationFrame(){},performance:{now:()=>0},ResizeObserver:class{observe(){}},
  RoutineSession:{create:()=>({enter(){},leave(){},resize(){}})},FretboardModal:{bindDismiss(){}},FRETBOARD_SITE_CONFIG:{},opens:0});c.window=c;
 const load=file=>vm.runInContext(fs.readFileSync(`web/${file}.js`,'utf8'),c,{filename:file});
 for(const file of ['core/music-theory','core/access','core/circle-of-fifths','core/circle-renderer','core/mode-registry','modes/pentatonic','modes/triads','modes/chords','modes/arpeggios','instruments/'+instrument,'core/fretboard-engine','core/fretboard-layout','core/pentatonic-renderer','core/triad-engine','core/chord-engine','core/arpeggio-engine','core/quiz-engine','core/controls','core/fretboard-map'])load(file);
 const profile=Object.values(c.FRETBOARD_INSTRUMENTS)[0],key=Object.keys(c.FRETBOARD_INSTRUMENTS)[0];
 c.FRETBOARD_ACTIVE_PRODUCT={instrument:key};c.FRETBOARD_ACCESS=c.FretboardAccess.create(unlocked);
 c.FretboardAccess={...c.FretboardAccess,mount:()=>({open(){c.opens++},mark(button,feature,value){if(button)button.dataset.premiumLocked=String(!c.FRETBOARD_ACCESS.allows(feature,value))}})};
 c.FretboardAppearance={DEGREE_COLORS:{},create:()=>({surface(){},fret(){},string(){},tuning(){},inlay(){},note(svg,note){const n=new Element('g');n.classList.add('note');n.textContent=note.label;svg.append(n)}})};
 Object.assign(c.PentatonicRenderer,{renderSegments(){},renderGuides(){},resizeGuides(){}});
 load('app');
 return {c,profile,get:s=>body.querySelector(s),all:s=>body.querySelectorAll(s),choose(host,key,value){const button=body.querySelectorAll(host+' button').find(b=>b.dataset[key]===value);assert.ok(button,`${host}: ${value}`);button.click()}};
}

for(const instrument of ['guitar','bass-4','ukulele']){
 test(`Free Learn ${instrument}: every mode, quality and context is usable without a purchase`,()=>{
  const r=setup(instrument);r.get('#openLearn').click();
  assert.equal(r.get('#learnTitle').textContent,'A MINOR');
  assert.equal(r.all('#learnPositionButtons button').find(b=>b.classList.contains('active')).dataset.value,'all');
  for(const quality of ['major','minor']){
   r.choose('#qualityControls','quality',quality);assert.equal(r.get('#learnTitle').textContent,`A ${quality.toUpperCase()}`);
   for(const [mode,config] of Object.entries(r.profile.modes)){
    r.choose('#modeControls','mode',mode);assert.equal(r.get('#learnFormula').textContent,config.label);
    for(const value of config.context.values){
     r.choose('#learnPositionButtons','value',value);
     const selected=r.all('#learnPositionButtons button').find(b=>b.classList.contains('active'));
     assert.equal(selected.dataset.value,value);assert.notEqual(selected.dataset.premiumLocked,'true');
     assert.ok(r.all('#learnFretboard .note').length>0,`${mode}/${quality}/${value}: rendered notes`);
     assert.doesNotMatch(r.get('#learnHint').textContent,/unlock/i);
    }
   }
  }
  for(const button of r.all('#modeControls button').concat(r.all('#qualityControls button')))assert.equal(button.dataset.premiumLocked,'false');
  r.choose('#modeControls','mode','penta');
  assert.equal(r.all('#learnPositionButtons button').find(b=>b.classList.contains('active')).dataset.value,'all');
  assert.equal(r.c.opens,0);
  r.choose('#rootControls','root','C');assert.equal(r.c.opens,1);assert.equal(r.get('#learnTitle').textContent,'A MINOR');
 });
 test(`Paid Learn ${instrument} still allows other roots`,()=>{
  const r=setup(instrument,true);r.choose('#rootControls','root','C');r.choose('#qualityControls','quality','major');
  assert.equal(r.get('#learnTitle').textContent,'C MAJOR');assert.equal(r.c.opens,0);
 });
 for(const unlocked of [false,true])test(`${unlocked?'Paid':'Free'} circle ${instrument}: all keys, arrows, keyboard and touch work without a purchase prompt`,()=>{
  const r=setup(instrument,unlocked);r.get('#openCircle').click();
  const wheel=r.get('#circleWheel');
  const assertKey=index=>{
   const key=r.c.CircleOfFifths.getKey(index);
   assert.equal(r.get('#circleKeyTitle').textContent,`${key.name} MAJOR`);
   assert.equal(r.get('#circleRelative').textContent,`Relative minor • ${key.minor}`);
   assert.equal(r.get('#circleSignature').textContent,key.accidentals);
   assert.ok(wheel.children.some(n=>n.textContent===key.name),'selected key is rendered on the wheel');
   for(const degree of new Set(key.progressions.flat())){
    const chord=key.chords.find(c=>c.degree===degree);
    assert.ok(r.get('#circleProgressions').innerHTML.includes(`<small>${degree}</small><strong>${chord.name}</strong>`));
   }
   assert.equal(r.c.opens,0);
  };
  assertKey(0);
  for(let i=1;i<=12;i++){r.get('#circleNext').click();assertKey(i%12)}
  r.get('#circlePrevious').click();assertKey(11);
  wheel.emit('keydown',{key:'ArrowRight'});assertKey(0);
  wheel.emit('keydown',{key:'ArrowLeft'});assertKey(11);
  r.get('#circleNext').click();assertKey(0);
  wheel.emit('pointerdown',{button:0,pointerId:1,clientX:300,clientY:100});
  assert.equal(wheel.capturedPointer,1);
  wheel.emit('pointermove',{pointerId:1,clientX:200,clientY:300-100*Math.sqrt(3)});
  wheel.emit('pointerup',{pointerId:1});assertKey(1);
  wheel.click();assert.equal(r.c.opens,0);
  for(const id of ['circlePrevious','circleNext'])assert.equal(r.get('#'+id).dataset.premiumLocked,'false');
  assert.doesNotMatch(wheel.getAttribute('aria-label')||'',/preview|unlock/i);
  assert.doesNotMatch(r.get('.circle-navigation p').textContent,/preview|unlock/i);
  r.get('#openLearn').click();r.get('#openCircle').click();assertKey(1);
 });
}
