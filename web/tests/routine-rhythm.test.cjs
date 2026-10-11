const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../core/routine-rhythm.js');
const columns=Array.from({length:32},(_,index)=>({bar:Math.floor(index/4),beat:index%4}));
for(const tempo of [48,72,80])test(`At ${tempo} BPM the same clock gates early/late attacks, delayed harmony and every bar`,()=>{
 const beat=60000/tempo,clock=create({columns,tempo});
 assert.equal(clock.snapshot(0).beat,-4);
 assert.equal(clock.targetAt(beat*4-181),-1);
 assert.equal(clock.targetAt(beat*4+181),-1);
 for(let i=0;i<32;i++){
  const due=(i+4)*beat,at=due+(i%2?170:-170);
  // The detector is deliberately slower than the timing tolerance.
  assert.equal(clock.hit(at,at+400),true,`stroke ${i}`);
  assert.equal(clock.hit(at,at+480),false,'one accepted attack per beat');
  if(i%4===3)assert.equal(clock.tick((i+5)*beat+.001),i===31?'complete':'bar');
 }
 assert.equal(clock.snapshot(40*beat).finished,true);
 assert.equal(clock.snapshot(40*beat).states.filter(s=>s==='played').length,32);
});
test('A missed beat does not freeze the measure; only that measure repeats after a four-beat count-in',()=>{
 const clock=create({columns,tempo:60});
 for(const at of [4000,5000,7000])assert.equal(clock.hit(at,at+300),true);
 assert.equal(clock.tick(7500),null);assert.equal(clock.snapshot(7500).bar,0);
 assert.equal(clock.tick(8000),'retry');assert.equal(clock.snapshot(8000).beat,-4);
 assert.equal(clock.targetAt(9000),-1);
 for(const at of [12000,13000,14000,15000])clock.hit(at,at+300);
 assert.equal(clock.tick(16000),'bar');assert.equal(clock.snapshot(16000).bar,1);
 assert.equal(clock.snapshot(16000).states.slice(0,4).join(','),'played,played,played,played');
});
test('Stale harmony, restarts and tempo changes cannot transfer credit into a new attempt',()=>{
 const clock=create({columns,tempo:60,bar:2});
 assert.equal(clock.hit(4000,4561),false);assert.equal(clock.hit(4000,4400),true);
 clock.restart(4600,80);assert.equal(clock.targetAt(4000),-1);
 assert.equal(clock.snapshot(4600).bar,2);assert.equal(clock.snapshot(4600).states[8],'waiting');
 assert.equal(clock.targetAt(7600),8);assert.equal(clock.hit(7600,7900),true);
});
test('Practice without a microphone follows the score without fabricated successful strokes',()=>{
 const clock=create({columns,tempo:60,guided:false});
 for(let bar=0;bar<8;bar++)assert.equal(clock.tick(8000+bar*4000),bar===7?'complete':'bar');
 assert.equal(clock.snapshot(40000).states.filter(state=>state==='played').length,0);
});
test('An early first attack remains assigned to its chord across a bar boundary',()=>{
 const clock=create({columns,tempo:80}),beat=750;
 for(let i=0;i<4;i++)clock.hit((i+4)*beat,(i+4)*beat+300);
 clock.tick(6000);
 assert.equal(clock.targetAt(5850),4);
 assert.equal(clock.hit(5850,6170),true);
 assert.equal(clock.snapshot(6170).states[4],'played');
});

test('Re-entering or enabling the microphone retains only actually validated past strokes',()=>{
 const unscored=create({columns,bar:3,guided:true,now:0});
 assert.equal(unscored.snapshot(0).states.filter(state=>state==='played').length,0);
 const played=columns.map((_,i)=>i<4?'played':'waiting');
 const resumed=create({columns,bar:3,guided:true,played,now:0});
 assert.equal(resumed.snapshot(0).states.filter(state=>state==='played').length,4);
});
