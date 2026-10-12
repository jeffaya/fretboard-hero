const {test}=require('node:test'),assert=require('node:assert/strict');
const {create,DEFAULT_TEMPO}=require('../core/routine-rhythm.js');
const columns=Array.from({length:32},(_,index)=>({bar:Math.floor(index/4),beat:index%4}));
test('The default is 48 BPM with three preparation beats',()=>{
 assert.equal(DEFAULT_TEMPO,48);const clock=create({columns});
 assert.equal(clock.snapshot(0).countIn,3);assert.equal(clock.snapshot(1250).countIn,2);assert.equal(clock.snapshot(2500).countIn,1);assert.equal(clock.snapshot(3750).position,0);
});
test('All seven signed timing zones are visible and the enlarged window accepts recognized chords',()=>{
 for(const [offset,grade,accepted] of [[-550,'Too early',false],[-350,'Early',true],[-200,'Good',true],[0,'Excellent',true],[200,'Good',true],[350,'Late',true],[550,'Too late',false]]){
  const clock=create({columns}),at=3750+offset;
  assert.equal(clock.attack(at).grade,grade);assert.equal(clock.targetAt(at),0);
  const result=clock.confirm(at,true,at+400);assert.equal(result.accepted,accepted);
  assert.equal(clock.snapshot(at+400).states[0],accepted?'played':'waiting');
 }
});
for(const tempo of [48,72,80])test(`At ${tempo} BPM silence and errors never rewind or stop the score`,()=>{
 const clock=create({columns,tempo}),beat=60000/tempo;
 for(let i=0;i<32;i++){
  const due=(i+3)*beat;
  if(i%3===0){clock.attack(due);clock.confirm(due,false,due+600)}
  clock.tick(due+beat/2);const s=clock.snapshot(due+beat/2);
  assert.equal(s.bar,Math.floor(i/4));assert.equal(s.next,i+1);assert.equal(s.countIn,0);
 }
 assert.equal(clock.tick(36*beat),true);assert.equal(clock.tick(37*beat),false);
 assert.equal(clock.snapshot(37*beat).states.filter(s=>s==='played').length,0);
});
test('A delayed chord confirmation remains bound to the onset across a bar/chord change',()=>{
 const clock=create({columns,tempo:80}),at=5250-100;
 assert.equal(clock.attack(at).index,4);clock.tick(5250);
 assert.equal(clock.targetAt(at),4);assert.equal(clock.confirm(at,true,at+400).accepted,true);
});
test('Pause, tempo changes and microphone toggles preserve phase and accepted strokes',()=>{
 const clock=create({columns});clock.attack(3750);clock.confirm(3750,true,4000);
 clock.pause(4300);const before=clock.snapshot(4300).position;
 assert.equal(clock.snapshot(20000).position,before);clock.resume(20000);assert.equal(clock.snapshot(20000).position,before);
 clock.setTempo(80,20000);assert.equal(clock.snapshot(20000).position,before);
 clock.setGuided(false,20000);assert.equal(clock.attack(20500),null);
 clock.setGuided(true,20500);assert.equal(clock.snapshot(20500).states[0],'played');
 assert.ok(clock.snapshot(20500).position>before);assert.equal(clock.snapshot(20500).countIn,0);
});
test('A stalled frame shifts the clock without replaying a beat or count-in',()=>{
 const clock=create({columns});const before=clock.snapshot(6000);
 clock.shift(9000);const after=clock.snapshot(15000);
 assert.equal(after.position,before.position);assert.equal(after.next,before.next);assert.equal(after.countIn,0);
});
test('Held or stale attacks cannot turn into extra credit; changing tempo clears pending recognition',()=>{
 const clock=create({columns});clock.attack(3750);assert.equal(clock.confirm(3750,true,4311).accepted,false);
 clock.attack(5000);clock.setTempo(80,5100);assert.equal(clock.confirm(5000,true,5300),null);
 clock.attack(5500);clock.confirm(5500,true,5800);assert.equal(clock.confirm(5500,true,5810),null);
});
test('Microphone-off practice does not fabricate successful strokes, including after re-entry',()=>{
 const clock=create({columns,guided:false,index:8});assert.equal(clock.attack(3750),null);
 assert.equal(clock.tick(50000),true);assert.equal(clock.snapshot(50000).states.filter(s=>s==='played').length,0);
 const resumed=create({columns,index:8,played:columns.map((_,i)=>i<4?'played':'waiting')});
 assert.equal(resumed.snapshot(0).states.filter(s=>s==='played').length,4);
});
