const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const echo=require('../core/routine-echo.js');
const {runtime,capture}=require('./echo-fixtures.cjs');
for(const rate of [44100,48000])for(const mute of [undefined,'palm','percussive'])test(`Known ${mute||'open'} speaker output is rejected at ${rate} Hz, including delay, gain and reflections`,async()=>{
 const r=runtime(rate);await r.audio.open();r.audio.schedule({division:1,slots:[{mute}]},{beatMs:750,position:0});
 const pcm=r.sources[0].buffer.getChannelData(0);
 for(const delay of [0,27.4,95,280])for(const reflection of [false,true]){
  const now=1000+delay+65;r.setTime(now);const reference=r.audio.reference(now);
  assert.equal(echo.isGuideOnly(capture(pcm,rate,{now,delay,reflection}),rate,reference),true,`${delay}ms reflection=${reflection}`);
 }
});
for(const rate of [44100,48000])test(`Real chords and muted guitar hits remain eligible on exactly the guide beat at ${rate} Hz`,async()=>{
 const r=runtime(rate);await r.audio.open();r.audio.schedule({division:1,slots:[{}]},{beatMs:750,position:0});
 const pcm=r.sources[0].buffer.getChannelData(0),reference=r.audio.reference(1125);
 for(const guitar of [.025,.08])for(const percussive of [false,true]){
  const samples=capture(pcm,rate,{now:1125,delay:60,guitar,percussive,reflection:true});
  assert.equal(echo.isGuideOnly(samples,rate,reference),false,`guitar=${guitar}, muted=${percussive}`);
 }
 assert.equal(echo.isGuideOnly(capture(pcm,rate,{now:1125,delay:60,gain:0,guitar:.02}),rate,reference),false);
 assert.equal(echo.isGuideOnly(capture(pcm,rate,{now:1125,guitar:.02}),rate,null),false);
});
test('Reference retains audible tails after pause but excludes future canceled strokes and expires',async()=>{
 const r=runtime();await r.audio.open();r.audio.schedule({division:1,slots:[{}]},{beatMs:750,position:0});
 const pcm=r.sources[0].buffer.getChannelData(0);r.setTime(1100);r.audio.close();
 assert.equal(echo.isGuideOnly(capture(pcm,48000,{now:1125,delay:60}),48000,r.audio.reference(1125)),true);
 assert.equal(r.audio.reference(2000),null);
 const other=runtime();await other.audio.open();other.audio.schedule({division:1,slots:[{}]},{beatMs:750,position:-.1});other.audio.close();
 assert.equal(other.audio.reference(1200),null);
});
