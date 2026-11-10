const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.join(__dirname,'..');
function runtime(){const c={window:{}};vm.createContext(c);for(const name of ['core/music-theory','instruments/guitar','instruments/bass-4','instruments/ukulele','core/fretboard-engine','core/triad-engine','core/chord-engine','core/pentatonic-renderer','core/routine-melody','core/routine-patterns','core/routine-exercises','core/routine-guide','core/routine-rhythm','core/routine-echo','core/routine-rhythm-audio','core/routine-strumming','core/routine-encouragement','core/chord-detector','core/pitch-detector']){vm.runInContext(fs.readFileSync(path.join(base,name+'.js'),'utf8'),c);Object.assign(c,c.window)}return c}
function rng(seed){return()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296)}
const flatten=e=>e.columns.flatMap(c=>c.notes);
const playedStrings=e=>[...new Set(flatten(e).map(n=>n.string))].sort().join(',');
test('All keys, qualities and instruments have five playable and musically correct exercises',()=>{
 const c=runtime();let count=0;
 for(const profile of Object.values(c.FRETBOARD_INSTRUMENTS))for(const root of c.MusicTheory.NOTES)for(const quality of ['major','minor'])for(let seed=1;seed<=8;seed++){
  const engine=c.FretboardEngine.createInstrumentEngine(profile),rootPC=c.MusicTheory.PC[root],label=`${profile.id} ${root} ${quality} seed ${seed}`;
  let exercises;assert.doesNotThrow(()=>exercises=c.RoutineExercises.create({engine,root,quality,random:rng(seed)}),label);
  assert.equal(exercises.length,5);
  for(const e of exercises){assert.equal(e.root,root);assert.equal(e.quality,quality);assert.ok(e.strumming||e.columns.length,label);for(const n of flatten(e)){assert.ok(n.string>=0&&n.string<engine.stringCount,label);assert.ok(n.fret>=0&&n.fret<=(e.diagonal||e.rootJourney?engine.maxFret:15),label)}}
  const expected=[];engine.courses.forEach((_,string)=>{for(let fret=0;fret<=15;fret++)if(engine.noteAt(string,fret)===rootPC)expected.push(`${string}:${fret}`)});
  if(!profile.rootPaths)assert.equal(JSON.stringify(flatten(exercises[0]).map(n=>`${n.string}:${n.fret}`)),JSON.stringify(expected));
  else for(const note of flatten(exercises[0]))assert.equal(engine.noteAt(note.string,note.fret),rootPC);
  const scale=flatten(exercises[1]),intervals=quality==='major'?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10],first=engine.midiAt(scale[0].string,scale[0].fret);
  assert.equal(engine.noteAt(scale[0].string,scale[0].fret),rootPC);assert.equal((scale.length-1)%7,0);assert.ok(scale.length>=8);
  scale.slice(0,(scale.length+1)/2).forEach((n,i)=>assert.equal(engine.midiAt(n.string,n.fret)-first,Math.floor(i/7)*12+intervals[i%7],label));
  const tones=[rootPC,c.MusicTheory.mod(rootPC+(quality==='major'?4:3)),c.MusicTheory.mod(rootPC+7)];
  const inversions=new Set(exercises[2].columns.filter(col=>col.notes.length===3).map(c=>c.label)).size;
  if(profile.family==='guitar')assert.equal(inversions,3,label);else assert.ok(inversions>=2,label);
  for(const col of exercises[2].columns){assert.equal(col.notes.length,col.kind==='third'?1:3);assert.equal(new Set(col.notes.map(n=>engine.noteAt(n.string,n.fret))).size,col.notes.length);for(const n of col.notes)assert.ok(tones.includes(engine.noteAt(n.string,n.fret)),label)}
  for(const col of exercises[3].columns){const pcs=tones;for(const n of col.notes)assert.ok(pcs.includes(engine.noteAt(n.string,n.fret)),label)}
  if(profile.family==='bass'){assert.equal(exercises[3].step,'Arpeggios');const arp=flatten(exercises[3]);for(let i=1;i<(arp.length+1)/2;i++)assert.ok(arp[i].midi>arp[i-1].midi)}else if(profile.family!=='guitar'){assert.ok(exercises[3].columns.length>=3,label);for(const col of exercises[3].columns)assert.equal(new Set(col.notes.map(n=>engine.noteAt(n.string,n.fret))).size,3)}
  const penta=c.MusicTheory.pentatonicPCs(rootPC,quality);assert.equal(flatten(exercises[4]).length,profile.family==='guitar'?29:4*engine.stringCount-1);for(const n of flatten(exercises[4]))assert.ok(penta.includes(engine.noteAt(n.string,n.fret)),label);
  for(const e of exercises.filter(e=>['scale','penta'].includes(e.id)||(e.id==='chords'&&profile.family==='bass'))){
   const notes=flatten(e);assert.equal(notes.length%2,1,label);
   for(let i=0;i<Math.floor(notes.length/2);i++)assert.equal(JSON.stringify(notes[i]),JSON.stringify(notes[notes.length-1-i]),label);
   assert.notEqual(JSON.stringify(notes[Math.floor(notes.length/2)]),JSON.stringify(notes[Math.floor(notes.length/2)-1]),label+' turning note occurs once');
  }
  count++;
 }
 assert.equal(count,576);
});
test('Scale and triads stay predictable; the two selected guitar diagonals repeat consistently',()=>{
 const c=runtime(),engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar),random=rng(1234),variants=[new Set(),new Set(),new Set()];
 for(let i=0;i<30;i++){const e=c.RoutineExercises.create({engine,root:'A',quality:'minor',random,diagonal:i%2});[e[1],e[2],e[4]].forEach((x,j)=>variants[j].add(JSON.stringify(x.columns)))}
 assert.equal(variants[0].size,1);assert.equal(variants[1].size,1);assert.equal(variants[2].size,2);
});
test('Every scale is one exact octave from root to root, with spelled notes and degrees',()=>{
 const c=runtime();
 for(const profile of Object.values(c.FRETBOARD_INSTRUMENTS))for(const root of c.MusicTheory.NOTES)for(const quality of ['minor','major']){
  const engine=c.FretboardEngine.createInstrumentEngine(profile),e=c.RoutineExercises.create({engine,root,quality})[1];
  assert.equal(e.columns.length,15);assert.equal(e.sections.map(s=>s.end-s.start).join(','),'8,7');
  assert.equal(e.columns[0].noteName,root);assert.equal(e.columns[7].noteName,root);assert.equal(e.columns[14].noteName,root);
  assert.equal(e.columns.slice(0,8).map(c=>c.degree).join(','),quality==='minor'?'1,2,♭3,4,5,♭6,♭7,1':'1,2,3,4,5,6,7,1');
  const notes=flatten(e);assert.equal(engine.midiAt(notes[7].string,notes[7].fret)-engine.midiAt(notes[0].string,notes[0].fret),12);
  if(profile.family==='guitar')assert.equal(notes[0].string,0);
 }
 const engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar);
 assert.equal(c.RoutineExercises.create({engine,root:'C#',quality:'major'})[1].columns.slice(0,8).map(c=>c.noteName).join(','),'C#,D#,E#,F#,G#,A#,B#,C#');
});
test('Both diagonals repeat the same complete pentatonic motif at three octaves in all keys',()=>{
 const c=runtime(),engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar);
 for(const root of c.MusicTheory.NOTES)for(const quality of ['minor','major'])for(const diagonal of [0,1]){
  const e=c.RoutineExercises.create({engine,root,quality,diagonal})[4],label=`${root} ${quality} diagonal ${diagonal+1}`,up=e.columns.slice(0,15);
  const anchor=c.MusicTheory.mod(c.MusicTheory.PC[root]-(quality==='major'?3:0)-engine.courses[0].pc),boxes=c.PentatonicRenderer.visiblePairs({profile:engine.profile,anchor,maxFret:engine.maxFret});
  assert.equal(e.diagonal,diagonal+1);assert.equal(e.columns.length,29);assert.equal(e.sections.map(s=>s.end-s.start).join(','),'15,14');
  assert.equal(up.filter(c=>c.slideFrom).length,3);
  for(let block=0;block<3;block++){
   const cell=up.slice(block*5,block*5+5);assert.equal(cell.map(c=>c.noteName).join(','),up.slice(0,5).map(c=>c.noteName).join(','),label);
   assert.equal(cell.map(c=>c.degree).join(','),up.slice(0,5).map(c=>c.degree).join(','),label);
   assert.equal(new Set(cell.map(c=>engine.noteAt(c.notes[0].string,c.notes[0].fret))).size,5);
   cell.forEach((col,i)=>{const n=col.notes[0],first=up[i].notes[0];assert.equal(col.block,block+1);assert.equal(n.string,block*2+(i<(diagonal===0?2:3)?0:1));assert.equal(engine.midiAt(n.string,n.fret),engine.midiAt(first.string,first.fret)+12*block);assert.ok(boxes.some(box=>box.id===col.position&&box.pairs[n.string].includes(n.fret)),label);if(col.slideFrom){assert.equal(col.slideFrom.string,n.string);assert.ok([2,3].includes(n.fret-col.slideFrom.fret),label)}});
  }
  for(let i=1;i<up.length;i++){const a=up[i-1].notes[0],b=up[i].notes[0];assert.ok(engine.midiAt(b.string,b.fret)>engine.midiAt(a.string,a.fret))}
  assert.equal(e.columns.slice(15).filter(c=>c.slideFrom).length,3);
 }
 const e=c.RoutineExercises.create({engine,root:'A',quality:'minor',diagonal:0})[4];
 assert.equal(e.columns.slice(0,15).map(c=>c.position).filter((p,i,a)=>i===0||p!==a[i-1]).join(','),'5,1,2,3');
});
test('A minor diagonals match the reference fingerings and return along the same slides',()=>{
 const c=runtime(),engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar);
 const routes=[[[3,5],[3,5,7],[5,7],[5,7,9],[8,10],[8,10,12]],[[8,10,12],[10,12],[10,12,14],[12,14],[13,15,17],[15,17]]];
 routes.forEach((strings,diagonal)=>{
  const expected=strings.flatMap((frets,string)=>frets.map(fret=>({string,fret})));
  const e=c.RoutineExercises.create({engine,root:'A',quality:'minor',diagonal})[4];
  assert.equal(JSON.stringify(flatten(e)),JSON.stringify(expected.concat(expected.slice(0,-1).reverse())));
  for(const column of e.columns){
   assert.equal(Boolean(column.holdMs),engine.noteAt(column.notes[0].string,column.notes[0].fret)===c.MusicTheory.PC.A);
   if(column.slideFrom)assert.equal(column.slideFrom.string,column.notes[0].string);
  }
 });
});
test('Both reference fingerings transpose without rotating their starting degree',()=>{
 const c=runtime(),engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar);
 for(const root of c.MusicTheory.NOTES)for(const quality of ['major','minor'])for(const diagonal of [0,1]){
  const e=c.RoutineExercises.create({engine,root,quality,diagonal})[4];
  const expectedDegrees=quality==='minor'?(diagonal?'♭3,4,5,♭7,1':'♭7,1,♭3,4,5'):(diagonal?'1,2,3,5,6':'5,6,1,2,3');
  assert.equal(e.columns.slice(0,5).map(c=>c.degree).join(','),expectedDegrees);
  assert.ok(flatten(e).every(n=>n.fret>=0&&n.fret<=engine.maxFret));
  assert.equal(flatten(e).length,29);
  e.columns.forEach(column=>assert.equal(Boolean(column.holdMs),column.degree==='1'));
 }
});
test('Shared drawer is exposed inline and inert only when closed in compact mode',()=>{const nodes=new Map(),media={matches:false,addEventListener(_,f){this.change=f}},c={window:{},matchMedia:()=>media};function node(id){if(!nodes.has(id)){const classes=new Set();nodes.set(id,{attrs:{},events:{},classList:{contains:k=>classes.has(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k)},getAttribute(k){return this.attrs[k]},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){this.events[k]=f},focus(){c.focused=id}})}return nodes.get(id)}const root={querySelector:node};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(base,'core/controls.js'),'utf8'),c);c.window.FretboardControls.bindDrawer({root,name:'routine'});const drawer=node('#routineDrawer'),btn=node('#routineMenuBtn');assert.equal(drawer.inert,false);assert.equal(drawer.attrs['aria-hidden'],'false');media.matches=true;media.change();assert.equal(drawer.inert,true);btn.events.click();assert.equal(drawer.inert,false);assert.equal(btn.attrs['aria-expanded'],'true');drawer.events.keydown({key:'Escape',preventDefault(){}});assert.equal(drawer.inert,true);assert.equal(c.focused,'#routineMenuBtn');media.matches=false;media.change();assert.equal(drawer.inert,false)});
class Node{
 constructor(){this.children=[];this.events={};this.attrs={};this.dataset={};this.style={};this.classes=new Set();this.classList={contains:k=>this.classes.has(k),toggle:(k,on)=>on?this.classes.add(k):this.classes.delete(k)};this.textContent='';this.hidden=false;this.parentElement={clientWidth:390}}
 append(...nodes){this.children.push(...nodes)}replaceChildren(){this.children=[]}querySelectorAll(){return this.children}querySelector(){return null}getAttribute(k){return this.attrs[k]}setAttribute(k,v){this.attrs[k]=v}addEventListener(k,f){this.events[k]=f}click(){this.events.click?.()}focus(){}scrollIntoView(){}
}
function sessionRuntime(demo=false,enabled=true,storage=new Map(),playback=false,encouragementRandom=Math.random,random=rng(321)){
 const c=runtime(),nodes=new Map(),root={querySelector:s=>{if(!nodes.has(s))nodes.set(s,new Node());return nodes.get(s)}};
 c.document={createElement:()=>new Node(),createElementNS:()=>new Node(),addEventListener(){}};c.opens=0;
 c.localStorage={getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)};
 const timers=new Map();let timerId=0;
 c.setTimeout=f=>{timers.set(++timerId,f);return timerId};c.clearTimeout=id=>timers.delete(id);c.now=1000;c.performance={now:()=>c.now};const frames=new Map();let frameId=0;c.requestAnimationFrame=f=>{frames.set(++frameId,f);return frameId};c.cancelAnimationFrame=id=>frames.delete(id);c.frame=now=>{c.now=now;for(const [id,f] of [...frames]){frames.delete(id);f(now)}};
 c.micPreference={get enabled(){return enabled},setEnabled(value){enabled=value}};
 c.FretboardMicrophone={preference:()=>c.micPreference,create({onFrame,onState,fftSize,interval}){let state='off';c.fftSize=fftSize;c.interval=interval;c.audio={onFrame,setInterval(value){c.interval=value},setFftSize(value){c.fftSize=value},setEchoCancellation(value){c.echoCancellation=value},start(){state='on';onState(state)},stop(){state='off';onState(state)},get state(){return state}};return c.audio}};
 c.window.matchMedia=()=>({matches:true});
 const flush=()=>{for(const [id,f] of timers){timers.delete(id);f()}};
 vm.runInContext(fs.readFileSync(path.join(base,'core/access.js'),'utf8'),c);
 c.window.FRETBOARD_ACCESS=c.window.FretboardAccess.create(!demo);c.window.FRETBOARD_PREMIUM={mark(){},open(){c.opens++}};
 c.RoutineRenderer={render:(_,exercise)=>{c.lastExercise=exercise}};
 if(playback)c.RoutineRhythmAudio={create:()=>({open:async()=>true,close(){},stop(){},schedule(){c.scheduled=(c.scheduled||0)+1}})};
 const createStrumming=c.RoutineStrumming.create;c.RoutineStrumming={create(options){const strumming=createStrumming(options),update=strumming.update;strumming.update=function(e,...rest){if(e?.strumming)c.lastExercise=e;return update.call(this,e,...rest)};return strumming}};
 vm.runInContext(fs.readFileSync(path.join(base,'core/routine-session.js'),'utf8'),c);
 const engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar),session=c.window.RoutineSession.create({root,engine,refreshControls(){},random,encouragementRandom});
 const nextGroup=()=>{nodes.get('#routineNext').click();flush()};
 return {session,nodes,c,flush,nextGroup,next(){const id=c.lastExercise.id;nextGroup();while(c.lastExercise.id===id&&nodes.get('#routineFinish').hidden)nextGroup()}};
}
test('A random diagonal is chosen per routine and is stable through settings, audio and navigation',()=>{
 let choice=0;const storage=new Map(),r=sessionRuntime(false,false,storage,false,Math.random,()=>choice);
 const penta=()=>{r.nodes.get('#routineSteps').children[4].children[0].click();return r.c.lastExercise.diagonal};
 r.session.enter();assert.equal(penta(),1);choice=.99;
 r.nextGroup();assert.ok(r.nodes.get('#routineContext').textContent.includes('Returning'));
 r.nodes.get('#routineSteps').children[0].children[0].click();assert.equal(penta(),1);
 r.nodes.get('#routineMic').click();r.nodes.get('#routineMic').click();assert.equal(r.c.lastExercise.diagonal,1);
 r.nodes.get('#routineRootControls').children.find(b=>b.dataset.value!=='A').click();r.nodes.get('#routineQualityControls').children[0].click();assert.equal(penta(),1);
 r.session.leave();r.session.enter();assert.equal(penta(),2);
 r.nodes.get('#routineSteps').children[0].children[0].click();for(let i=0;i<5;i++)r.next();
 choice=0;r.nodes.get('#routineReplay').click();assert.equal(penta(),1);
});
test('Blocked storage still permits random routines and scale sections keep progress',()=>{
 const r=sessionRuntime(true,false,{get(){throw Error('Storage blocked')},set(){throw Error('Storage blocked')}});
 r.session.enter();r.nodes.get('#routineSteps').children[1].children[0].click();assert.equal(r.nodes.get('#routineContext').hidden,false);assert.equal(r.c.lastExercise.columns.length,8);
 assert.equal(r.nodes.get('#routineNext').textContent,'Return →');r.nextGroup();assert.equal(r.c.lastExercise.columns.length,7);assert.ok(r.nodes.get('#routineInstruction').textContent.includes('left to right'));
 assert.equal(r.nodes.get('#routineSteps').children[1].classes.has('is-complete'),false);r.nextGroup();assert.equal(r.c.lastExercise.id,'triads');assert.equal(r.nodes.get('#routineSteps').children[1].classes.has('is-complete'),true);
 r.session.leave();r.session.enter();r.nodes.get('#routineSteps').children[4].children[0].click();assert.ok([1,2].includes(r.c.lastExercise.diagonal));
});
test('Demo permits all five stages and Done, but blocks other roots and major without resetting progress',()=>{
 const r=sessionRuntime(true);r.session.enter();
 r.next();assert.equal(r.c.lastExercise.id,'scale');
 r.nodes.get('#routineRootControls').children.find(b=>b.dataset.value==='C').click();r.nodes.get('#routineQualityControls').children[0].click();
 assert.equal(r.c.opens,2);assert.equal(r.c.lastExercise.id,'scale');assert.equal(r.c.lastExercise.root,'A');assert.equal(r.c.lastExercise.quality,'minor');
 for(let i=1;i<5;i++){assert.equal(r.nodes.get('#routineNext').textContent,i===2?'Next strings →':[1,4].includes(i)?'Return →':'Next →');r.next()}
 assert.equal(r.nodes.get('#routineTitle').textContent,'Routine complete!');assert.equal(r.nodes.get('#routineNext').hidden,true);assert.equal(r.nodes.get('#routineFinish').hidden,false);
 assert.equal(r.nodes.get('#routineSteps').children.filter(n=>n.classes.has('is-complete')).length,5);assert.equal(r.nodes.get('#routineListening').hidden,true);
 r.session.enter();assert.equal(r.c.lastExercise.id,'root');assert.equal(r.nodes.get('#routineFinish').hidden,true);
});
test('Unlocked root and quality selection reset all stages and entry chooses a fresh root',()=>{
 const r=sessionRuntime();r.session.enter();const first=r.c.lastExercise.root;
 r.next();r.nodes.get('#routineRootControls').children.find(b=>b.dataset.value==='C').click();r.nodes.get('#routineQualityControls').children[0].click();
 assert.equal(r.c.lastExercise.id,'root');assert.equal(r.c.lastExercise.root,'C');assert.equal(r.c.lastExercise.quality,'major');
 for(let i=0;i<5;i++){assert.equal(r.c.lastExercise.root,'C');assert.equal(r.c.lastExercise.quality,'major');r.next()}
 r.nodes.get('#routineRootControls').children.find(b=>b.dataset.value==='D').click();assert.equal(r.nodes.get('#routineFinish').hidden,true);assert.equal(r.c.lastExercise.root,'D');assert.equal(r.nodes.get('#routineSteps').children[0].children[0].attrs['aria-current'],'step');
 const roots=new Set([first]);for(let i=0;i<10;i++){r.session.enter();roots.add(r.c.lastExercise.root)}assert.ok(roots.size>1);assert.equal(r.c.opens,0);
});
test('Tab wraps without overlapping frets, preserves chord columns and fits a standard phone root exercise',()=>{
 const c=runtime();c.document={createElementNS:()=>new Node()};vm.runInContext(fs.readFileSync(path.join(base,'core/routine-renderer.js'),'utf8'),c);
 for(const width of [280,360,390,768,1100])for(const profile of Object.values(c.FRETBOARD_INSTRUMENTS)){
  const engine=c.FretboardEngine.createInstrumentEngine(profile),exercises=c.RoutineExercises.create({engine,root:'A',quality:'minor',random:rng(9)});
  for(const exercise of exercises.filter(e=>!e.strumming).flatMap(e=>e.sections?e.sections.map(s=>({...e,columns:e.columns.slice(s.start,s.end)})):[e])){
   const svg=new Node();svg.parentElement={clientWidth:width};c.window.RoutineRenderer.render(svg,exercise,engine);
   assert.equal(Number(svg.attrs.viewBox.split(' ')[2]),width);
   const descendants=n=>n.children.flatMap(child=>[child,...descendants(child)]);
   const frets=descendants(svg).filter(n=>n.attrs['font-weight']===800&&n.textContent!=='×');assert.equal(frets.length,flatten(exercise).length);
   for(const n of frets){assert.ok(n.attrs.x-14>=0&&n.attrs.x+14<=width);assert.ok(n.attrs['font-size']>=18)}
   for(const a of frets)for(const b of frets)if(a!==b&&a.attrs.y===b.attrs.y)assert.ok(Math.abs(a.attrs.x-b.attrs.x)>=30);
   const labels=svg.children.filter(n=>n.attrs.class==='routine-string-label'),strings=svg.children.filter(n=>n.attrs.stroke==='#899bb3');
   assert.equal(labels.length,strings.length);
   if(width<600)labels.forEach((label,i)=>{
    assert.equal(label.attrs['text-anchor'],'end');
    assert.ok(strings[i].attrs.x1-label.attrs.x>=4&&strings[i].attrs.x1-label.attrs.x<=10,'Compact label-to-string gap');
    assert.ok(strings[i].attrs.x1<=30,'Recover horizontal room for frets');
   });
   if(exercise.id==='root'&&width>=360)assert.ok(Number(svg.attrs.viewBox.split(' ')[3])<240,'root exercise fits one staff');
   assert.match(svg.children[0].textContent,/fret/);
  }
 }
});
test('Every diagonal section shows three repeated blocks, six strings per staff, box transitions and slides',()=>{
 const c=runtime();c.document={createElementNS:()=>new Node()};vm.runInContext(fs.readFileSync(path.join(base,'core/routine-renderer.js'),'utf8'),c);
 const engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar);
 for(const diagonal of [0,1])for(const width of [280,390,1194]){
  const exercise=c.RoutineExercises.create({engine,root:'A',quality:'minor',diagonal})[4];
  for(const section of exercise.sections){
   const svg=new Node();svg.parentElement={clientWidth:width};const visible={...exercise,columns:exercise.columns.slice(section.start,section.end)};
   c.window.RoutineRenderer.render(svg,visible,engine,{index:0});
   const labels=svg.children.filter(n=>n.attrs.class==='routine-block-label');
   assert.equal(svg.children.filter(n=>'rx' in n.attrs).length,0,'Blocks share the outer tablature panel without extra card backgrounds');
   assert.equal(labels.length,3);assert.ok(labels.every(n=>/P\d → P\d/.test(n.textContent)),labels.map(n=>n.textContent).join(','));
   assert.equal(svg.children.filter(n=>n.attrs.class==='routine-slide').length,3);
   const strings=svg.children.filter(n=>n.attrs.stroke==='#899bb3');assert.equal(strings.length,width>=682?6:18);
   const columns=svg.children.filter(n=>'data-column' in n.attrs);assert.equal(columns.length,section.end-section.start);assert.equal(columns.filter(n=>n.attrs.class.includes('is-target')).length,1);
   for(const col of columns){
    const fret=col.children.find(n=>n.attrs.class==='routine-note-number'),note=visible.columns[col.attrs['data-column']].notes[0];
    assert.ok(strings.some(s=>s.attrs.y1===fret.attrs.y-1));assert.equal(Number(fret.textContent),note.fret);
    const top=Number(col.attrs['data-staff-top']),height=Number(col.attrs['data-staff-height']);
    assert.ok(top<=fret.attrs.y&&fret.attrs.y<top+height,'target belongs to the staff followed by the session');
    assert.equal(strings.filter(s=>s.attrs.y1>=top&&s.attrs.y1<top+height).length,6);
   }
   const holds=svg.children.filter(n=>n.attrs.class==='routine-melody-degree'&&n.textContent.includes('~'));
   assert.equal(holds.length,visible.columns.filter(c=>c.holdMs).length);
  }
 }
});

