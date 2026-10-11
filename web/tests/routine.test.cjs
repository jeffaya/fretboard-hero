const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.join(__dirname,'..');
function runtime(){const c={window:{}};vm.createContext(c);for(const name of ['core/music-theory','instruments/guitar','instruments/bass-4','instruments/ukulele','core/fretboard-engine','core/triad-engine','core/chord-engine','core/pentatonic-renderer','core/routine-exercises','core/routine-guide','core/routine-strumming','core/chord-detector','core/pitch-detector']){vm.runInContext(fs.readFileSync(path.join(base,name+'.js'),'utf8'),c);Object.assign(c,c.window)}return c}
function rng(seed){return()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296)}
const flatten=e=>e.columns.flatMap(c=>c.notes);
test('All keys, qualities and instruments have five playable and musically correct exercises',()=>{
 const c=runtime();let count=0;
 for(const profile of Object.values(c.FRETBOARD_INSTRUMENTS))for(const root of c.MusicTheory.NOTES)for(const quality of ['major','minor'])for(let seed=1;seed<=8;seed++){
  const engine=c.FretboardEngine.createInstrumentEngine(profile),rootPC=c.MusicTheory.PC[root],label=`${profile.id} ${root} ${quality} seed ${seed}`;
  let exercises;assert.doesNotThrow(()=>exercises=c.RoutineExercises.create({engine,root,quality,random:rng(seed)}),label);
  assert.equal(exercises.length,5);
  for(const e of exercises){assert.equal(e.root,root);assert.equal(e.quality,quality);assert.ok(e.columns.length,label);for(const n of flatten(e)){assert.ok(n.string>=0&&n.string<engine.stringCount,label);assert.ok(n.fret>=0&&n.fret<=15,label)}}
  const expected=[];engine.courses.forEach((_,string)=>{for(let fret=0;fret<=15;fret++)if(engine.noteAt(string,fret)===rootPC)expected.push(`${string}:${fret}`)});
  assert.equal(JSON.stringify(flatten(exercises[0]).map(n=>`${n.string}:${n.fret}`)),JSON.stringify(expected));
  const scale=flatten(exercises[1]),intervals=quality==='major'?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10],first=engine.midiAt(scale[0].string,scale[0].fret);
  assert.equal(engine.noteAt(scale[0].string,scale[0].fret),rootPC);assert.equal((scale.length-1)%7,0);assert.ok(scale.length>=8);
  scale.slice(0,(scale.length+1)/2).forEach((n,i)=>assert.equal(engine.midiAt(n.string,n.fret)-first,Math.floor(i/7)*12+intervals[i%7],label));
  const tones=[rootPC,c.MusicTheory.mod(rootPC+(quality==='major'?4:3)),c.MusicTheory.mod(rootPC+7)];
  assert.equal(new Set(exercises[2].columns.filter(col=>col.notes.length===3).map(c=>c.label)).size,3,label);
  for(const col of exercises[2].columns){assert.equal(col.notes.length,col.kind==='third'?1:3);assert.equal(new Set(col.notes.map(n=>engine.noteAt(n.string,n.fret))).size,col.notes.length);for(const n of col.notes)assert.ok(tones.includes(engine.noteAt(n.string,n.fret)),label)}
  for(const n of flatten(exercises[3]))assert.ok(tones.includes(engine.noteAt(n.string,n.fret)),label);
  if(profile.family==='bass'){assert.equal(exercises[3].step,'Arpeggios');const arp=flatten(exercises[3]);for(let i=1;i<(arp.length+1)/2;i++)assert.ok(arp[i].midi>arp[i-1].midi)}else{assert.ok(exercises[3].columns.length>=3,label);for(const col of exercises[3].columns)assert.equal(new Set(col.notes.map(n=>engine.noteAt(n.string,n.fret))).size,3)}
  const penta=c.MusicTheory.pentatonicPCs(rootPC,quality);assert.equal(flatten(exercises[4]).length,4*engine.stringCount-1);for(const n of flatten(exercises[4]))assert.ok(penta.includes(engine.noteAt(n.string,n.fret)),label);
  for(const e of exercises.filter(e=>['scale','penta'].includes(e.id)||(e.id==='chords'&&profile.family==='bass'))){
   const notes=flatten(e);assert.equal(notes.length%2,1,label);
   for(let i=0;i<Math.floor(notes.length/2);i++)assert.equal(JSON.stringify(notes[i]),JSON.stringify(notes[notes.length-1-i]),label);
   assert.notEqual(JSON.stringify(notes[Math.floor(notes.length/2)]),JSON.stringify(notes[Math.floor(notes.length/2)-1]),label+' turning note occurs once');
  }
  count++;
 }
 assert.equal(count,576);
});
test('Repeated routines vary scales and pentatonics while the full guitar triad journey stays predictable',()=>{
 const c=runtime(),engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar),random=rng(1234),variants=[new Set(),new Set(),new Set()];
 for(let i=0;i<30;i++){const e=c.RoutineExercises.create({engine,root:'A',quality:'minor',random});[e[1],e[2],e[4]].forEach((x,j)=>variants[j].add(JSON.stringify(x.columns)))}
 assert.ok(variants[0].size>2);assert.equal(variants[1].size,1);assert.ok(variants[2].size>2);
});
test('Shared drawer is exposed inline and inert only when closed in compact mode',()=>{const nodes=new Map(),media={matches:false,addEventListener(_,f){this.change=f}},c={window:{},matchMedia:()=>media};function node(id){if(!nodes.has(id)){const classes=new Set();nodes.set(id,{attrs:{},events:{},classList:{contains:k=>classes.has(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k)},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){this.events[k]=f},focus(){c.focused=id}})}return nodes.get(id)}const root={querySelector:node};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(base,'core/controls.js'),'utf8'),c);c.window.FretboardControls.bindDrawer({root,name:'routine'});const drawer=node('#routineDrawer'),btn=node('#routineMenuBtn');assert.equal(drawer.inert,false);assert.equal(drawer.attrs['aria-hidden'],'false');media.matches=true;media.change();assert.equal(drawer.inert,true);btn.events.click();assert.equal(drawer.inert,false);assert.equal(btn.attrs['aria-expanded'],'true');drawer.events.keydown({key:'Escape',preventDefault(){}});assert.equal(drawer.inert,true);assert.equal(c.focused,'#routineMenuBtn');media.matches=false;media.change();assert.equal(drawer.inert,false)});
class Node{
 constructor(){this.children=[];this.events={};this.attrs={};this.dataset={};this.style={};this.classes=new Set();this.classList={contains:k=>this.classes.has(k),toggle:(k,on)=>on?this.classes.add(k):this.classes.delete(k)};this.textContent='';this.hidden=false}
 append(...nodes){this.children.push(...nodes)}replaceChildren(){this.children=[]}querySelectorAll(){return this.children}querySelector(){return null}setAttribute(k,v){this.attrs[k]=v}addEventListener(k,f){this.events[k]=f}click(){this.events.click?.()}focus(){}scrollIntoView(){}
}
function sessionRuntime(demo=false,enabled=true){
 const c=runtime(),nodes=new Map(),root={querySelector:s=>{if(!nodes.has(s))nodes.set(s,new Node());return nodes.get(s)}};
 c.document={createElement:()=>new Node()};c.opens=0;
 const timers=new Map();let timerId=0;
 c.setTimeout=f=>{timers.set(++timerId,f);return timerId};c.clearTimeout=id=>timers.delete(id);c.performance={now:()=>1000};c.requestAnimationFrame=()=>1;c.cancelAnimationFrame=()=>{};
 c.micPreference={get enabled(){return enabled},setEnabled(value){enabled=value}};
 c.FretboardMicrophone={preference:()=>c.micPreference,create({onFrame,onState}){let state='off';c.audio={onFrame,start(){state='on';onState(state)},stop(){state='off';onState(state)},get state(){return state}};return c.audio}};
 c.window.matchMedia=()=>({matches:true});
 const flush=()=>{for(const [id,f] of timers){timers.delete(id);f()}};
 vm.runInContext(fs.readFileSync(path.join(base,'core/access.js'),'utf8'),c);
 c.window.FRETBOARD_ACCESS=c.window.FretboardAccess.create(!demo);c.window.FRETBOARD_PREMIUM={mark(){},open(){c.opens++}};
 c.RoutineRenderer={render:(_,exercise)=>{c.lastExercise=exercise}};
 vm.runInContext(fs.readFileSync(path.join(base,'core/routine-session.js'),'utf8'),c);
 const engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar),session=c.window.RoutineSession.create({root,engine,refreshControls(){},random:rng(321)});
 const nextGroup=()=>{nodes.get('#routineNext').click();flush()};
 return {session,nodes,c,flush,nextGroup,next(){const id=c.lastExercise.id;nextGroup();while(id==='triads'&&c.lastExercise.id==='triads')nextGroup()}};
}
test('Demo permits all five stages and Done, but blocks other roots and major without resetting progress',()=>{
 const r=sessionRuntime(true);r.session.enter();
 r.next();assert.equal(r.c.lastExercise.id,'scale');
 r.nodes.get('#routineRootControls').children.find(b=>b.dataset.value==='C').click();r.nodes.get('#routineQualityControls').children[0].click();
 assert.equal(r.c.opens,2);assert.equal(r.c.lastExercise.id,'scale');assert.equal(r.c.lastExercise.root,'A');assert.equal(r.c.lastExercise.quality,'minor');
 for(let i=1;i<5;i++){assert.equal(r.nodes.get('#routineNext').textContent,i===2?'Next strings →':i===4?'Done':'Next →');r.next()}
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
  for(const exercise of exercises){
   const svg=new Node();svg.parentElement={clientWidth:width};c.window.RoutineRenderer.render(svg,exercise,engine);
   assert.equal(Number(svg.attrs.viewBox.split(' ')[2]),width);
   const descendants=n=>n.children.flatMap(child=>[child,...descendants(child)]);
   const frets=descendants(svg).filter(n=>n.attrs['font-weight']===800&&n.textContent!=='×');assert.equal(frets.length,flatten(exercise).length);
   for(const n of frets){assert.ok(n.attrs.x-14>=0&&n.attrs.x+14<=width);assert.ok(n.attrs['font-size']>=18)}
   for(const a of frets)for(const b of frets)if(a!==b&&a.attrs.y===b.attrs.y)assert.ok(Math.abs(a.attrs.x-b.attrs.x)>=30);
   if(exercise.id==='root'&&width>=360)assert.ok(Number(svg.attrs.viewBox.split(' ')[3])<240,'root exercise fits one staff');
   assert.match(svg.children[0].textContent,/fret/);
  }
 }
});

