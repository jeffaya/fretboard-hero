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
 const gate=createStrumGate(),samples=Float32Array.from({length:16384},(_,i)=>.02*Math.sin(2*Math.PI*110*i/48000));let count=0;
 for(const now of [80,160,240,320,400,800,880,960,1040,1120])gate.update({samples,sampleRate:48000,now,onAttack:()=>count++});assert.equal(count,0);
});
test('A fresh attack reports the original onset after a short confirmation, without harmony analysis',()=>{
 const rate=48000,attacks=capture(signal(rate,[.5]),rate);
 assert.equal(attacks.length,1);assert.ok(Math.abs(attacks[0].at-500)<=10);
 assert.ok(attacks[0].delivered-500<=40);
});

function capture(data,rate,{resetAt=[],startAt=20}={}){
 const gate=createStrumGate(),attacks=[];
 for(let now=startAt;now<data.length/rate*1000;now+=20){
  if(resetAt.includes(now))gate.reset();
  const end=Math.round(now*rate/1000),samples=new Float32Array(16384),start=Math.max(0,end-samples.length);
  samples.set(data.subarray(start,end),samples.length-(end-start));
  gate.update({samples,sampleRate:rate,now,onAttack:at=>attacks.push({at,delivered:now})});
 }
 return attacks;
}
function roomNoise(rate,seconds,gain=.003){
 let seed=19;return Float32Array.from({length:rate*seconds},(_,i)=>{
  seed=(seed*16807)%2147483647;const t=i/rate;
  return .004+gain*(1+.3*Math.sin(t*2.7)+.15*Math.sin(t*17))*(seed/2147483647*2-1)+gain*.3*Math.sin(2*Math.PI*50*t);
 });
}
for(const rate of [44100,48000])test(`Room noise, microphone offset and repeated resets never produce practice attacks (${rate} Hz)`,()=>{
 for(const gain of [.0008,.003,.02])assert.deepEqual(capture(roomNoise(rate,8,gain),rate,{resetAt:[800,1600,2400,4000,6000]}),[],'noise gain '+gain);
});
test('Isolated electrical clicks and a slowly rising noise floor do not count as strums',()=>{
 const rate=48000,data=roomNoise(rate,5,.001);
 for(let i=0;i<data.length;i++)data[i]*=1+i/data.length*3;
 for(const time of [.8,1.5,2.1,3.2,4])data[Math.round(time*rate)]+=.5;
 assert.deepEqual(capture(data,rate),[]);
});
for(const rate of [44100,48000])test(`Quiet rearticulated guitar attacks remain detectable over room noise (${rate} Hz)`,()=>{
 const onsets=[.6,1.35,2.1,2.85],data=signal(rate,onsets,.001),noise=roomNoise(rate,4,.00015);
 for(let i=0;i<data.length;i++)data[i]+=noise[i];
 const attacks=capture(data,rate);assert.equal(attacks.length,onsets.length);
 attacks.forEach((hit,i)=>assert.ok(Math.abs(hit.at-onsets[i]*1000)<=20));
});

test('Resuming during a ringing sound ignores its tail but still accepts the next fresh attack',()=>{
 const rate=48000,attacks=capture(signal(rate,[.3,1.5]),rate,{startAt:400});
 assert.equal(attacks.length,1);assert.ok(Math.abs(attacks[0].at-1500)<=20);
});