test('Following centers the entire next staff, stays still within it and can return upwards',()=>{
 const r=sessionRuntime(true);r.session.enter();r.nodes.get('#routineSteps').children[4].children[0].click();
 const svg=r.nodes.get('#routineTab'),screen=r.nodes.get('#routine'),target=new Node(),scrolls=[];
 screen.clientHeight=740;screen.scrollTop=0;screen.getBoundingClientRect=()=>({top:0,bottom:740});
 screen.scrollTo=options=>{scrolls.push(options);screen.scrollTop=options.top};
 r.c.window.innerHeight=740;
 svg.viewBox={baseVal:{height:669}};svg.getBoundingClientRect=()=>({top:300-screen.scrollTop,height:669});
 target.setAttribute('data-staff-top',0);target.setAttribute('data-staff-height',223);svg.querySelector=()=>target;
 r.session.resize();assert.equal(scrolls.length,0,'the first staff is already fully visible');
 target.setAttribute('data-staff-top',223);r.session.resize();
 assert.equal(scrolls.length,1);assert.equal(screen.scrollTop,264.5);assert.equal(scrolls[0].behavior,'auto');
 r.session.resize();assert.equal(scrolls.length,1,'notes in the same visible staff do not make the page jump');
 r.c.window.matchMedia=()=>({matches:false});target.setAttribute('data-staff-top',446);r.session.resize();
 assert.equal(scrolls.length,1,'the next staff may already fit in the viewport');
 screen.scrollTop=600;target.setAttribute('data-staff-top',0);r.session.resize();
 assert.equal(scrolls.length,2);assert.equal(scrolls[1].behavior,'smooth');
 assert.equal(screen.scrollTop,41.5,'the return can bring an earlier staff back to the center');
 r.nodes.get('#routineMic').click();screen.scrollTop=0;target.setAttribute('data-staff-top',446);r.session.resize();
 assert.equal(scrolls.length,2,'microphone-off practice never scrolls automatically');
});

