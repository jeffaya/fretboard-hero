const {test}=require('node:test'),assert=require('node:assert/strict');
const {createStrumGate}=require('../core/routine-guide.js');
// A continuously ringing harmonic chord is rearticulated, with no silence
// between strokes. Moving windows reproduce the live overlapping PCM input.
function signal(rate,onsets,gain=.02){
 const length=Math.ceil((onsets.at(-1)+1)*rate),data=new Float32Array(length),pitches=[45,52,57,60,64];
 for(let i=0,stroke=-1;i<length;i++){
  const time=i/rate;while(stroke+1<onsets.length&&onsets[stroke+1]<=time)stroke++;
  if(stroke<0)continue;
  const age=time-onsets[stroke],envelope=Math.min(age/.008,1)*Math.exp(-age*3.5)*gain;
  for(const [j,midi] of pitches.entries())for(let h=1;h<=4;h++)data[i]+=envelope*Math.sin(2*Math.PI*440*2**((midi-69)/12)*h*time+j)/h**1.2;
 }
 return data;
}
for(const rate of [44100,48000])for(const bpm of [20,80,120])test(`Repeated ringing strums count once each at ${bpm} BPM and ${rate} Hz`,()=>{
 const onsets=[.3];for(let i=1;i<12;i++)onsets.push(onsets.at(-1)+60/bpm/(i<4?1:2));
 for(const gain of [.02,.001]){
  const data=signal(rate,onsets,gain),gate=createStrumGate();let accepted=0;
  for(let now=20;now<data.length/rate*1000;now+=20){
   const end=Math.round(now*rate/1000),samples=new Float32Array(16384),start=Math.max(0,end-samples.length);
   samples.set(data.subarray(start,end),samples.length-(end-start));
   gate.update({samples,sampleRate:rate,now,onAttack:()=>accepted++});
  }
  assert.equal(accepted,onsets.length,'gain '+gain);
 }
});
test('A sustained chord and silence do not produce repeated attacks',()=>{
 const rate=48000,data=signal(rate,[.3]),gate=createStrumGate();let accepted=0;
 for(let now=20;now<data.length/rate*1000;now+=20){const end=Math.round(now*rate/1000),samples=new Float32Array(16384),start=Math.max(0,end-samples.length);samples.set(data.subarray(start,end),samples.length-(end-start));gate.update({samples,sampleRate:rate,now,onAttack:()=>accepted++})}
 assert.equal(accepted,1);
});
test('A delayed analysis frame does not turn a held chord into a fresh attack',()=>{
 const gate=createStrumGate(),samples=new Float32Array(16384).fill(.02);let count=0;
 for(const now of [80,160,240,320,400,800,880,960,1040,1120])gate.update({samples,sampleRate:48000,now,onAttack:()=>count++});assert.equal(count,1);
});
test('Attack feedback is immediate and uses the sample onset, without harmony confirmation',()=>{
 const gate=createStrumGate(),samples=new Float32Array(16384).fill(.02),attacks=[];
 gate.update({samples,sampleRate:48000,now:1000,onAttack:at=>attacks.push(at)});assert.equal(attacks.length,1);assert.ok(attacks[0]>=980&&attacks[0]<=1000);
});
