const {test}=require('node:test'),assert=require('node:assert/strict');
const {spectrum,N}=require('./audio-fixtures.cjs');
const detector=require('../core/chord-detector.js').create({minMidi:28,maxMidi:84});
const {sequence,createGate}=require('../core/routine-guide.js');
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
test('Scale, pentatonic and bass arpeggios return without playing the summit twice',()=>{
 const columns=Array.from({length:4},()=>({notes:[{}]}));
 for(const id of ['scale','penta','chords'])assert.deepEqual(sequence({id,columns}),[0,1,2,3,2,1,0]);
 for(const id of ['root','triads'])assert.deepEqual(sequence({id,columns}),[0,1,2,3]);
 assert.deepEqual(sequence({id:'chords',columns:columns.map(()=>({notes:[{},{}]}))}),[0,1,2,3]);
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
 const gate=createGate();gate.reset(true);
 for(let now=0;now<800;now+=80)assert.equal(gate.update({match:true,level:.03,now}),false);
 let hits=0;for(let now=800;now<1600;now+=80)if(gate.update({match:true,level:.12,now}))hits++;
 assert.equal(hits,1);
});