test('Progress navigation reuses exercises and marks the active step',()=>{
 const r=sessionRuntime();r.session.enter();const first=r.c.lastExercise;
 r.nodes.get('#routineSteps').children[3].children[0].click();assert.equal(r.c.lastExercise.id,'chords');
 assert.equal(r.nodes.get('#routineSteps').children.filter(n=>n.classes.has('is-complete')).length,0);
 r.nodes.get('#routineSteps').children[0].children[0].click();assert.equal(r.c.lastExercise,first);
 assert.equal(r.nodes.get('#routineContext').hidden,true);
 assert.equal(r.nodes.get('#routineSteps').children[0].children[0].attrs['aria-current'],'step');
});

test('Skipping ahead does not complete unplayed routine stages',()=>{
 const r=sessionRuntime();r.session.enter();r.nodes.get('#routineSteps').children[4].children[0].click();
 assert.equal(r.nodes.get('#routineNext').textContent,'Next →');r.next();
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
 assert.equal(r.c.lastExercise.id,'scale');assert.equal(r.nodes.get('#routineTransition').hidden,true);
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

test('Holding one chord counts once; releasing and strumming again counts a new stroke',()=>{
 const {samples,spectrum,N}=require('./audio-fixtures.cjs'),r=sessionRuntime(true);r.session.enter();
 r.nodes.get('#routineSteps').children[3].children[0].click();
 const engine=r.c.FretboardEngine.createInstrumentEngine(r.c.FRETBOARD_INSTRUMENTS.guitar);
 const midi=col=>col.notes.map(n=>engine.midiAt(n.string,n.fret)),first=midi(r.c.lastExercise.columns[0]);
 const data=samples(first),frequencies=spectrum(first),silence=new Float32Array(N),empty=new Float32Array(N/2).fill(-Infinity);
 const frame=(now,quiet=false)=>r.c.audio.onFrame({samples:quiet?silence:data,spectrum:quiet?empty:frequencies,sampleRate:48000,fftSize:N,now});
 for(let now=1500;now<3100;now+=80)frame(now);
 assert.equal(r.nodes.get('#routineNoteProgress').textContent,'1 / 40');
 for(let now=3100;now<3420;now+=80)frame(now,true);
 for(let now=3420;now<3980;now+=80)frame(now);
 assert.equal(r.nodes.get('#routineNoteProgress').textContent,'2 / 40');
});

test('All guitar keys traverse GBE, DGB and ADG from the nut to fret 15, with same-string third liaisons',()=>{
 const c=runtime(),engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar);
 for(const root of c.MusicTheory.NOTES)for(const quality of ['major','minor']){
  const e=c.RoutineExercises.create({engine,root,quality,random:rng(4)})[2];
  assert.equal(e.sections.map(s=>s.set).join(','),'GBE,DGB,ADG');
  assert.equal(e.sections[0].start,0);assert.equal(e.sections.at(-1).end,e.columns.length);
  for(const section of e.sections){
   const cols=e.columns.slice(section.start,section.end),triads=cols.filter(c=>c.kind==='triad');
   assert.equal(cols.length,triads.length*2-1);assert.ok(triads.length>=3);
   assert.ok(Math.min(...triads[0].notes.map(n=>n.fret))<=4);
   assert.ok(Math.max(...triads.at(-1).notes.map(n=>n.fret))>=11);
   assert.equal(new Set(triads.map(c=>c.label)).size,3);
   cols.forEach((col,i)=>{
    assert.equal(col.kind,i%2?'third':'triad');
    assert.ok(col.notes.every(n=>section.strings.includes(n.string)&&n.string!==0&&n.fret<=15));
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
 assert.equal(e.sections.map(s=>e.columns.slice(s.start,s.end).filter(c=>c.kind==='triad').map(c=>c.forms.join('/')).join(',')).join('|'),'A,E,C/D,A|A/G,E,C,A/G|G,E,C,G');
 assert.ok(e.columns.filter(c=>c.kind==='third').every(c=>c.label==='Minor third — C'));
 for(const [root,third] of [['C#','E#'],['G#','B#'],['A#','C##'],['D#','F##']]){
  const e=c.RoutineExercises.create({engine,root,quality:'major'})[2];
  assert.ok(e.columns.filter(c=>c.kind==='third').every(c=>c.label==='Major third — '+third));
 }
});
test('Manual Next completes each string group in order and marks Triads complete only after the third group',()=>{
 const r=sessionRuntime(true,false);r.session.enter();r.nodes.get('#routineSteps').children[2].children[0].click();
 const groups=()=>r.nodes.get('#routineTriadGroups').children;
 for(let section=0;section<3;section++){
  assert.equal(r.c.lastExercise.strings.join(','),[[3,4,5],[2,3,4],[1,2,3]][section].join(','));
  assert.equal(groups()[section].attrs['aria-current'],'step');assert.equal(groups().filter(g=>g.classes.has('is-complete')).length,section);
  assert.equal(r.nodes.get('#routineSteps').children[2].classes.has('is-complete'),false);
  r.nodes.get('#routineNext').click();r.nodes.get('#routineNext').click();r.flush();
 }
 assert.equal(r.c.lastExercise.id,'chords');assert.equal(r.nodes.get('#routineSteps').children[2].classes.has('is-complete'),true);
 assert.equal(r.nodes.get('#routineTriadGroups').hidden,true);
 r.nodes.get('#routineSteps').children[2].children[0].click();assert.equal(r.c.lastExercise.strings.join(','),'3,4,5');
});
test('Cancelling a group transition preserves its group, and microphone toggling does not restart it',()=>{
 const r=sessionRuntime(true);r.session.enter();r.nodes.get('#routineSteps').children[2].children[0].click();r.nextGroup();
 assert.equal(r.c.lastExercise.strings.join(','),'2,3,4');
 r.nodes.get('#routineMic').click();r.nodes.get('#routineMic').click();assert.equal(r.c.lastExercise.strings.join(','),'2,3,4');
 r.nodes.get('#routineNext').click();r.nodes.get('#routineSteps').children[0].children[0].click();r.flush();
 assert.equal(r.c.lastExercise.id,'root');r.nodes.get('#routineSteps').children[2].children[0].click();
 assert.equal(r.c.lastExercise.strings.join(','),'2,3,4');
 r.nodes.get('#routineRootControls').children.find(b=>b.dataset.value==='A').click();
 r.session.leave();r.session.enter();r.nodes.get('#routineSteps').children[2].children[0].click();assert.equal(r.c.lastExercise.strings.join(','),'3,4,5');
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
  assert.equal(r.c.lastExercise.strings.join(','),[[3,4,5],[2,3,4],[1,2,3]][section].join(','));
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

test('Guitar strumming uses one low, compact chord and eight complete bars in every key',()=>{
 const c=runtime(),engine=c.FretboardEngine.createInstrumentEngine(c.FRETBOARD_INSTRUMENTS.guitar);
 for(const root of c.MusicTheory.NOTES)for(const quality of ['major','minor']){
  const e=c.RoutineExercises.create({engine,root,quality})[3],notes=e.columns[0].notes;
  assert.equal(e.strumming,true);assert.equal(e.columns.length,40);
  assert.ok(Math.max(...notes.map(n=>n.fret))<=5,root+' '+quality);
  assert.ok(notes.length>=3&&notes.length<=6);
  if(notes.length===3)assert.equal(notes.map(n=>n.string).join(','),'3,4,5');
  assert.ok(e.columns.every(col=>JSON.stringify(col.notes)===JSON.stringify(notes)));
  for(let bar=0;bar<8;bar++)assert.equal(e.columns.filter(c=>c.bar===bar).map(c=>c.beat).join(','),bar<4?'0,2,4,6':'0,2,3,4,6,7');
 }
 const am=c.RoutineExercises.create({engine,root:'A',quality:'minor'})[3];
 assert.equal(am.columns[0].notes.map(n=>`${n.string}:${n.fret}`).join(','),'1:0,2:2,3:2,4:1,5:0');
});

test('Manual strumming traverses eight bars; toggling mic and changing tempo preserve progress',()=>{
 const r=sessionRuntime(true,false);r.session.enter();r.nodes.get('#routineSteps').children[3].children[0].click();
 assert.equal(r.nodes.get('#routineStrumming').hidden,false);
 for(let bar=1;bar<=8;bar++){
  assert.equal(r.nodes.get('#routineStrumBar').textContent,`Bar ${bar} / 8`);
  assert.equal(r.nodes.get('#routineStrumPattern').children.filter(n=>n.attrs['aria-label']==='Upstroke').length,bar<=4?0:2);
  if(bar===3){
   r.nodes.get('#routineTempo').events.change({target:{value:'48'}});
   r.nodes.get('#routineMic').click();r.nodes.get('#routineMic').click();
   r.nodes.get('#routineSteps').children[0].children[0].click();r.nodes.get('#routineSteps').children[3].children[0].click();
   assert.equal(r.nodes.get('#routineStrumBar').textContent,'Bar 3 / 8');
  }
  r.nodes.get('#routineStrumNext').click();
 }
 assert.equal(r.nodes.get('#routineTransition').hidden,false);r.flush();
 assert.equal(r.c.lastExercise.id,'penta');assert.equal(r.nodes.get('#routineStrumming').hidden,true);
 r.nodes.get('#routineSteps').children[3].children[0].click();assert.equal(r.nodes.get('#routineStrumCount').textContent,'Strums: 0 / 40');
});

test('Strumming rejects wrong harmony and noise, completes exactly forty rearticulated chords',()=>{
 const {samples,spectrum,N}=require('./audio-fixtures.cjs'),r=sessionRuntime(true);r.session.enter();r.nodes.get('#routineSteps').children[3].children[0].click();
 const notes=[45,52,57,60,64],correct={samples:samples(notes,{gain:.02}),spectrum:spectrum(notes,{gain:.02})},wrong={samples:samples([45,52,57,61,64],{gain:.02}),spectrum:spectrum([45,52,57,61,64],{gain:.02})};
 const quiet={samples:new Float32Array(N),spectrum:new Float32Array(N/2).fill(-Infinity)};
 const noise={samples:samples([],{noise:.02}),spectrum:spectrum([],{noise:.02})};let now=1500;
 const play=(audio,frames)=>{for(let i=0;i<frames;i++,now+=80)r.c.audio.onFrame({...audio,sampleRate:48000,fftSize:N,now})};
 play(wrong,12);play(quiet,4);play(noise,12);play(quiet,4);
 assert.equal(r.nodes.get('#routineStrumCount').textContent,'Strums: 0 / 40');
 for(let stroke=1;stroke<=40;stroke++){
  play(correct,6);assert.equal(r.nodes.get('#routineStrumCount').textContent,`Strums: ${stroke} / 40`);
  play(correct,3);assert.equal(r.nodes.get('#routineStrumCount').textContent,`Strums: ${stroke} / 40`);
  if(stroke<40)assert.equal(r.nodes.get('#routineTransition').hidden,true);
  play(quiet,3);
 }
 r.flush();assert.equal(r.c.lastExercise.id,'penta');
});
