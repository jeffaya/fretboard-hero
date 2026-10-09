const {test}=require('node:test'),assert=require('node:assert/strict');
const {spectrum,N}=require('./audio-fixtures.cjs');
const detector=require('../core/chord-detector.js').create({minMidi:28,maxMidi:84});
const {createGate}=require('../core/routine-guide.js');
const voicings=[[40,47,52,55,59,64],[45,52,57,60,64],[57,60,64],[28,31,35],[67,60,64,69]];
for(const rate of [44100,48000])test(`Simultaneous voicings at ${rate} Hz tolerate timbre, detuning, unequal strings and noise`,()=>{
 for(const detune of [-25,0,25])for(const second of [1,2.2])for(const midis of voicings){
  const result=detector.analyze(spectrum(midis,{rate,detune,second,levels:[1,.7,.9,.8,1,.6],noise:.003}),rate,N);
  assert.ok(detector.matches(result,midis),JSON.stringify({midis,detune,second,result}));
 }
});
test('Reject incomplete chords, a wrong third, octaves, extra wrong notes and a lone root with harmonics',()=>{
 for(const target of voicings)for(const played of [target.slice(0,-1),target.map((x,i)=>i===1?x+1:x),[target[0]],target.map(x=>x+12),target.concat(target[0]+6)]){
  const result=detector.analyze(spectrum(played),48000,N);assert.equal(detector.matches(result,target),false,JSON.stringify({target,played,result}));
 }
});
test('Silence, room noise and a sequential arpeggio never validate a simultaneous triad',()=>{
 const target=[57,60,64];
 for(const input of [new Float32Array(N/2).fill(-Infinity),spectrum([],{noise:.04}),...target.map(midi=>spectrum([midi]))])assert.equal(detector.matches(detector.analyze(input,48000,N),target),false);
});
test('A duplicate unison cannot be distinguished acoustically and is validated once',()=>{
 const notes=[60,64,67];assert.equal(detector.matches(detector.analyze(spectrum(notes),48000,N),[60,64,67,60]),true);
});
test('Transient matches and alternating wrong notes never accumulate into a success',()=>{
 const gate=createGate();for(let now=0;now<2000;now+=80)assert.equal(gate.update({match:now%160===0,level:.1,now}),false);
 gate.reset();assert.equal(gate.update({match:true,level:.1,now:0}),false);assert.equal(gate.update({match:true,level:.1,now:320}),false);
});
test('Single notes and chords need sustained evidence, and held notes never repeat',()=>{
 for(const chord of [false,true]){
  const gate=createGate();let hits=0;for(let now=0;now<2400;now+=80)if(gate.update({match:true,level:.1,now,chord}))hits++;
  assert.equal(hits,1);
  for(let now=2400;now<2720;now+=80)gate.update({match:false,level:0,now,chord});
  for(let now=2720;now<4000;now+=80)if(gate.update({match:true,level:.1,now,chord}))hits++;
  assert.equal(hits,2);
 }
});
test('A new attack can rearticulate a repeated pitch without complete silence',()=>{
 for(const level of [.03,.0006]){
  const gate=createGate();gate.reset(true);
  for(let now=0;now<800;now+=80)assert.equal(gate.update({match:true,level,now}),false);
  let hits=0;for(let now=800;now<1600;now+=80)if(gate.update({match:true,level:level*4,now}))hits++;
  assert.equal(hits,1);
 }
});
for(const rate of [44100,48000])test(`Quiet simultaneous voicings at ${rate} Hz remain distinguishable from wrong chords`,()=>{
 for(const target of voicings){
  const options={rate,gain:.01,noise:.0001,decay:1.5,levels:[1,.7,.9,.8,1,.6]};
  assert.ok(detector.matches(detector.analyze(spectrum(target,options),rate,N),target),JSON.stringify(target));
  for(const played of [target.slice(0,-1),target.map((m,i)=>i===1?m+1:m),[target[0]],target.concat(target[0]+6)])assert.equal(detector.matches(detector.analyze(spectrum(played,options),rate,N),target),false,JSON.stringify({target,played}));
 }
});
test('Quiet held notes and varying room noise cannot repeat a completed target',()=>{
 const gate=createGate();gate.reset(true);
 for(let now=0;now<1600;now+=80)assert.equal(gate.update({match:true,level:.001+(now%160)*.000002,now}),false);
 for(let now=1600;now<3200;now+=80)assert.equal(gate.update({match:false,level:now%160?.002:.0006,now}),false);
});
