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
test('Reject missing chord tones, a wrong third, shifted bass octaves, extra wrong notes and a lone root with harmonics',()=>{
 for(const target of voicings)for(const played of [...new Set(target.map(m=>m%12))].map(pc=>target.filter(m=>m%12!==pc)).concat([target.map((x,i)=>i===1?x+1:x),[target[0]],target.map(x=>x+12),target.concat(target[0]+6)])){
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
  for(const played of [...new Set(target.map(m=>m%12))].map(pc=>target.filter(m=>m%12!==pc)).concat([target.map((m,i)=>i===1?m+1:m),[target[0]],target.concat(target[0]+6)]))assert.equal(detector.matches(detector.analyze(spectrum(played,options),rate,N),target),false,JSON.stringify({target,played}));
 }
});
test('Quiet held notes and varying room noise cannot repeat a completed target',()=>{
 const gate=createGate();gate.reset(true);
 for(let now=0;now<1600;now+=80)assert.equal(gate.update({match:true,level:.001+(now%160)*.000002,now}),false);
 for(let now=1600;now<3200;now+=80)assert.equal(gate.update({match:false,level:now%160?.002:.0006,now}),false);
});

test('Octave doubling is optional, while all chord tones and the displayed bass remain required',()=>{
 const target=[40,47,52,55,59,64];
 assert.ok(detector.matches(detector.analyze(spectrum([40,47,55]),48000,N),target));
 for(const played of [[40,47],[40,55],[47,55,64],[52,55,59],[40,47,56],[40,47,55,58]])assert.equal(detector.matches(detector.analyze(spectrum(played),48000,N),target),false,JSON.stringify(played));
});
test('A short chord requires three consecutive complete observations, not a single lucky frame',()=>{
 for(const interval of [80,160]){
  const gate=createGate();
  assert.equal(gate.update({match:true,level:.02,now:0,chord:true}),false);
  assert.equal(gate.update({match:true,level:.02,now:interval,chord:true}),false);
  assert.equal(gate.update({match:true,level:.02,now:interval*2,chord:true}),true);
 }
});
test('Strummed triads and chords tolerate plucking notches, unequal strings and decaying upper partials',()=>{
 for(const midis of [[45,60,64],[57,60,64],[40,47,52,56,59,64],[45,52,57,60,64]])for(const pluck of [.12,.22,.35,.48]){
  const gate=createGate(),onsets=midis.map((_,i)=>i*.025);let accepted=false;
  for(let now=400;now<=960;now+=80){
   const options={pluck,onsets,decay:1,partialDecay:.25,levels:[1,.6,.8,.7,.9,.6],noise:.0001,offset:Math.round(now/1000*48000)-N};
   const result=detector.analyze(spectrum(midis,options),48000,N);
   accepted=gate.update({match:detector.matches(result,midis),level:.02,now,chord:true})||accepted;
  }
  assert.ok(accepted,JSON.stringify({midis,pluck}));
 }
});
test('Single plucked strings with strong harmonics cannot impersonate a major or minor chord',()=>{
 for(const root of [40,45,48,52,57,60])for(const pluck of [.12,.22,.35,.48]){
  const result=detector.analyze(spectrum([root],{pluck,slope:.8}),48000,N);
  for(const third of [3,4])assert.equal(detector.matches(result,[root,root+7,root+12,root+12+third,root+19,root+24]),false,JSON.stringify({root,pluck,third,result}));
 }
});

for(const rate of [44100,48000])test(`An isolated liaison at ${rate} Hz tolerates guitar harmonics but rejects the surrounding triad`,()=>{
 for(const midi of [48,52,60,64,72,76])for(const pluck of [.12,.35]){
  const options={rate,gain:.015,pluck,second:1.6,noise:.00003};
  assert.ok(detector.matchesSingle(detector.analyze(spectrum([midi],options),rate,N),midi),`${midi} ${pluck}`);
  for(const notes of [[midi,midi+4,midi+9],[midi-4,midi,midi+3],[midi+1]])assert.equal(detector.matchesSingle(detector.analyze(spectrum(notes,options),rate,N),midi),false);
 }
});

test('Chord and triad recognition requires the written bass',()=>{
 const upper=detector.analyze(spectrum([57,60,64]),48000,N);
 assert.equal(detector.matches(upper,[45,52,57,60,64]),false);
 assert.equal(detector.matches(upper,[57,60,64]),true);
});

for(const rate of [44100,48000])test(`F#3 liaison remains recognizable over quiet ringing strings at ${rate} Hz`,()=>{
 const {samples,spectrumOf}=require('./audio-fixtures.cjs'),pitch=require('../core/pitch-detector.js');
 // D# minor on ADG: D#3/F#3/A#3, followed by F#3 on A string, fret 9.
 // The other two strings still resonate, 14 dB below the newly plucked third.
 for(const pluck of [.12,.22,.35])for(const detune of [-20,0,20]){
  const data=samples([54,51,58],{rate,pluck,detune,slope:.8,levels:[1,.2,.2],gain:.08,noise:.00003});
  const hz=pitch.detect(data.subarray(N-8192),rate,{maxFrequency:1500});
  assert.ok(hz&&Math.abs(pitch.cents(hz,54))<=38,'pitch must already be correct before the spectral veto');
  const result=detector.analyze(spectrumOf(data),rate,N);
  assert.ok(detector.matchesSingle(result,54),JSON.stringify({pluck,detune,result}));
 }
});

test('Liaison tolerance still rejects substantial competing tones, the wrong octave and incomplete evidence',()=>{
 for(const target of [48,54,60,66,72]){
  for(const notes of [[target-3,target,target+4],[target,target+4],[target-3,target],[target+1],[target-12],[target+12]]){
   const result=detector.analyze(spectrum(notes,{levels:[1,.55,.65],pluck:.22,slope:.8}),48000,N);
   assert.equal(detector.matchesSingle(result,target),false,JSON.stringify({target,notes,result}));
  }
 }
 assert.equal(detector.matchesSingle({fit:.5,notes:[{midi:54,strength:1}]},54),false);
 assert.equal(detector.matchesSingle({fit:.99,notes:[]},54),false);
});