test('Following uses the visible mobile viewport and keeps the note visible in short landscape',()=>{
 const r=sessionRuntime(true);r.session.enter();r.nodes.get('#routineSteps').children[4].children[0].click();
 const svg=r.nodes.get('#routineTab'),screen=r.nodes.get('#routine'),target=new Node();
 screen.clientHeight=740;screen.scrollTop=0;screen.getBoundingClientRect=()=>({top:0,bottom:740});
 screen.scrollTo=options=>{screen.scrollTop=options.top};
 r.c.window.innerHeight=740;r.c.window.visualViewport={offsetTop:40,height:180};
 svg.viewBox={baseVal:{height:669}};svg.getBoundingClientRect=()=>({top:300-screen.scrollTop,height:669});
 target.setAttribute('data-staff-top',223);target.setAttribute('data-staff-height',223);
 target.getBoundingClientRect=()=>({top:600-screen.scrollTop,height:22});svg.querySelector=()=>target;
 r.session.resize();assert.equal(screen.scrollTop,481);
 const note=target.getBoundingClientRect();assert.ok(note.top>=56&&note.top+note.height<=204);
 r.session.resize();assert.equal(screen.scrollTop,481,'a visible target does not drift on resize');
});

test('Progress navigation reuses exercises and marks the active step',()=>{
 const r=sessionRuntime();r.session.enter();const first=r.c.lastExercise;
 r.nodes.get('#routineSteps').children[3].children[0].click();assert.equal(r.c.lastExercise.id,'chords');
 assert.equal(r.nodes.get('#routineSteps').children.filter(n=>n.classes.has('is-complete')).length,0);
 r.nodes.get('#routineSteps').children[0].children[0].click();assert.equal(JSON.stringify(r.c.lastExercise),JSON.stringify(first));
 assert.equal(r.nodes.get('#routineContext').hidden,false);
 assert.equal(r.nodes.get('#routineSteps').children[0].children[0].attrs['aria-current'],'step');
});

