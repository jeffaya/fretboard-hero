const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function runtime(){
  const c={window:{}};vm.runInNewContext(fs.readFileSync('web/core/routine-encouragement.js','utf8'),c);
  return c.window.RoutineEncouragement;
}
function rng(seed){return()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296)}
test('Every shuffled deck shows all ten messages once, with no duplicate across deck boundaries',()=>{
  const {messages,createDeck}=runtime(),orders=new Set();
  assert.equal(messages.length,10);assert.equal(new Set(messages.map(m=>m.text)).size,10);
  for(let seed=1;seed<=25;seed++){
    const deck=createDeck(rng(seed));let previous;
    for(let round=0;round<3;round++){
      const shown=[];
      for(let i=0;i<10;i++){
        const message=deck.next();assert.ok(messages.includes(message));assert.notEqual(message,previous);
        shown.push(message.text);previous=message;
      }
      assert.equal(new Set(shown).size,10);orders.add(shown.join('|'));
    }
  }
  assert.ok(orders.size>1,'Sessions should not all have the same message order');
});
test('Reset starts a fresh deck and sessions do not share consumption state',()=>{
  const {messages,createDeck}=runtime(),first=createDeck(()=>.999),second=createDeck(()=>.999);
  assert.equal(first.next(),messages[0]);assert.equal(first.next(),messages[1]);
  assert.equal(second.next(),messages[0]);
  first.reset();assert.equal(first.next(),messages[0]);
  assert.equal(new Set(Array.from({length:9},()=>first.next())).size,9);
});
