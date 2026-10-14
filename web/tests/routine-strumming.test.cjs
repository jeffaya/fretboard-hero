const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const rhythm=require('../core/routine-rhythm.js'),{defaults}=require('../core/routine-patterns.js');
class Node{
 constructor(){this.children=[];this.events={};this.attrs={};this.dataset={};this.style={};this.classes=new Set();this.classList={contains:k=>this.classes.has(k),toggle:(k,on)=>on?this.classes.add(k):this.classes.delete(k)};this.textContent='';this.parentElement={clientWidth:900}}
 append(...children){this.children.push(...children)}replaceChildren(){this.children=[]}setAttribute(k,v){this.attrs[k]=v}getAttribute(k){return this.attrs[k]}addEventListener(k,f){this.events[k]=f}querySelector(){return null}
}
function runtime(){
 const nodes=new Map(),root={querySelector:s=>{if(!nodes.has(s))nodes.set(s,new Node());return nodes.get(s)}},events={},frames=new Map();let id=0,now=0,progress,completed=0,tuner=false;
 const scheduled=[],audio={open:async()=>true,close(){},stop(){},schedule(_,s){scheduled.push(s)}};
 const document={hidden:false,createElement:()=>new Node(),createElementNS:()=>new Node(),querySelector:()=>tuner,addEventListener:(name,f)=>events[name]=f};
 const c={window:{},document,RoutineRhythm:rhythm,RoutineRhythmAudio:{create:()=>audio},performance:{now:()=>now},requestAnimationFrame:f=>{frames.set(++id,f);return id},cancelAnimationFrame:id=>frames.delete(id)};
 vm.createContext(c);vm.runInContext(fs.readFileSync(require.resolve('../core/routine-strumming.js'),'utf8'),c);
 const exercise={strumming:true,patterns:defaults()},controller=c.window.RoutineStrumming.create({root,onProgress:(_,p)=>progress=p,onComplete:()=>completed++,onRepeat(){},onAudioReset(){}});
 controller.update(exercise,0,true);
 return {nodes,controller,exercise,audio,scheduled,document,events,get progress(){return progress},get completed(){return completed},setTime(t){now=t},setTuner(value){tuner=value},frame(t){now=t;for(const [id,f] of [...frames]){frames.delete(id);f(t)}},click(s){return nodes.get(s).events.click()}};
}
test('Listen schedules its first stroke immediately, suspends scoring and resumes the same practice phase when stopped',async()=>{
 const r=runtime();r.setTime(1500);const before=r.progress.clock.snapshot(1500).position;
 await r.click('#routineRhythmPreview');assert.equal(r.scheduled[0].position,0);assert.equal(r.scheduled[0].slot,0);assert.equal(r.progress.clock.snapshot(1500).paused,true);
 r.controller.attack(1500,1500);assert.equal(r.nodes.get('#routineRhythmFeedback').hidden,true);
 r.setTime(9000);await r.click('#routineRhythmPreview');assert.equal(r.progress.clock.snapshot(9000).paused,false);assert.equal(r.progress.clock.snapshot(9000).position,before);
 assert.equal(r.nodes.get('#routineRhythmPreview').attrs['aria-pressed'],'false');
});
test('Unavailable audio leaves practice running and shows the error',async()=>{
 const r=runtime();r.audio.open=async()=>false;await r.click('#routineRhythmPreview');
 assert.equal(r.progress.clock.snapshot(0).paused,false);assert.equal(r.nodes.get('#routinePatternHelp').textContent,'Audio preview unavailable.');
});
test('A late preview opening after navigation cannot start playback',async()=>{
 const r=runtime();let resolve;r.audio.open=()=>new Promise(done=>resolve=done);
 const opening=r.click('#routineRhythmPreview');assert.equal(r.nodes.get('#routineRhythmPreview').disabled,true);
 r.controller.next();resolve(true);await opening;
 assert.equal(r.progress.index,1);assert.equal(r.scheduled.length,0);assert.equal(r.progress.clock.snapshot(0).paused,false);
});
test('Changing tempo during Listen resumes practice without losing successful repeats',async()=>{
 const r=runtime();for(let i=0;i<4;i++)r.progress.clock.attack(i*750);r.progress.clock.tick(3101);r.setTime(3200);
 await r.click('#routineRhythmPreview');r.nodes.get('#routineTempo').events.change({target:{value:'120'}});
 assert.equal(r.progress.clock.snapshot(3200).successes,1);assert.equal(r.progress.clock.snapshot(3200).paused,false);assert.equal(r.progress.clock.snapshot(3200).beatMs,500);
});
test('Background and tuner suspend rhythm; returning resumes it only after the tuner closes',()=>{
 const r=runtime();r.setTime(1000);r.setTuner(true);r.click('#routineTuner');
 r.document.hidden=true;r.events.visibilitychange();r.setTime(10000);r.document.hidden=false;r.events.visibilitychange();
 assert.equal(r.progress.clock.snapshot(10000).paused,true);
 r.setTuner(false);r.events.close({target:{classList:{contains:()=>true}}});
 assert.equal(r.progress.clock.snapshot(10000).paused,false);assert.equal(r.progress.clock.snapshot(10000).position,1000/750);
});
test('Three complete played repeats update the indicator, advance each pattern and finish the exercise',()=>{
 const r=runtime();let now=0;
 for(let index=0;index<3;index++){
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
