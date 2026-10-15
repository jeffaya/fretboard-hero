const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const rhythm=require('../core/routine-rhythm.js'),{defaults}=require('../core/routine-patterns.js');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
class Node{
 constructor(){this.children=[];this.events={};this.attrs={};this.dataset={};this.style={};this.classes=new Set();this.classList={contains:k=>this.classes.has(k),toggle:(k,on)=>on?this.classes.add(k):this.classes.delete(k)};this.textContent='';this.parentElement={clientWidth:900}}
 append(...children){this.children.push(...children)}replaceChildren(){this.children=[]}setAttribute(k,v){this.attrs[k]=v}getAttribute(k){return this.attrs[k]}addEventListener(k,f){this.events[k]=f}querySelector(){return null}
}
function runtime(open=async()=>true,playback=null){
 const nodes=new Map(),root={querySelector:s=>{if(!nodes.has(s))nodes.set(s,new Node());return nodes.get(s)}},events={},frames=new Map();let id=0,now=0,progress,completed=0,tuner=false;
 const scheduled=[],audio=playback||{open,close(){},stop(){},schedule(_,s){scheduled.push(s)}};
 const document={hidden:false,createElement:()=>new Node(),createElementNS:()=>new Node(),querySelector:()=>tuner,addEventListener:(name,f)=>events[name]=f};
 const c={window:{},document,RoutineRhythm:rhythm,RoutineEcho:require('../core/routine-echo.js'),RoutineRhythmAudio:{create:()=>audio},performance:{now:()=>now},requestAnimationFrame:f=>{frames.set(++id,f);return id},cancelAnimationFrame:id=>frames.delete(id)};
 vm.createContext(c);vm.runInContext(fs.readFileSync(require.resolve('../core/routine-strumming.js'),'utf8'),c);
 const exercise={strumming:true,patterns:defaults()},controller=c.window.RoutineStrumming.create({root,onProgress:(_,p)=>progress=p,onComplete:()=>completed++,onRepeat(){},onAudioReset(){}});
 controller.update(exercise,0,true);
 return {nodes,controller,exercise,audio,scheduled,document,events,get progress(){return progress},get completed(){return completed},setTime(t){now=t},setTuner(value){tuner=value},frame(t){now=t;for(const [id,f] of [...frames]){frames.delete(id);f(t)}},click(s){return nodes.get(s).events.click()}};
}
test('Listen shares the practice clock and accepts live grades; toggling sound preserves phase and hits',async()=>{
 const r=runtime();await settle();
 assert.equal(r.scheduled[0].position,0);assert.equal(r.scheduled[0].slot,0);
 assert.equal(r.progress.clock.snapshot(0).paused,false);
 assert.equal(r.nodes.get('#routineRhythmPreview').textContent,'Pause');
 r.controller.attack(0,0);assert.equal(r.nodes.get('#routineRhythmFeedback').hidden,false);
 assert.equal(r.nodes.get('#routineRhythmGrade').textContent,'Excellent');
 r.setTime(900);const before=r.progress.clock.snapshot(900).position;
 await r.click('#routineRhythmPreview');assert.equal(r.progress.clock.snapshot(900).position,before);
 assert.equal(r.nodes.get('#routineRhythmPreview').attrs['aria-pressed'],'false');
 r.controller.attack(750,900);r.setTime(1500);await r.click('#routineRhythmPreview');
 assert.equal(r.scheduled.at(-1).position,2);
 r.controller.attack(1500,1500);r.controller.attack(2250,2250);r.progress.clock.tick(3101);
 assert.equal(r.progress.clock.snapshot(3101).successes,1);
});
test('Listening alone keeps looping without awarding grades or repeats',async()=>{
 const r=runtime();await settle();
 for(let now=100;now<=20000;now+=100)r.frame(now);
 assert.ok(r.scheduled.length>100);assert.equal(r.progress.clock.snapshot(20000).successes,0);
 assert.equal(r.nodes.get('#routineRhythmFeedback').hidden,true);assert.equal(r.completed,0);
 assert.equal(r.progress.index,0);assert.equal(r.nodes.get('#routineRhythmPreview').textContent,'Pause');
});
test('Unavailable audio leaves practice running and shows the error',async()=>{
 const r=runtime(async()=>false);await settle();
 assert.equal(r.progress.clock.snapshot(0).paused,false);assert.equal(r.nodes.get('#routinePatternHelp').textContent,'Audio preview unavailable.');
 assert.equal(r.nodes.get('#routineRhythmPreview').textContent,'Listen');
});
test('A late preview opening after navigation cannot start playback',async()=>{
 let resolve;const r=runtime(()=>new Promise(done=>resolve=done));
 r.controller.stop();resolve(true);await settle();
 assert.equal(r.scheduled.length,0);assert.equal(r.progress.clock.snapshot(0).paused,true);
});
test('A browser waiting for a gesture leaves Listen usable and ignores the superseded opening',async()=>{
 let resolve;const r=runtime(()=>new Promise(done=>resolve=done));
 assert.ok(!r.nodes.get('#routineRhythmPreview').disabled);assert.equal(r.nodes.get('#routineRhythmPreview').textContent,'Listen');
 r.controller.attack(0,0);assert.equal(r.nodes.get('#routineRhythmFeedback').hidden,false);
 r.setTime(1500);
 r.audio.open=async()=>true;await r.click('#routineRhythmPreview');resolve(true);await settle();
 assert.equal(r.scheduled.length,1);assert.equal(r.scheduled[0].position,2);assert.equal(r.nodes.get('#routineRhythmPreview').textContent,'Pause');
});
test('Changing tempo during Listen keeps the example audible and preserves successful practice repeats',async()=>{
 const r=runtime();await settle();
 for(let i=0;i<4;i++)r.progress.clock.attack(i*750);r.progress.clock.tick(3101);r.setTime(3200);
 r.nodes.get('#routineTempo').events.change({target:{value:'120'}});
 assert.equal(r.progress.clock.snapshot(3200).successes,1);assert.equal(r.progress.clock.snapshot(3200).paused,false);assert.equal(r.progress.clock.snapshot(3200).beatMs,500);
 assert.equal(r.scheduled.at(-1).beatMs,500);assert.equal(r.scheduled.at(-1).position,r.progress.clock.snapshot(3200).position);assert.equal(r.nodes.get('#routineRhythmPreview').textContent,'Pause');
 await r.click('#routineRhythmPreview');assert.equal(r.progress.clock.snapshot(3200).paused,false);
});
test('Background and tuner stop the example; returning resumes only visual practice after the tuner closes',async()=>{
 const r=runtime();await settle();r.setTime(1000);r.setTuner(true);r.click('#routineTuner');
 r.document.hidden=true;r.events.visibilitychange();r.setTime(10000);r.document.hidden=false;r.events.visibilitychange();
 assert.equal(r.progress.clock.snapshot(10000).paused,true);
 r.setTuner(false);r.events.close({target:{classList:{contains:()=>true}}});
 assert.equal(r.progress.clock.snapshot(10000).paused,false);assert.equal(r.progress.clock.snapshot(10000).position,1000/750);
 assert.equal(r.nodes.get('#routineRhythmPreview').textContent,'Listen');
});
test('Redraws preserve playback and Pause; revisiting a practiced pattern does not restart its example',async()=>{
 let opens=0;const r=runtime(async()=>{opens++;return true});await settle();
 r.controller.update(r.exercise,0,false,r.progress);assert.equal(r.nodes.get('#routineRhythmPreview').textContent,'Pause');assert.equal(opens,1);
 await r.click('#routineRhythmPreview');r.controller.update(r.exercise,0,true,r.progress);r.controller.update(r.exercise,0,true,r.progress);
 assert.equal(r.nodes.get('#routineRhythmPreview').textContent,'Listen');assert.equal(opens,1);
 r.controller.stop();r.controller.update(r.exercise,0,true,r.progress);await settle();
 assert.equal(r.nodes.get('#routineRhythmPreview').textContent,'Listen');assert.equal(opens,1);assert.equal(r.progress.clock.snapshot(0).paused,false);
});
test('Three complete repeats played over Listen advance each pattern and finish the exercise',async()=>{
 const r=runtime();let now=0;
 for(let index=0;index<3;index++){
  await settle();assert.equal(r.nodes.get('#routineRhythmPreview').textContent,'Pause');
  const pattern=r.exercise.patterns[index],start=now;
  for(let repeat=0;repeat<3;repeat++){
   for(let slot=0;slot<pattern.slots.length;slot++){
    const at=start+(repeat*pattern.beats+slot/pattern.division)*750;
    while(now<at){now=Math.min(at,now+100);r.frame(now)}
    if(pattern.slots[slot])r.controller.attack(at,at);
   }
   const end=start+(repeat+1)*pattern.beats*750+101;
   while(now<end){now=Math.min(end,now+100);r.frame(now)}
   if(repeat<2){assert.equal(r.progress.index,index);assert.equal(r.nodes.get('#routineRepeatCount').textContent,`${repeat+1} / 3`)}
  }
  assert.equal(r.progress.index,index+1);
 }
 assert.equal(r.completed,1);
});


