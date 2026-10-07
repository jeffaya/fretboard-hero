const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{webcrypto,createHash}=require('node:crypto');
const ctx={window:{},URLSearchParams,TextEncoder,crypto:webcrypto};vm.createContext(ctx);vm.runInContext(fs.readFileSync('web/core/access.js','utf8'),ctx);const Access=ctx.window.FretboardAccess;
test('Demo defaults fail closed; only explicit boolean true or the valid key unlocks',async()=>{
 const config={unlocked:false,testKeyHash:createHash('sha256').update('valid-test-key').digest('hex')};
 assert.equal(await Access.resolve(config,''),false);assert.equal(await Access.resolve(config,'?key=wrong'),false);assert.equal(await Access.resolve(config,'?key=valid-test-key'),true);assert.equal(await Access.resolve({unlocked:true}),true);
 await assert.rejects(Access.resolve({unlocked:'true'}));await assert.rejects(Access.resolve({}));
});
test('Demo policy allows A minor pentatonic only, fixed circle and one lick',()=>{
 const a=Access.create(false);assert.equal(a.allows('mapNote','A'),true);assert.deepEqual(Array.from(a.notes),['A']);
 for(const n of ['all','A#','B','C','C#','D','D#','E','F','F#','G','G#'])assert.equal(a.allows('mapNote',n),false);
 assert.equal(a.allows('root','A'),true);assert.equal(a.allows('root','C'),false);assert.equal(a.allows('quality','major'),false);assert.equal(a.allows('mode','pentatonic'),true);for(const m of ['triads','chords','arpeggios'])assert.equal(a.allows('mode',m),false);
 assert.equal(a.allows('position','1'),true);for(const p of ['all','2','3','4','5'])assert.equal(a.allows('position',p),false);assert.equal(a.allows('circle'),false);assert.equal(a.allows('play'),false);assert.equal(a.allows('playLevel','Expert'),false);assert.equal(a.allows('playStyle','Blues'),true);
 const full=Access.create(true);for(const f of ['circle','play','root','quality','mode','mapNote','position'])assert.equal(full.allows(f,'anything'),true);assert.equal(full.notes,null);
});
test('Map filters hidden pitches at render time rather than only hiding controls',()=>{
 const c={window:{},MusicTheory:{noteName:n=>['A','B','C'][n]},FretboardLayout:{fretCenter:(f,p)=>p(f)}};vm.createContext(c);vm.runInContext(fs.readFileSync('web/core/fretboard-map.js','utf8'),c);const notes=[];
 const opts={svg:{},engine:{stringCount:1,noteAt:(_,f)=>f},maxFret:2,appearance:{note:(_,n)=>notes.push(n.label)},renderCore:()=>({isP:false,fretPos:f=>f,visualStringPos:()=>0}),allowedNotes:Access.create(false).notes};c.window.FretboardMap.render(opts);assert.deepEqual(notes,['A']);notes.length=0;c.window.FretboardMap.render({...opts,allowedNotes:null});assert.deepEqual(notes,['A','B','C']);
});