test('Skipping ahead does not complete unplayed routine stages',()=>{
 const r=sessionRuntime();r.session.enter();r.nodes.get('#routineSteps').children[4].children[0].click();
 assert.equal(r.nodes.get('#routineNext').textContent,'Return →');r.next();
 assert.equal(r.c.lastExercise.id,'root');assert.equal(r.nodes.get('#routineFinish').hidden,true);
});

test('Replay clears completed stages, changes the premium root and retains the selected quality',()=>{
 const r=sessionRuntime();r.session.enter();r.nodes.get('#routineQualityControls').children[0].click();
 for(let round=0;round<3;round++){
  const previous=r.c.lastExercise.root;
  for(let i=0;i<5;i++)r.next();
  r.nodes.get('#routineReplay').click();
  assert.equal(r.c.lastExercise.id,'root');assert.notEqual(r.c.lastExercise.root,previous);assert.equal(r.c.lastExercise.quality,'major');
  assert.equal(r.nodes.get('#routineFinish').hidden,true);assert.equal(r.nodes.get('#routineNext').hidden,false);
  assert.equal(r.nodes.get('#routineSteps').children.filter(n=>n.classes.has('is-complete')).length,0);
 }
 assert.equal(r.c.opens,0);
});

test('Replay remains available in the demo and keeps A minor without opening Premium',()=>{
 const r=sessionRuntime(true);r.session.enter();
 for(let i=0;i<5;i++)r.next();
 r.nodes.get('#routineReplay').click();
 assert.equal(r.c.lastExercise.id,'root');assert.equal(r.c.lastExercise.root,'A');assert.equal(r.c.lastExercise.quality,'minor');
 assert.equal(r.nodes.get('#routineFinish').hidden,true);assert.equal(r.c.opens,0);
});


test('Manual continuation shows one brief celebration and cannot skip twice',()=>{
 const r=sessionRuntime(true);r.session.enter();r.nodes.get('#routineNext').click();
 assert.equal(r.c.lastExercise.id,'root');assert.equal(r.nodes.get('#routineTransition').hidden,false);
 r.nodes.get('#routineNext').click();r.flush();
 assert.equal(r.c.lastExercise.id,'root');assert.equal(r.c.lastExercise.rootRecall,true);assert.equal(r.nodes.get('#routineTransition').hidden,true);
});
test('A complete routine uses distinct localized inspirations, keeps each credit stable and resets on replay',()=>{
 const r=sessionRuntime(true,false,new Map(),false,()=>.999);
 const fr=JSON.parse(fs.readFileSync(path.join(base,'locales/fr.json'),'utf8'));
 r.c.window.FretboardI18n={text:key=>fr[key]||key,note:key=>key};r.session.enter();
 const seen=[];
 for(let step=0;step<40&&r.nodes.get('#routineFinish').hidden;step++){
  r.nodes.get('#routineNext').click();
  if(r.nodes.get('#routineTransition').hidden)continue; // strumming has multiple patterns
  const message=r.nodes.get('#routineEncouragementDetail').textContent;
  const author=r.nodes.get('#routineEncouragementAuthor').textContent;
  const expected=r.c.RoutineEncouragement.messages.find(entry=>fr[entry.text]===message);
  assert.ok(expected);assert.equal(author,expected.author);
  assert.equal(r.nodes.get('#routineEncouragement').textContent,'Continue comme ça !');
  assert.equal(r.nodes.get('#routineEncouragementCredit').textContent,'Inspiré de');
  assert.equal(r.nodes.get('#routineNext').disabled,true);
  r.session.resize();r.nodes.get('#routineNext').click();
  assert.equal(r.nodes.get('#routineEncouragementDetail').textContent,message);
  assert.equal(r.nodes.get('#routineEncouragementAuthor').textContent,author);
  seen.push(message);r.flush();assert.equal(r.nodes.get('#routineTransition').hidden,true);
 }
 assert.equal(r.nodes.get('#routineFinish').hidden,false);
 assert.equal(seen.length,12);assert.equal(new Set(seen.slice(0,10)).size,10);assert.notEqual(seen[9],seen[10]);
 r.nodes.get('#routineReplay').click();r.nodes.get('#routineNext').click();
 assert.equal(r.nodes.get('#routineEncouragementDetail').textContent,seen[0]);
 r.session.leave();r.flush();assert.equal(r.nodes.get('#routineTransition').hidden,true);
});
test('Leaving or choosing a step cancels a pending transition',()=>{
 const r=sessionRuntime(true);r.session.enter();r.nodes.get('#routineNext').click();r.session.leave();r.flush();assert.equal(r.c.lastExercise.id,'root');
 r.session.enter();r.nodes.get('#routineNext').click();r.nodes.get('#routineSteps').children[3].children[0].click();r.flush();assert.equal(r.c.lastExercise.id,'chords');
});
test('A saved microphone-off choice leaves the routine offline until enabled',()=>{
 const r=sessionRuntime(true,false);r.session.enter();assert.equal(r.c.audio.state,'off');assert.equal(r.nodes.get('#routineListening').hidden,false);assert.equal(r.nodes.get('#routineMicStatus').textContent,'Microphone off');
 r.nodes.get('#routineMic').click();assert.equal(r.c.audio.state,'on');assert.equal(r.nodes.get('#routineMic').attrs['aria-checked'],'true');
 r.session.leave();assert.equal(r.c.audio.state,'off');assert.equal(r.nodes.get('#routineListening').hidden,true);
});