for(const guitar of [false,true])test(`Actual synthesized guide through microphone onset detection ${guitar?'accepts simultaneous guitar':'never earns repeats by itself'}`,async()=>{
 const {runtime:playbackRuntime}=require('./echo-fixtures.cjs'),playback=playbackRuntime(48000);playback.setTime(0);
 const r=runtime(async()=>true,playback.audio);await settle();
 const c={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../core/routine-guide.js'),'utf8'),c);const gate=c.window.RoutineGuide.createStrumGate();
 const rate=48000,track=new Float32Array(rate*11),window=new Float32Array(16384);let emitted=0,attacks=0;
 if(guitar)for(let stroke=0;stroke<16;stroke++){
  const start=Math.round((stroke*750+60)*rate/1000);
  for(let i=0;i<rate*.2&&start+i<track.length;i++){
   const t=i/rate;let value=0;for(const f of [110,164.81,220,261.63,329.63])value+=.035*Math.sin(2*Math.PI*f*t)*Math.exp(-t*14);
   track[start+i]+=value;
  }
 }
 for(let now=0;now<=9200;now+=20){
  playback.setTime(now);r.frame(now);
  while(emitted<playback.sources.length){
   const source=playback.sources[emitted++],pcm=source.buffer.getChannelData(0),start=Math.round((source.at+.060)*rate);
   for(let i=0;i<pcm.length&&start+i<track.length;i++)track[start+i]+=.6*pcm[i];
  }
  const end=Math.round(now*rate/1000);window.fill(0);const start=Math.max(0,end-window.length);window.set(track.subarray(start,end),Math.max(0,window.length-end));
  gate.update({samples:window,sampleRate:rate,now,refractory:r.controller.refractory,onAttack:at=>{attacks++;r.controller.captureAttack(at,now)}});
  r.controller.processInput({samples:window,sampleRate:rate,now});
  if(!guitar){assert.equal(r.nodes.get('#routineRhythmFeedback').hidden,true,`false grade at ${now}`);assert.equal(r.progress.clock.snapshot(now).successes,0)}
 }
 assert.ok(attacks>=10,`expected audible attacks, got ${attacks}`);assert.equal(r.progress.index,guitar?1:0);
});
