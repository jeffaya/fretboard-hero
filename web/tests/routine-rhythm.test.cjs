const {test}=require('node:test'),assert=require('node:assert/strict');
const {create,DEFAULT_TEMPO}=require('../core/routine-rhythm.js');
const {catalog,practice}=require('../core/routine-patterns.js');
const {createStrumGate}=require('../core/routine-guide.js');
const pulse=catalog[0];
test('Catalogue has ten fixed motifs, both user sixteenth patterns, muted strokes and eight-beat phrases',()=>{
 assert.equal(catalog.length,10);assert.equal(new Set(catalog.map(p=>p.id)).size,10);
 for(const p of catalog){assert.ok([4,8].includes(p.beats));assert.equal(p.slots.length,p.beats*p.division);for(let b=0;b<p.beats/4;b++)assert.ok(p.slots.slice(b*4*p.division,(b+1)*4*p.division).some(Boolean))}
 const notation=p=>p.slots.map(s=>!s?'-':s.direction==='up'?'U':'D').join('');
 assert.equal(notation(catalog[8]),'D-DUD-DUD-DUD-DU');assert.equal(notation(catalog[9]).slice(0,16),'D-DUDUD-D-D-D-DU');
 assert.ok(catalog.some(p=>p.slots.some(s=>s?.mute==='palm')));assert.ok(catalog.some(p=>p.slots.some(s=>s?.mute==='percussive')));
});
test('20 BPM and three visible preparation beats; all six timing labels use beat percentages',()=>{
 assert.equal(DEFAULT_TEMPO,20);const clock=create({pattern:pulse});assert.equal(clock.snapshot(0).countIn,3);assert.equal(clock.snapshot(3000).countIn,2);assert.equal(clock.snapshot(6000).countIn,1);
 for(const [fraction,grade,accepted] of [[-.25,'Too early',false],[-.16,'Early',true],[-.08,'Good',true],[0,'Excellent',true],[.08,'Good',true],[.16,'Late',true],[.25,'Too late',false]]){
  const c=create({pattern:pulse});const r=c.attack(12000+fraction*3000);assert.equal(r.grade,grade);assert.equal(r.accepted,accepted);
 }
});
for(const tempo of [20,48,80,120])for(const pattern of catalog)test(`${pattern.id} accepts three measures and completes the phrase at ${tempo} BPM`,()=>{
 const beat=60000/tempo,clock=create({pattern,tempo}),end=pattern.beats===8?16:12;
 for(let slot=0;slot<end*pattern.division;slot++){
  const p=slot/pattern.division,stroke=pattern.slots[slot%pattern.slots.length];
  if(stroke){const hit=clock.attack((3+p+.04)*beat);assert.equal(hit.accepted,true);assert.equal(hit.grade,'Excellent');assert.equal(clock.attack((3+p+.045)*beat).accepted,false)}
  clock.tick((3+p+.06)*beat);
 }
 assert.equal(clock.tick((3+end)*beat+101),true);assert.ok(clock.snapshot((3+end)*beat+101).successes>=3);assert.equal(clock.tick(1e9),false);
});
test('Successful measures accumulate through failures; silence and extra offbeat strokes do not auto-complete',()=>{
 const results=[],c=create({pattern:pulse,onBar:s=>results.push(s)}),beat=3000;
 for(let bar=0;bar<5;bar++){
  if(bar!==1&&bar!==3)for(let i=0;i<3;i++)c.attack((3+bar*4+i)*beat);
  c.tick((3+(bar+1)*4)*beat+101);
 }
 assert.deepEqual(results,[true,false,true,false,true]);assert.equal(c.snapshot(70000).finished,true);
 const silent=create({pattern:pulse});silent.tick(100000);assert.equal(silent.snapshot(100000).successes,0);assert.equal(silent.snapshot(100000).finished,false);
 const busy=create({pattern:pulse});for(let i=0;i<32;i++)busy.attack((3+i/2)*beat);busy.tick(20*beat);assert.equal(busy.snapshot(20*beat).successes,0);
});
test('Pause, tempo, microphone changes and stalled frames preserve phase and completed measures',()=>{
 const c=create({pattern:pulse});for(let i=0;i<4;i++)c.attack((3+i)*3000);c.tick(21101);const before=c.snapshot(22000).position;
 c.pause(22000);assert.equal(c.snapshot(55000).position,before);c.setTempo(80,55000);c.resume(60000);assert.equal(c.snapshot(60000).position,before);
 c.shift(9000);assert.equal(c.snapshot(69000).position,before);c.setGuided(false,69000);assert.equal(c.attack(70000),null);assert.equal(c.snapshot(70000).successes,1);
 c.setGuided(true,70500);assert.equal(c.snapshot(70500).successes,1);
});
test('Practice repeats motifs, covers all ten, reviews difficulties and persists despite unavailable storage',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};let p=practice(storage);const first=p.choose().map(p=>p.id);assert.deepEqual(p.choose().map(p=>p.id),first);
 const seen=new Set(first);for(let i=0;i<20;i++){p=practice(storage);for(const chosen of p.choose()){seen.add(chosen.id);p.record(chosen.id,chosen.id!=='pop')}}assert.equal(seen.size,10);
 const blocked=practice({getItem(){throw Error()},setItem(){throw Error()}});assert.equal(blocked.choose().length,3);assert.doesNotThrow(()=>blocked.record('pulse',true));
});
for(const rate of [44100,48000])test(`Onset detector recognizes fast pitchless muted strums without double-counting sustain (${rate} Hz)`,()=>{
 const hits=[],gate=createStrumGate(),tempo=120,pattern=catalog[9],clock=create({pattern,tempo}),beat=60000/tempo,duration=12,buffer=new Float32Array(Math.ceil(rate*duration));
 let seed=123;const noise=()=>{seed=(seed*16807)%2147483647;return seed/2147483647*2-1};
 const times=[];
 for(let slot=0;slot<64;slot++){if(!pattern.slots[slot%pattern.slots.length])continue;const at=(3+slot/4)*beat;times.push(at);const start=Math.round(at*rate/1000);for(let j=0;j<rate*.08;j++)buffer[start+j]+=noise()*.025*Math.exp(-j/(rate*.018))}
 for(let now=20;now<11500;now+=20){const samples=new Float32Array(16384),end=Math.round(now*rate/1000),start=Math.max(0,end-samples.length);samples.set(buffer.subarray(start,end),samples.length-(end-start));gate.update({samples,sampleRate:rate,now,refractory:clock.refractory,onAttack:at=>hits.push(at)})}
 assert.equal(hits.length,times.length);for(let i=0;i<hits.length;i++)assert.ok(Math.abs(hits[i]-times[i])<=12,`${hits[i]} vs ${times[i]}`);
 const held=createStrumGate(),sustained=[];for(let now=20;now<2000;now+=20){const data=new Float32Array(16384);for(let j=0;j<data.length;j++)data[j]=.02*Math.sin(2*Math.PI*110*(now/1000-(data.length-j)/rate));held.update({samples:data,sampleRate:rate,now,onAttack:at=>sustained.push(at)})}assert.equal(sustained.length,1);
});
