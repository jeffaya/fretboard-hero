const {test}=require('node:test'),assert=require('node:assert/strict');
const c=require('../core/chord-library.js');
test('Every root and quality has at least two distinct playable voicings on guitar and ukulele',()=>{
 for(const instrument of ['guitar','ukulele'])for(let root=0;root<12;root++)for(const [quality,spec] of Object.entries(c.qualities)){
  const shapes=c.voicings(instrument,root,quality);assert.ok(shapes.length>=2,`${instrument} ${root} ${quality}`);
  for(const v of shapes){
   assert.equal(v.frets.length,c.tunings[instrument].length);assert.equal(v.fingers.length,v.frets.length);
   const actual=[...new Set(v.frets.flatMap((f,i)=>f<0?[]:[(c.tunings[instrument][i]+f-root+120)%12]))];
   for(const note of actual)assert.ok(spec.intervals.includes(note),`${instrument} ${root} ${quality}: unexpected interval ${note}`);
   // A conventional open C7 omits the fifth; the root, third and seventh remain.
   for(const note of spec.intervals.filter(n=>!(instrument==='guitar'&&root===0&&quality==='7'&&v.shape===''&&n===7)))assert.ok(actual.includes(note),`${instrument} ${root} ${quality}: missing interval ${note}`);
   const positive=v.frets.filter(f=>f>0);assert.ok(Math.max(...positive)-Math.min(...positive)<=4);
   v.frets.forEach((f,i)=>{assert.ok(Number.isInteger(f)&&f>=-1&&f<=16);assert.ok(f<=0?v.fingers[i]===0:v.fingers[i]>=1&&v.fingers[i]<=4)});
   for(const b of v.barres){assert.ok(b.from<b.to);for(let i=b.from;i<=b.to;i++)assert.ok(v.frets[i]>=b.fret);}
  }
 }
});
test('G has the requested open alternatives and E/A barre positions',()=>{
 assert.deepEqual(c.voicings('guitar',7,'major').map(v=>v.frets),[[3,2,0,0,0,3],[3,2,0,0,3,3],[3,5,5,4,3,3],[-1,10,12,12,12,10]]);
});
test('Chord spelling preserves thirds, sevenths and extensions, including enharmonic roots',()=>{
 assert.deepEqual(c.notes(1,'major'),['C♯','E♯','G♯']);assert.deepEqual(c.notes(10,'7'),['B♭','D','F','A♭']);
 assert.deepEqual(c.notes(7,'add9'),['G','B','D','A']);assert.deepEqual(c.notes(9,'minor'),['A','C','E']);
});