test('Routine entry defaults to listening, remembers off, and replay respects the choice',()=>{
 const r=sessionRuntime(true);assert.equal(r.c.audio.state,'off');r.session.enter();assert.equal(r.c.audio.state,'on');
 r.nodes.get('#routineMic').click();assert.equal(r.c.audio.state,'off');assert.equal(r.c.micPreference.enabled,false);
 r.session.leave();r.session.enter();assert.equal(r.c.audio.state,'off');
 for(let i=0;i<5;i++)r.next();r.nodes.get('#routineReplay').click();assert.equal(r.c.audio.state,'off');
 r.nodes.get('#routineMic').click();assert.equal(r.c.micPreference.enabled,true);
 for(let i=0;i<5;i++)r.next();assert.equal(r.c.audio.state,'off');r.nodes.get('#routineReplay').click();assert.equal(r.c.audio.state,'on');
 r.session.leave();assert.equal(r.c.audio.state,'off');assert.equal(r.c.micPreference.enabled,true);
});
test('Guided tablature reads every written note exactly once, including the descending passage',()=>{
 const c=runtime();c.document={createElementNS:()=>new Node()};vm.runInContext(fs.readFileSync(path.join(base,'core/routine-renderer.js'),'utf8'),c);
 for(const width of [280,390,768,1100]){
  const engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar);
  const exercises=c.RoutineExercises.create({engine,root:'A',quality:'minor',random:rng(9)});
  for(const exercise of [exercises[1],exercises[4]]){
   let previous=null;
   for(let index=0;index<exercise.columns.length;index++){
    const svg=new Node();svg.parentElement={clientWidth:width};c.window.RoutineRenderer.render(svg,exercise,engine,{index,animate:false});
    const columns=svg.children.filter(n=>'data-column' in n.attrs),target=columns.find(n=>n.attrs.class.includes('is-target'));
    assert.equal(columns.length,exercise.columns.length);assert.equal(target.attrs['data-column'],index);
    assert.equal(columns.filter(n=>n.attrs.class.includes('is-played')).length,index);
    const fret=target.children.find(n=>n.attrs.class==='routine-note-number');
    assert.equal(Number(fret.textContent),exercise.columns[index].notes[0].fret);
    // Read left to right on one staff, then start the next staff below it.
    if(previous)assert.ok(fret.attrs.x>previous.x||fret.attrs.y>previous.y+40);
    previous={x:fret.attrs.x,y:fret.attrs.y};
   }
  }
 }
});

for(const step of [0,2])test(`Routine step ${step+1} accepts quiet audio only after a sustained correct match`,()=>{
 const {samples,spectrum,N}=require('./audio-fixtures.cjs'),r=sessionRuntime(true);r.session.enter();
 r.nodes.get('#routineSteps').children[step].children[0].click();
 const engine=r.c.FretboardEngine.createInstrumentEngine(r.c.FRETBOARD_INSTRUMENTS.guitar);
 const midis=r.c.lastExercise.columns[0].notes.map(n=>engine.midiAt(n.string,n.fret)),options={gain:.015,noise:.0001};
 const play=(notes,now)=>r.c.audio.onFrame({samples:samples(notes,options),spectrum:spectrum(notes,options),sampleRate:48000,fftSize:N,now});
 const progress=()=>r.nodes.get('#routineNoteProgress').textContent;
 const first=progress();
 for(let now=1500;now<2300;now+=80)play(midis.map(m=>m+1),now);
 assert.equal(progress(),first);
 play(midis,2300);assert.equal(progress(),first);
 for(let now=2380;now<2940;now+=80)play(midis,now);
 assert.ok(progress().startsWith('2 /'),progress());
});

for(const diagonal of [0,1])test(`Microphone completes diagonal ${diagonal+1} out and back, sustaining each root without a tempo`,()=>{
 const {samples,N}=require('./audio-fixtures.cjs');
 const r=sessionRuntime(true,true,new Map(),false,Math.random,()=>diagonal?.99:0);
 r.session.enter();r.nodes.get('#routineSteps').children[4].children[0].click();
 const engine=r.c.FretboardEngine.createInstrumentEngine(r.c.FRETBOARD_INSTRUMENTS.guitar);
 let now=1500,played=0;
 for(const count of [15,14]){
  assert.equal(r.c.lastExercise.columns.length,count);
  for(let i=0;i<count;i++){
   const column=r.c.lastExercise.columns[i],note=column.notes[0];
   const pcm=samples([engine.midiAt(note.string,note.fret)],{gain:.015,noise:.0001});
   const input=at=>r.c.audio.onFrame({samples:pcm,spectrum:new Float32Array(N/2),sampleRate:48000,fftSize:N,now:at});
   const progress=r.nodes.get('#routineNoteProgress').textContent;
   for(let offset=0;offset<=240;offset+=80)input(now+offset);
   if(column.holdMs){
    assert.equal(r.nodes.get('#routineNoteProgress').textContent,progress,'a brief root cannot advance');
    assert.match(r.nodes.get('#routineMicStatus').textContent,/Root: A/);
    input(now+320);input(now+400);
   }
   if(i<count-1)assert.equal(r.nodes.get('#routineNoteProgress').textContent,`${i+2} / ${count}`);
   else assert.equal(r.nodes.get('#routineTransition').hidden,false);
   played++;now+=1000;
  }
  r.c.now=now;r.flush();now+=500;
 }
 assert.equal(played,29);assert.equal(r.nodes.get('#routineSteps').children[4].classes.has('is-complete'),true);
});

