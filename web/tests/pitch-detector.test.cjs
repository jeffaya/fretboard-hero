const {test}=require('node:test'),assert=require('node:assert/strict');
const pitch=require('../core/pitch-detector.js');
const {samples}=require('./audio-fixtures.cjs');
for(const rate of [44100,48000])for(const midi of [28,33,38,40,43,45,50,55,59,60,64,67,69]){
 test(`open string MIDI ${midi} at ${rate} Hz with harmonics and detuning`,()=>{
  for(const detune of [-35,0,28]){
   const hz=pitch.frequency(midi)*2**(detune/1200);
   const data=Float32Array.from({length:8192},(_,i)=>.15*Math.sin(2*Math.PI*hz*i/rate)+.24*Math.sin(4*Math.PI*hz*i/rate)+.07*Math.sin(6*Math.PI*hz*i/rate));
   const result=pitch.detect(data,rate);assert.ok(result);assert.ok(Math.abs(1200*Math.log2(result/hz))<2,`${result} vs ${hz}`);
  }
 });
}
test('Silence, DC offset and notes below the input floor do not report a pitch',()=>{
 for(const data of [new Float32Array(8192),new Float32Array(8192).fill(.1),samples([57],{gain:.001,length:8192})])assert.equal(pitch.detect(data,48000),null);
});
for(const rate of [44100,48000])test(`Quiet fingerstyle notes retain their pitch at ${rate} Hz`,()=>{
 for(const midi of [28,33,40,45,52,57,60,64,69,76,84])for(const second of [1,2.2]){
  const data=samples([midi],{rate,gain:.015,decay:3,noise:.00015,second,length:8192});
  const level=Math.sqrt(data.reduce((sum,x)=>sum+x*x,0)/data.length);
  assert.ok(level<.004,'fixture must be below the old cutoff');
  const hz=pitch.detect(data,rate,{maxFrequency:1500});
  assert.ok(hz&&Math.abs(pitch.cents(hz,midi))<8,`${midi}: ${hz}`);
 }
});
test('Broadband noise, rumble and isolated taps do not report a note at the lower floor',()=>{
 for(const noise of [.0003,.002,.02]){
  const data=samples([],{noise,length:8192});assert.equal(pitch.detect(data,48000),null);
  let filtered=0;const rumble=Float32Array.from(data,x=>filtered=.97*filtered+.03*x);
  assert.equal(pitch.detect(rumble,48000),null);
 }
 const tap=new Float32Array(8192);tap[4096]=.3;assert.equal(pitch.detect(tap,48000),null);
});
test('octaves stay distinct; reentrant ukulele picks G4',()=>{assert.equal(pitch.closest(pitch.frequency(64),[{midi:40},{midi:64}]),1);assert.equal(pitch.closest(pitch.frequency(67),[{midi:67},{midi:60},{midi:64},{midi:69}]),0)});
test('Guided practice reaches the high ukulele frets without folding the octave',()=>{
 for(const rate of [44100,48000])for(let midi=70;midi<=84;midi++){
  const hz=pitch.frequency(midi),samples=Float32Array.from({length:8192},(_,i)=>.12*Math.sin(2*Math.PI*hz*i/rate)+.08*Math.sin(4*Math.PI*hz*i/rate));
  const result=pitch.detect(samples,rate,{maxFrequency:1500});assert.ok(result);assert.ok(Math.abs(pitch.cents(result,midi))<8,`${midi}: ${result}`);
 }
});
