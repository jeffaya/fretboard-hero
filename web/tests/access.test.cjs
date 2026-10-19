const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{webcrypto,createHash}=require('node:crypto');
const ctx={window:{},URLSearchParams,TextEncoder,crypto:webcrypto};vm.createContext(ctx);vm.runInContext(fs.readFileSync('web/core/access.js','utf8'),ctx);const Access=ctx.window.FretboardAccess;
test('Demo defaults fail closed; only explicit boolean true or the valid key unlocks',async()=>{
 const config={unlocked:false,testKeyHash:createHash('sha256').update('valid-test-key').digest('hex')};
 assert.equal(await Access.resolve(config,''),false);assert.equal(await Access.resolve(config,'?key=wrong'),false);assert.equal(await Access.resolve(config,'?key=valid-test-key'),true);assert.equal(await Access.resolve({unlocked:true}),true);
 await assert.rejects(Access.resolve({unlocked:'true'}));await assert.rejects(Access.resolve({}));
});
test('Demo keeps Learn in A, Map on A, a fixed circle and the A minor routine',()=>{
 const a=Access.create(false);assert.equal(a.allows('mapNote','A'),true);assert.deepEqual(Array.from(a.notes),['A']);
 for(const n of ['all','A#','B','C','C#','D','D#','E','F','F#','G','G#'])assert.equal(a.allows('mapNote',n),false);
 assert.equal(a.unlocked,false);assert.equal(a.allows('root','A'),true);
 for(const root of ['A#','B','C','C#','D','D#','E','F','F#','G','G#'])assert.equal(a.allows('root',root),false);
 assert.equal(a.allows('circle'),false);assert.equal(a.allows('routineRoot','A'),true);assert.equal(a.allows('routineRoot','C'),false);assert.equal(a.allows('routineQuality','minor'),true);assert.equal(a.allows('routineQuality','major'),false);assert.equal(a.allows('unknown'),false);
 const full=Access.create(true);for(const f of ['circle','routineRoot','routineQuality','root','quality','mode','mapNote','position'])assert.equal(full.allows(f,'anything'),true);assert.equal(full.notes,null);
});
test('Free Learn allows both qualities, every registered mode and all pentatonic positions on all instruments',()=>{
 const c={window:{}};vm.createContext(c);
 for(const file of ['core/music-theory','instruments/guitar','instruments/bass-4','instruments/ukulele'])vm.runInContext(fs.readFileSync(`web/${file}.js`,'utf8'),c);
 const access=Access.create(false);
 for(const profile of Object.values(c.window.FRETBOARD_INSTRUMENTS)){
  for(const quality of ['minor','major'])assert.equal(access.allows('quality',quality),true,`${profile.id}: ${quality}`);
  for(const mode of Object.values(profile.modes))assert.equal(access.allows('mode',mode.plugin),true,`${profile.id}: ${mode.plugin}`);
  for(const position of profile.modes.penta.context.values)assert.equal(access.allows('position',position),true,`${profile.id}: ${position}`);
 }
});
test('Map filters hidden pitches at render time rather than only hiding controls',()=>{
 const c={window:{},MusicTheory:{noteName:n=>['A','B','C'][n]},FretboardLayout:{fretCenter:(f,p)=>p(f)}};vm.createContext(c);vm.runInContext(fs.readFileSync('web/core/fretboard-map.js','utf8'),c);const notes=[];
 const opts={svg:{},engine:{stringCount:1,noteAt:(_,f)=>f},maxFret:2,appearance:{note:(_,n)=>notes.push(n.label)},renderCore:()=>({isP:false,fretPos:f=>f,visualStringPos:()=>0}),allowedNotes:Access.create(false).notes};c.window.FretboardMap.render(opts);assert.deepEqual(notes,['A']);notes.length=0;c.window.FretboardMap.render({...opts,allowedNotes:null});assert.deepEqual(notes,['A','B','C']);
});