test('Daily Routine triads and connecting thirds stay at or below fret 12 in every instrument and key',()=>{
 const c=runtime();let boundaryNotes=0;
 for(const profile of Object.values(c.FRETBOARD_INSTRUMENTS))for(const root of c.MusicTheory.NOTES)for(const quality of ['major','minor'])for(let seed=1;seed<=8;seed++){
  const engine=c.FretboardEngine.createInstrumentEngine(profile),e=c.RoutineExercises.create({engine,root,quality,random:rng(seed)})[2],label=`${profile.id} ${root} ${quality} seed ${seed}`;
  assert.ok(e.columns.length,label);
  for(const col of e.columns)for(const note of [...col.notes,...(col.from?[col.from]:[])]){
   assert.ok(note.fret>=0&&note.fret<=12,`${label}: fret ${note.fret}`);
   if(note.fret===12)boundaryNotes++;
  }
 }
 assert.ok(boundaryNotes>0,'Fret 12 itself remains playable');
});
test('Bass and ukulele keep three inversions when they fit, or two complete inversions within fret 12',()=>{
 const c=runtime();
 for(const [instrument,root,quality,count] of [['bass4','B','major',2],['bass4','A','minor',3],['ukulele','C#','minor',2],['ukulele','A','minor',3]]){
  const engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS[instrument]);
  const e=c.RoutineExercises.create({engine,root,quality,random:()=>.999})[2];
  assert.equal(e.columns.length,count,`${instrument} ${root} ${quality}`);
  assert.equal(new Set(e.columns.map(col=>col.label)).size,count);
  assert.ok(e.columns.every(col=>col.notes.length===3&&col.notes.every(note=>note.fret<=12)));
 }
});
test('All guitar keys traverse complete shapes within frets 0–12 on GBE, DGB and ADG, with same-string third liaisons',()=>{
 const c=runtime(),engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar);
 for(const root of c.MusicTheory.NOTES)for(const quality of ['major','minor']){
  const e=c.RoutineExercises.create({engine,root,quality,random:rng(4)})[2];
  assert.equal(e.sections.map(s=>s.set).join(','),'GBE,DGB,ADG');
  assert.equal(e.sections[0].start,0);assert.equal(e.sections.at(-1).end,e.columns.length);
  for(const section of e.sections){
   const cols=e.columns.slice(section.start,section.end),triads=cols.filter(c=>c.kind==='triad');
   assert.equal(cols.length,triads.length*2-1);assert.ok(triads.length>=2);
   assert.ok(Math.min(...triads[0].notes.map(n=>n.fret))<=4);
   const expected=c.TriadEngine.findShapes({engine,rootPC:c.MusicTheory.PC[root],quality,maxFret:15,set:section.set}).filter(shape=>shape.notes.every(n=>n.fret<=12));
   assert.deepEqual(triads.map(col=>col.notes),expected.map(shape=>shape.notes),'Keep every complete low shape without clipping chord notes');
   assert.equal(new Set(triads.map(c=>c.label)).size,new Set(expected.map(shape=>shape.inversion)).size);
   cols.forEach((col,i)=>{
    assert.equal(col.kind,i%2?'third':'triad');
    assert.ok(col.notes.every(n=>section.strings.includes(n.string)&&n.string!==0&&n.fret<=12));
    if(i%2){
     const target=col.notes[0];assert.equal(target.degree,'third');
     assert.ok(cols[i+1].notes.some(n=>n.string===target.string&&n.fret===target.fret));
     assert.ok(cols[i-1].notes.some(n=>n.string===col.from.string&&n.fret===col.from.fret));
     assert.equal(target.string,col.from.string);assert.equal(target.fret-col.from.fret,quality==='major'?4:3);
    }else if(i)assert.ok(Math.min(...col.notes.map(n=>n.fret))>Math.min(...cols[i-2].notes.map(n=>n.fret)));
   });
  }
 }
});
test('A minor triads identify actual CAGED fragments, including shared C/D and A/G shapes',()=>{
 const c=runtime(),engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar);
 const e=c.RoutineExercises.create({engine,root:'A',quality:'minor'})[2];
 assert.equal(e.sections.map(s=>e.columns.slice(s.start,s.end).filter(c=>c.kind==='triad').map(c=>c.forms.join('/')).join(',')).join('|'),'A,E,C/D|A/G,E,C|G,E,C');
 assert.ok(e.columns.filter(c=>c.kind==='third').every(c=>c.label==='Minor third — C'));
 for(const [root,third] of [['C#','E#'],['G#','B#'],['A#','C##'],['D#','F##']]){
  const e=c.RoutineExercises.create({engine,root,quality:'major'})[2];
  assert.ok(e.columns.filter(c=>c.kind==='third').every(c=>c.label==='Major third — '+third));
 }
});
test('Manual Next completes each string group in order and marks Triads complete only after the third group',()=>{
 const r=sessionRuntime(true,false);r.session.enter();r.nodes.get('#routineSteps').children[2].children[0].click();
 for(let section=0;section<3;section++){
  assert.equal(playedStrings(r.c.lastExercise),[[3,4,5],[2,3,4],[1,2,3]][section].join(','));
  assert.equal(r.nodes.get('#routineSteps').children[2].classes.has('is-complete'),false);
  r.nodes.get('#routineNext').click();r.nodes.get('#routineNext').click();r.flush();
 }
 assert.equal(r.c.lastExercise.id,'chords');assert.equal(r.nodes.get('#routineSteps').children[2].classes.has('is-complete'),true);
 r.nodes.get('#routineSteps').children[2].children[0].click();assert.equal(playedStrings(r.c.lastExercise),'3,4,5');
});
test('Cancelling a group transition preserves its group, and microphone toggling does not restart it',()=>{
 const r=sessionRuntime(true);r.session.enter();r.nodes.get('#routineSteps').children[2].children[0].click();r.nextGroup();
 assert.equal(playedStrings(r.c.lastExercise),'2,3,4');
 r.nodes.get('#routineMic').click();r.nodes.get('#routineMic').click();assert.equal(playedStrings(r.c.lastExercise),'2,3,4');
 r.nodes.get('#routineNext').click();r.nodes.get('#routineSteps').children[0].children[0].click();r.flush();
 assert.equal(r.c.lastExercise.id,'root');r.nodes.get('#routineSteps').children[2].children[0].click();
 assert.equal(playedStrings(r.c.lastExercise),'2,3,4');
 r.nodes.get('#routineRootControls').children.find(b=>b.dataset.value==='A').click();
 r.session.leave();r.session.enter();r.nodes.get('#routineSteps').children[2].children[0].click();assert.equal(playedStrings(r.c.lastExercise),'3,4,5');
});
for(const quality of ['minor','major'])test(`Audio completes all three ${quality} triad groups and requires isolated thirds between chords`,()=>{
 const {samples,spectrum,N}=require('./audio-fixtures.cjs'),r=sessionRuntime(false);r.session.enter();
 r.nodes.get('#routineRootControls').children.find(b=>b.dataset.value==='A').click();
 if(quality==='major')r.nodes.get('#routineQualityControls').children[0].click();
 r.nodes.get('#routineSteps').children[2].children[0].click();
 const engine=r.c.FretboardEngine.createInstrumentEngine(r.c.FRETBOARD_INSTRUMENTS.guitar);let now=1500;
 const play=(notes,frames=10)=>{const data=samples(notes,{gain:.02}),bins=spectrum(notes,{gain:.02});for(let i=0;i<frames;i++,now+=80)r.c.audio.onFrame({samples:data,spectrum:bins,sampleRate:48000,fftSize:N,now})};
 const progress=()=>r.nodes.get('#routineNoteProgress').textContent;
 for(let section=0;section<3;section++){
  assert.equal(playedStrings(r.c.lastExercise),[[3,4,5],[2,3,4],[1,2,3]][section].join(','));
  const cols=r.c.lastExercise.columns;
  for(let i=0;i<cols.length;i++){
   assert.equal(progress(),`${i+1} / ${cols.length}`);
   const midi=c=>c.notes.map(n=>engine.midiAt(n.string,n.fret));
   if(cols[i].kind==='third'){
    play(midi(cols[i+1]));assert.equal(progress(),`${i+1} / ${cols.length}`,'full next chord cannot replace its isolated third');
    play(midi(cols[i]).map(m=>m+1));assert.equal(progress(),`${i+1} / ${cols.length}`,'wrong note is rejected');
   }
   play(midi(cols[i]));
   if(i<cols.length-1)assert.equal(progress(),`${i+2} / ${cols.length}`);
   else {assert.equal(r.nodes.get('#routineTransition').hidden,false);r.flush()}
  }
 }
 assert.equal(r.c.lastExercise.id,'chords');
});

for(const rate of [44100,48000])test(`D# minor ADG journey accepts the F# at fret 9 over residual ringing at ${rate} Hz`,()=>{
 const {samples,spectrumOf,N}=require('./audio-fixtures.cjs'),r=sessionRuntime(false);r.session.enter();
 r.nodes.get('#routineRootControls').children.find(b=>b.dataset.value==='D#').click();
 r.nodes.get('#routineSteps').children[2].children[0].click();
 r.nextGroup();r.nextGroup();
 const engine=r.c.FretboardEngine.createInstrumentEngine(r.c.FRETBOARD_INSTRUMENTS.guitar);
 const columns=r.c.lastExercise.columns,midi=col=>Array.from(col.notes,n=>engine.midiAt(n.string,n.fret));
 assert.deepEqual(midi(columns[0]),[51,54,58]);
 assert.deepEqual(midi(columns[1]),[54]);
 assert.equal(columns[1].notes[0].string,1);assert.equal(columns[1].notes[0].fret,9);
 let now=1500;
 const progress=()=>r.nodes.get('#routineNoteProgress').textContent;
 const play=(notes,levels)=>{
  const data=samples(notes,{rate,levels,gain:.08,pluck:.22,slope:.8}),bins=spectrumOf(data);
  for(let i=0;i<10;i++,now+=80)r.c.audio.onFrame({samples:data,spectrum:bins,sampleRate:rate,fftSize:N,now});
 };
 play(midi(columns[0]));assert.equal(progress(),'2 / 3');
 play(midi(columns[0]));assert.equal(progress(),'2 / 3','ringing whole previous triad must not skip the liaison');
 play(midi(columns[2]));assert.equal(progress(),'2 / 3','next whole triad must not replace its third');
 play([55,51,58],[1,.2,.2]);assert.equal(progress(),'2 / 3','wrong liaison must still be rejected');
 play([54,51,58],[1,.2,.2]);assert.equal(progress(),'3 / 3');
 assert.equal(r.nodes.get('#routineTransition').hidden,true,'the liaison must not also count as the next triad');
 play(midi(columns[2]));assert.equal(r.nodes.get('#routineTransition').hidden,false);
});

