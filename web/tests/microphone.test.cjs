const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function environment(){
 const events={},contexts=[],frames=new Map(),tracks=[],requests=[],native={};let id=0;
 class Context{
  constructor(){this.state='running';this.sampleRate=48000;this.events={};contexts.push(this)}
  resume(){return Promise.resolve()}close(){this.state='closed';return Promise.resolve()}
  addEventListener(name,f){this.events[name]=f}
  createAnalyser(){return {fftSize:8192,getFloatTimeDomainData(){},getFloatFrequencyData(){}}}
  createMediaStreamSource(){return {connect(){},disconnect(){}}}
 }
 const c={window:{AudioContext:Context,addEventListener:(n,f)=>events[n]=f,Capacitor:{Plugins:{App:{addListener:(n,f)=>native[n]=f}}}},document:{hidden:false,addEventListener:(n,f)=>events[n]=f},navigator:{mediaDevices:{getUserMedia:()=>new Promise((resolve,reject)=>requests.push({resolve,reject}))}},requestAnimationFrame:f=>{frames.set(++id,f);return id},cancelAnimationFrame:id=>frames.delete(id),Float32Array};
 vm.runInNewContext(fs.readFileSync(require.resolve('../core/microphone.js'),'utf8'),c);
 function stream(){const track={readyState:'live',events:{},stop(){this.readyState='ended'},addEventListener(n,f){this.events[n]=f}};tracks.push(track);return {getTracks:()=>[track],getAudioTracks:()=>[track]}}
 return {c,api:c.window.FretboardMicrophone,events,native,contexts,tracks,requests,stream};
}
test('Explicit start only; stopping releases tracks and closes the audio context',async()=>{
 const r=environment(),states=[],mic=r.api.create({onFrame(){},onState:s=>states.push(s)});assert.equal(r.requests.length,0);
 const started=mic.start();await new Promise(setImmediate);assert.equal(mic.state,'pending');r.requests[0].resolve(r.stream());await started;assert.equal(mic.state,'on');mic.stop();assert.equal(r.tracks[0].readyState,'ended');assert.equal(r.contexts[0].state,'closed');assert.deepEqual(states,['pending','on','off']);
});
test('Permission completing after stop is discarded without reviving capture',async()=>{
 const r=environment(),mic=r.api.create({onFrame(){}});const pending=mic.start();await new Promise(setImmediate);mic.stop();r.requests[0].resolve(r.stream());await pending;assert.equal(mic.state,'off');assert.equal(r.tracks[0].readyState,'ended');assert.equal(r.contexts[0].state,'closed');
});
test('A new owner releases the old stream and late old permission cannot stop the new owner',async()=>{
 const r=environment(),a=r.api.create({onFrame(){}}),b=r.api.create({onFrame(){}});
 const first=a.start();await new Promise(setImmediate);const second=b.start();await new Promise(setImmediate);r.requests[1].resolve(r.stream());await second;r.requests[0].resolve(r.stream());await first;
 assert.equal(a.state,'off');assert.equal(b.state,'on');assert.equal(r.tracks[0].readyState,'live');assert.equal(r.tracks[1].readyState,'ended');r.api.release();assert.equal(r.tracks[0].readyState,'ended');
});
test('Denied and missing APIs stay recoverable and never retain an audio context',async()=>{
 const r=environment(),errors=[],mic=r.api.create({onFrame(){},onState:(_,e)=>{if(e)errors.push(e.name)}});
 const pending=mic.start();await new Promise(setImmediate);r.requests[0].reject({name:'NotAllowedError'});await pending;assert.equal(mic.state,'off');assert.equal(r.contexts[0].state,'closed');assert.deepEqual(errors,['NotAllowedError']);
 delete r.c.navigator.mediaDevices;await mic.start();assert.deepEqual(errors,['NotAllowedError','Unsupported']);
});
for(const event of ['visibilitychange','pagehide','native','interrupted','ended'])test(`${event} stops capture and requires a fresh user start`,async()=>{
 const r=environment(),mic=r.api.create({onFrame(){}}),pending=mic.start();await new Promise(setImmediate);r.requests[0].resolve(r.stream());await pending;
 if(event==='native')r.native.appStateChange({isActive:false});
 else if(event==='interrupted'){r.contexts[0].state='suspended';r.contexts[0].events.statechange()}
 else if(event==='ended')r.tracks[0].events.ended();
 else{r.c.document.hidden=true;r.events[event]()}
 assert.equal(mic.state,'off');assert.equal(r.tracks[0].readyState,'ended');assert.equal(r.contexts[0].state,'closed');assert.equal(r.requests.length,1);
});
