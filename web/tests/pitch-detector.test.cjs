const {test}=require('node:test'),assert=require('node:assert/strict');
const pitch=require('../core/pitch-detector.js');
for(const rate of [44100,48000])for(const midi of [28,33,38,40,43,45,50,55,59,60,64,67,69]){
 test(`open string MIDI ${midi} at ${rate} Hz with harmonics and detuning`,()=>{
  for(const detune of [-35,0,28]){
   const hz=pitch.frequency(midi)*2**(detune/1200);
   const data=Float32Array.from({length:8192},(_,i)=>.15*Math.sin(2*Math.PI*hz*i/rate)+.24*Math.sin(4*Math.PI*hz*i/rate)+.07*Math.sin(6*Math.PI*hz*i/rate));
   const result=pitch.detect(data,rate);assert.ok(result);assert.ok(Math.abs(1200*Math.log2(result/hz))<2,`${result} vs ${hz}`);
  }
 });
}
test('silence and low level input do not report a note',()=>{assert.equal(pitch.detect(new Float32Array(8192),48000),null);assert.equal(pitch.detect(Float32Array.from({length:8192},(_,i)=>.001*Math.sin(i)),48000),null)});
test('octaves stay distinct; reentrant ukulele picks G4',()=>{assert.equal(pitch.closest(pitch.frequency(64),[{midi:40},{midi:64}]),1);assert.equal(pitch.closest(pitch.frequency(67),[{midi:67},{midi:60},{midi:64},{midi:69}]),0)});