test('Rhythm replaces only guitar chords and remains independent of key',()=>{
 const c=runtime(),engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar);
 for(const root of c.MusicTheory.NOTES)for(const quality of ['major','minor']){
  const e=c.RoutineExercises.create({engine,root,quality})[3];assert.equal(e.strumming,true);assert.equal(e.columns.length,0);assert.equal(e.step,'Rhythm');assert.equal(e.patterns.length,3);
 }
});
test('Next skips each pattern, microphone and navigation preserve the selected pattern',()=>{
 const r=sessionRuntime(true,false);r.session.enter();r.nodes.get('#routineSteps').children[3].children[0].click();
 assert.equal(r.nodes.get('#routineStrumming').hidden,false);assert.equal(r.nodes.get('#routineNoteProgress').hidden,true);
 assert.ok(r.nodes.get('#routinePatternSteps').children[0].attrs['aria-current']);
 r.nextGroup();assert.equal(r.c.lastExercise.id,'chords');assert.ok(r.nodes.get('#routinePatternSteps').children[1].attrs['aria-current']);
 r.nodes.get('#routineMic').click();r.nodes.get('#routineMic').click();r.nodes.get('#routineSteps').children[0].children[0].click();r.nodes.get('#routineSteps').children[3].children[0].click();
 assert.ok(r.nodes.get('#routinePatternSteps').children[1].attrs['aria-current']);r.nextGroup();r.nextGroup();assert.equal(r.c.lastExercise.id,'penta');
 assert.equal(r.nodes.get('#routineRhythmControls').hidden,true);assert.equal(r.nodes.get('#routineStrumming').hidden,true);
});

test('Every guitar triad section keeps six named strings and the notes on their actual string lines',()=>{
 const c=runtime();c.document={createElementNS:()=>new Node()};vm.runInContext(fs.readFileSync(path.join(base,'core/routine-renderer.js'),'utf8'),c);
 const engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar),exercise=c.RoutineExercises.create({engine,root:'D',quality:'minor'})[2];
 for(const width of [280,390,1194])for(const section of exercise.sections){
  const visible={...exercise,columns:exercise.columns.slice(section.start,section.end)},svg=new Node();svg.parentElement={clientWidth:width};
  c.window.RoutineRenderer.render(svg,visible,engine,{index:1,animate:false});
  const strings=svg.children.filter(n=>n.attrs.class==='routine-string-label'),lines=svg.children.filter(n=>n.attrs.stroke==='#899bb3');
  assert.ok(strings.length>=6);assert.equal(strings.length%6,0);assert.equal(lines.length,strings.length);
  for(let i=0;i<strings.length;i+=6)assert.equal(strings.slice(i,i+6).map(n=>n.textContent).join(','),'E,A,D,G,B,E');
  const columns=svg.children.filter(n=>'data-column' in n.attrs);
  columns.forEach((column,index)=>{
   const frets=column.children.filter(n=>n.attrs.class==='routine-note-number');
   assert.equal(frets.length,visible.columns[index].notes.length);
   frets.forEach((fret,n)=>assert.equal(lines.findIndex(line=>line.attrs.y1===fret.attrs.y-1)%6,visible.columns[index].notes[n].string));
  });
 }
});

test('Ambient microphone input never displays a rhythm grade or advances progress after entering or changing tempo',async()=>{
 const r=sessionRuntime(true,true,new Map(),true);
 r.session.enter();r.nodes.get('#routineSteps').children[3].children[0].click();
 await new Promise(resolve=>setImmediate(resolve));
 const samples=new Float32Array(16384);let seed=13;
 for(let i=0;i<samples.length;i++){seed=(seed*16807)%2147483647;samples[i]=.003+.001*(seed/2147483647*2-1)}
 for(let now=1400;now<7000;now+=20){
  r.c.frame(now);
  if(now===4000)r.nodes.get('#routineTempo').events.change({target:{value:'120'}});
  r.c.audio.onFrame({samples,sampleRate:48000,now});
  assert.equal(r.nodes.get('#routineRhythmFeedback').hidden,true);
  assert.equal(r.nodes.get('#routineRhythmPreview').attrs['aria-pressed'],'true');
  assert.equal(r.nodes.get('#routineRepeatCount').textContent,'0 / 3');
 }
 assert.equal(r.nodes.get('#routinePatternSteps').children[0].attrs['aria-current'],'step');
});

test('Microphone PCM strums validate repeats during Listen with raw instrument input in every exercise',async()=>{
 const r=sessionRuntime(true,true,new Map(),true);r.session.enter();
 assert.equal(r.c.echoCancellation,false);r.nodes.get('#routineSteps').children[3].children[0].click();
 await new Promise(setImmediate);assert.equal(r.c.echoCancellation,false);
 const rate=48000,samples=new Float32Array(16384);let sawGrade=false;
 // The first motif is quarter-note downstrokes. Start on its second beat,
 // leaving the normal microphone settling window intact.
 for(let now=1020;now<=10120;now+=20){
  const end=Math.round(now*rate/1000);
  for(let i=0;i<samples.length;i++){
   const time=(end-samples.length+i)/rate,beat=Math.floor((time-1)/.75),age=time-(1+beat*.75);
   samples[i]=beat<1?0:.03*Math.min(age/.008,1)*Math.exp(-age*12)*(Math.sin(2*Math.PI*110*time)+.5*Math.sin(2*Math.PI*220*time));
  }
  r.c.frame(now);r.c.audio.onFrame({samples,sampleRate:rate,now});
  if(!r.nodes.get('#routineRhythmFeedback').hidden)sawGrade=true;
 }
 assert.ok(sawGrade);assert.ok(r.c.scheduled>100);
 assert.equal(r.nodes.get('#routinePatternSteps').children[1].attrs['aria-current'],'step');
 await new Promise(setImmediate);assert.equal(r.nodes.get('#routineRhythmPreview').attrs['aria-pressed'],'true');
 r.nodes.get('#routineSteps').children[0].children[0].click();assert.equal(r.c.echoCancellation,false);
});


function feedPhrase(r,segments,rate,start=1500){
 const {phrase,spectrumOf}=require('./audio-fixtures.cjs'),pcm=phrase(segments,{rate});
 const size=r.c.fftSize,hop=Math.round(rate/30);
 for(let end=hop;end<=pcm.length;end+=hop){
  const data=new Float32Array(size),from=Math.max(0,end-size);
  data.set(pcm.subarray(from,end),size-(end-from));
  const now=start+end*1000/rate;r.c.now=now;
  r.c.audio.onFrame({samples:data,spectrum:spectrumOf(data),sampleRate:rate,fftSize:size,now});
 }
}
for(const rate of [44100,48000])for(const diagonal of [0,1])test(`Continuous penta ${diagonal+1} at ${rate} Hz follows 180 ms notes and unpicked slides both ways`,()=>{
 const r=sessionRuntime(true,true,new Map(),false,Math.random,()=>diagonal?.99:0);
 r.session.enter();r.nodes.get('#routineSteps').children[4].children[0].click();
 const engine=r.c.FretboardEngine.createInstrumentEngine(r.c.FRETBOARD_INSTRUMENTS.guitar);
 let now=1500;
 for(const count of [15,14]){
  const columns=r.c.lastExercise.columns;
  const segments=columns.map(col=>({midis:Array.from(col.notes,n=>engine.midiAt(n.string,n.fret)),
   durationMs:col.holdMs?620:col.slideFrom?240:180,
   ...(col.slideFrom?{fromMidi:engine.midiAt(col.slideFrom.string,col.slideFrom.fret),glideMs:80}:{}),detune:-18}));
  assert.equal(columns.length,count);
  feedPhrase(r,segments,rate,now);
  assert.equal(r.nodes.get('#routineTransition').hidden,false,`stuck at ${r.nodes.get('#routineNoteProgress').textContent}`);
  now+=segments.reduce((sum,s)=>sum+s.durationMs,0)+500;r.c.now=now;r.flush();now+=500;
 }
 assert.equal(r.nodes.get('#routineSteps').children[4].classes.has('is-complete'),true);
});
for(const rate of [44100,48000])test(`Continuous acoustic triads at ${rate} Hz follow 300 ms shapes and sliding liaisons`,()=>{
 const r=sessionRuntime(true);r.session.enter();r.nodes.get('#routineSteps').children[2].children[0].click();
 const engine=r.c.FretboardEngine.createInstrumentEngine(r.c.FRETBOARD_INSTRUMENTS.guitar);let now=1500;
 for(let section=0;section<3;section++){
  const segments=r.c.lastExercise.columns.map(col=>({midis:Array.from(col.notes,n=>engine.midiAt(n.string,n.fret)),durationMs:300,
   ...(col.kind==='third'?{fromMidi:engine.midiAt(col.from.string,col.from.fret),glideMs:70}:{}),levels:[1,.8,.9],detune:18}));
  feedPhrase(r,segments,rate,now);
  assert.equal(r.nodes.get('#routineTransition').hidden,false,`group ${section+1}: ${r.nodes.get('#routineNoteProgress').textContent}`);
  now+=segments.length*300+500;r.c.now=now;r.flush();now+=500;
 }
 assert.equal(r.c.lastExercise.id,'chords');
});
test('A slide that stops one fret short, transient crossings, noise and a wrong octave do not advance penta',()=>{
 const r=sessionRuntime(true);r.session.enter();r.nodes.get('#routineSteps').children[4].children[0].click();
 const engine=r.c.FretboardEngine.createInstrumentEngine(r.c.FRETBOARD_INSTRUMENTS.guitar),note=r.c.lastExercise.columns[0].notes[0],midi=engine.midiAt(note.string,note.fret);
 const initial=r.nodes.get('#routineNoteProgress').textContent;
 feedPhrase(r,[{midis:[midi-1],fromMidi:midi-3,glideMs:90,durationMs:250},
  {midis:[midi+2],fromMidi:midi-2,glideMs:80,durationMs:250},
  {midis:[midi+12],durationMs:350},{midis:[],durationMs:250}],48000);
 assert.equal(r.nodes.get('#routineNoteProgress').textContent,initial);
});
test('Flow capture restores the original rhythm and scale analysis settings on navigation',()=>{
 const r=sessionRuntime(true);r.session.enter();
 for(const [step,size,interval] of [[4,8192,25],[3,16384,20],[2,8192,25],[1,16384,80],[0,16384,80]]){
  r.nodes.get('#routineSteps').children[step].children[0].click();
  assert.equal(r.c.fftSize,size);assert.equal(r.c.interval,interval);
 }
});

test('Root octave paths transpose to all 12 notes without open strings or octave wrapping',()=>{
 const c=runtime(),engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar);
 for(const root of c.MusicTheory.NOTES){
  const major=c.RoutineExercises.create({engine,root,quality:'major'})[0],minor=c.RoutineExercises.create({engine,root,quality:'minor'})[0];
  assert.equal(JSON.stringify(major.columns),JSON.stringify(minor.columns),'quality does not change the tonic');
  assert.equal(minor.sections.length,4);assert.equal(minor.columns.length,20);
  for(const [i,section] of minor.sections.entries()){
   assert.equal(section.recall,i%2===1);assert.equal(section.start,i*5);assert.equal(section.end,(i+1)*5);
   const notes=flatten({columns:minor.columns.slice(section.start,section.end)});
   assert.equal(notes.map(n=>n.string).join(','),i<2?'0,2,4,2,0':'1,3,5,3,1');
   assert.ok(notes.every(n=>n.fret>=1&&n.fret<=17&&engine.noteAt(n.string,n.fret)===c.MusicTheory.PC[root]),root);
   assert.deepEqual(Array.from(notes,n=>engine.midiAt(n.string,n.fret)-engine.midiAt(notes[0].string,notes[0].fret)),[0,12,24,12,0]);
   assert.equal(notes.slice(1).map((n,j)=>n.fret-notes[j].fret).join(','),'2,3,-3,-2');
  }
 }
 for(const [root,paths] of [['A',[[5,7,10,7,5],[12,14,17,14,12]]],['C',[[8,10,13,10,8],[3,5,8,5,3]]],['E',[[12,14,17,14,12],[7,9,12,9,7]]]]){
  const e=c.RoutineExercises.create({engine,root,quality:'minor'})[0];
  assert.equal(flatten(e).map(n=>n.fret).join(','),paths.flatMap(p=>p.concat(p)).join(','));
 }
});

test('Root paths keep complete shapes within the available fret range',()=>{
 const c=runtime(),engine=c.FretboardEngine.createInstrumentEngine({...c.FRETBOARD_INSTRUMENTS.guitar,maxFret:12});
 const e=c.RoutineExercises.create({engine,root:'A',quality:'minor',diagonal:0})[0];
 assert.equal(e.sections.length,2);assert.ok(flatten(e).every(n=>n.fret<=12));
 assert.equal(flatten(e).map(n=>n.fret).join(','),'5,7,10,7,5,5,7,10,7,5');
});

test('Memory tabs reveal only the anchor and played notes, including their accessible description',()=>{
 const c=runtime();c.document={createElementNS:()=>new Node()};vm.runInContext(fs.readFileSync(path.join(base,'core/routine-renderer.js'),'utf8'),c);
 const engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar),e=c.RoutineExercises.create({engine,root:'A',quality:'minor'})[0];
 const visible={...e,rootRecall:true,columns:e.columns.slice(5,10)};
 for(const width of [280,390,1100])for(const index of [null,0,1,2,3,5]){
  const svg=new Node();svg.parentElement={clientWidth:width};c.window.RoutineRenderer.render(svg,visible,engine,index===null?null:{index});
  const columns=svg.children.filter(n=>'data-column' in n.attrs),numbers=columns.map(n=>n.children.find(c=>c.attrs.class==='routine-note-number').textContent);
  assert.deepEqual(numbers,['5',index>1?'7':'?',index>2?'10':'?',index>3?'7':'?',index>4?'5':'?']);
  assert.equal(svg.children.filter(n=>n.attrs.stroke==='#899bb3').length,6);
  assert.equal((svg.children[0].textContent.match(/Find the fret on string/g)||[]).length,numbers.filter(n=>n==='?').length);
  if(index<3)assert.doesNotMatch(svg.children[0].textContent,/fret 10/,'SVG title must not reveal the answer');
 }
});

test('Root memory stages support manual reveal and preserve it through resize, microphone and step changes',()=>{
 const r=sessionRuntime(true,false);r.session.enter();
 assert.equal(r.nodes.get('#routineNext').textContent,'Try from memory →');assert.equal(r.nodes.get('#routineRootReveal').hidden,true);
 r.nextGroup();assert.equal(r.c.lastExercise.rootRecall,true);assert.equal(r.nodes.get('#routineRootReveal').hidden,false);
 assert.equal(r.nodes.get('#routineNext').textContent,'Next diagonal →');
 r.session.resize();assert.equal(r.c.lastExercise.rootRecall,true);
 r.nodes.get('#routineMic').click();assert.equal(r.c.lastExercise.rootRecall,true);
 r.nodes.get('#routineMic').click();assert.equal(r.c.lastExercise.rootRecall,true);
 r.nodes.get('#routineRootReveal').click();assert.equal(r.c.lastExercise.rootRecall,false);assert.equal(r.nodes.get('#routineRootReveal').hidden,true);
 r.nodes.get('#routineSteps').children[1].children[0].click();r.nodes.get('#routineSteps').children[0].children[0].click();
 assert.equal(r.c.lastExercise.rootRecall,false);
 r.nextGroup();assert.equal(r.c.lastExercise.columns[0].notes[0].fret,12);assert.equal(r.c.lastExercise.rootRecall,false);
 r.nextGroup();assert.equal(r.c.lastExercise.rootRecall,true);assert.equal(r.nodes.get('#routineRootReveal').hidden,false);
 r.nextGroup();assert.equal(r.c.lastExercise.id,'scale');assert.equal(r.nodes.get('#routineRootReveal').hidden,true);
 r.nodes.get('#routineSteps').children[0].children[0].click();assert.equal(r.c.lastExercise.columns[0].notes[0].fret,5);assert.equal(r.c.lastExercise.rootRecall,false);
});

test('Microphone completes both root paths and memory passes; a wrong octave cannot advance',()=>{
 const {samples,N}=require('./audio-fixtures.cjs'),r=sessionRuntime(true);r.session.enter();
 const engine=r.c.FretboardEngine.createInstrumentEngine(r.c.FRETBOARD_INSTRUMENTS.guitar);
 let now=1500;
 const play=(midi)=>{
  const pcm=samples(midi===null?[]:[midi],{gain:.015,noise:.0001});
  for(let offset=0;offset<=400;offset+=80)r.c.audio.onFrame({samples:pcm,spectrum:new Float32Array(N/2),sampleRate:48000,fftSize:N,now:now+offset});
  now+=1000;
 };
 for(let section=0;section<4;section++){
  assert.equal(r.c.lastExercise.rootRecall,section%2===1);
  const notes=flatten(r.c.lastExercise);
  for(let i=0;i<notes.length;i++){
   const midi=engine.midiAt(notes[i].string,notes[i].fret),before=r.nodes.get('#routineNoteProgress').textContent;
   play(midi===45?midi+12:midi-12);assert.equal(r.nodes.get('#routineNoteProgress').textContent,before);
   play(null);play(midi);
   if(i<notes.length-1)assert.equal(r.nodes.get('#routineNoteProgress').textContent,`${i+2} / 5`);
  }
  assert.equal(r.nodes.get('#routineTransition').hidden,false);r.c.now=now;r.flush();now+=500;
 }
 assert.equal(r.c.lastExercise.id,'scale');assert.equal(r.nodes.get('#routineSteps').children[0].classes.has('is-complete'),true);
});
