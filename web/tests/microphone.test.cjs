const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function environment(saved=new Map()){
 const events={},contexts=[],frames=new Map(),tracks=[],requests=[],native={};let id=0;
 class Context{
  constructor(){this.state='running';this.sampleRate=48000;this.events={};this.nodes=[];this.destination={};this.resumeCalls=0;contexts.push(this)}
  resume(){this.resumeCalls++;this.state='running';return Promise.resolve()}close(){this.state='closed';return Promise.resolve()}
  addEventListener(name,f){this.events[name]=f}
  node(extra={}){const node={connections:[],connect(next){this.connections.push(next)},disconnect(){this.connections=[]},...extra};this.nodes.push(node);return node}
  createAnalyser(){return this.node({fftSize:8192,getFloatTimeDomainData(data){data.fill(.01)},getFloatFrequencyData(data){data.fill(-50)}})}
  createGain(){return this.node({gain:{value:1}})}
  createMediaStreamSource(){return this.node()}
 }
 const c={localStorage:{getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)},window:{AudioContext:Context,addEventListener:(n,f)=>events[n]=f,Capacitor:{Plugins:{App:{addListener:(n,f)=>native[n]=f}}}},document:{hidden:false,addEventListener:(n,f)=>events[n]=f},navigator:{mediaDevices:{getUserMedia:constraints=>new Promise((resolve,reject)=>requests.push({resolve,reject,constraints}))}},requestAnimationFrame:f=>{frames.set(++id,f);return id},cancelAnimationFrame:id=>frames.delete(id),Float32Array};
 vm.runInNewContext(fs.readFileSync(require.resolve('../core/microphone.js'),'utf8'),c);
 function stream(){const track={readyState:'live',events:{},stop(){this.readyState='ended'},addEventListener(n,f){this.events[n]=f}};tracks.push(track);return {getTracks:()=>[track],getAudioTracks:()=>[track]}}
 return {c,api:c.window.FretboardMicrophone,events,native,contexts,tracks,requests,stream,frames};
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
test('An explicit retry after denied permission starts a fresh capture without immediately switching off',async()=>{
 const r=environment(),states=[],mic=r.api.create({onFrame(){},onState:state=>states.push(state)});
 const denied=mic.start();await new Promise(setImmediate);r.requests[0].reject({name:'NotAllowedError'});await denied;
 assert.equal(mic.state,'off');assert.equal(r.contexts[0].state,'closed');
 const retry=mic.start();await new Promise(setImmediate);r.requests[1].resolve(r.stream());await retry;
 assert.equal(r.requests.length,2);assert.equal(mic.state,'on');assert.equal(r.tracks[0].readyState,'live');assert.equal(r.contexts[1].state,'running');
 assert.equal(states.at(-1),'on');mic.stop();assert.equal(r.tracks[0].readyState,'ended');
});
for(const event of ['visibilitychange','pagehide','native','ended'])test(`${event} stops capture and requires a fresh user start`,async()=>{
 const r=environment(),mic=r.api.create({onFrame(){}}),pending=mic.start();await new Promise(setImmediate);r.requests[0].resolve(r.stream());await pending;
 if(event==='native')r.native.appStateChange({isActive:false});
 else if(event==='ended')r.tracks[0].events.ended();
 else{r.c.document.hidden=true;r.events[event]()}
 assert.equal(mic.state,'off');assert.equal(r.tracks[0].readyState,'ended');assert.equal(r.contexts[0].state,'closed');assert.equal(r.requests.length,1);
});

test('Each microphone defaults on; explicit off survives reload and stays independent of the other feature',()=>{
 const saved=new Map(),r=environment(saved),routine=r.api.preference('routine'),tuner=r.api.preference('tuner');
 assert.equal(routine.enabled,true);assert.equal(tuner.enabled,true);routine.setEnabled(false);
 assert.equal(environment(saved).api.preference('routine').enabled,false);assert.equal(tuner.enabled,true);
 routine.setEnabled(true);assert.equal(environment(saved).api.preference('routine').enabled,true);
});
test('Unavailable storage still allows on/off within the current visit',()=>{
 const r=environment();r.c.localStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 const preference=r.api.preference('routine');assert.equal(preference.enabled,true);preference.setEnabled(false);assert.equal(preference.enabled,false);
});

test('Rhythm requests echo cancellation, prefers all output when supported, and restores raw capture',async()=>{
 const r=environment(),mic=r.api.create({onFrame(){}}),applied=[];
 await mic.setEchoCancellation(true);const pending=mic.start();await new Promise(setImmediate);
 assert.equal(r.requests[0].constraints.audio.echoCancellation,true);
 const stream=r.stream();r.tracks[0].getCapabilities=()=>({echoCancellation:[true,false,'all']});
 r.tracks[0].applyConstraints=async value=>applied.push(value);
 r.requests[0].resolve(stream);await pending;
 assert.equal(applied[0].echoCancellation,'all');assert.equal(mic.state,'on');
 await mic.setEchoCancellation(false);assert.equal(applied[1].echoCancellation,false);
 assert.ok(applied.every(c=>c.noiseSuppression===false&&c.autoGainControl===false));
 assert.equal(r.requests.length,1);assert.equal(r.tracks[0].readyState,'live');
});
test('Changing mode while permission is pending uses the latest echo setting',async()=>{
 const r=environment(),mic=r.api.create({onFrame(){}}),pending=mic.start();await new Promise(setImmediate);
 assert.equal(r.requests[0].constraints.audio.echoCancellation,false);
 await mic.setEchoCancellation(true);const stream=r.stream(),applied=[];
 r.tracks[0].applyConstraints=async value=>applied.push(value.echoCancellation);
 r.requests[0].resolve(stream);await pending;
 assert.deepEqual(applied,[true]);assert.equal(mic.state,'on');
});
test('Rapid mode switches serialize constraints and unsupported changes leave capture usable',async()=>{
 const r=environment(),mic=r.api.create({onFrame(){}}),pending=mic.start();await new Promise(setImmediate);
 r.requests[0].resolve(r.stream());await pending;
 let release;const applied=[];r.tracks[0].applyConstraints=value=>{applied.push(value.echoCancellation);return value.echoCancellation?new Promise(resolve=>release=resolve):Promise.reject(Error('Unsupported'))};
 const on=mic.setEchoCancellation(true);await new Promise(setImmediate);const off=mic.setEchoCancellation(false);
 assert.deepEqual(applied,[true]);release();await Promise.all([on,off]);
 assert.deepEqual(applied,[true,false]);assert.equal(mic.state,'on');assert.equal(r.requests.length,1);
});
test('Stopping during input reconfiguration cannot revive a released stream',async()=>{
 const r=environment(),mic=r.api.create({onFrame(){}});await mic.setEchoCancellation(true);
 const pending=mic.start();await new Promise(setImmediate);const stream=r.stream();let release;
 r.tracks[0].applyConstraints=()=>new Promise(resolve=>release=resolve);
 r.requests[0].resolve(stream);await new Promise(setImmediate);mic.stop();release();await pending;
 assert.equal(mic.state,'off');assert.equal(r.tracks[0].readyState,'ended');
});


test('A pending autoplay resume cannot block the microphone permission prompt',async()=>{
 const r=environment(),Base=r.c.window.AudioContext;
 r.c.window.AudioContext=class extends Base{resume(){this.resumeCalls++;if(this.resumeCalls===1){this.state='suspended';return new Promise(()=>{})}this.state='running';return Promise.resolve()}};
 const mic=r.api.create({onFrame(){}}),started=mic.start();
 assert.equal(r.requests.length,1);r.requests[0].resolve(r.stream());await started;
 assert.equal(mic.state,'on');assert.equal(r.contexts[0].resumeCalls,2);
});
test('Permission-sheet suspension is resumed and captured samples reach a muted rendering graph',async()=>{
 const r=environment(),received=[],mic=r.api.create({onFrame:f=>received.push(f)}),started=mic.start();
 const context=r.contexts[0];context.state='suspended';r.requests[0].resolve(r.stream());await started;
 assert.equal(context.resumeCalls,2);assert.equal(mic.state,'on');
 const [analyser,source,gain]=context.nodes;
 assert.deepEqual(source.connections,[analyser]);assert.deepEqual(analyser.connections,[gain]);assert.equal(gain.gain.value,0);assert.deepEqual(gain.connections,[context.destination]);
 const tick=r.frames.values().next().value;tick(100);assert.equal(received.length,1);assert.ok(received[0].samples.every(v=>Math.abs(v-.01)<1e-6));
 mic.stop();assert.ok(context.nodes.every(node=>node.connections.length===0));
});
test('A foreground audio interruption recovers the same stream without a second permission request',async()=>{
 const r=environment(),states=[],mic=r.api.create({onFrame(){},onState:s=>states.push(s)}),started=mic.start();r.requests[0].resolve(r.stream());await started;
 r.contexts[0].state='interrupted';await r.contexts[0].events.statechange();
 assert.equal(mic.state,'on');assert.equal(r.requests.length,1);assert.equal(r.tracks[0].readyState,'live');assert.deepEqual(states,['pending','on','pending','on']);
});
test('Stopping while interruption recovery is pending cannot revive microphone capture',async()=>{
 const r=environment(),mic=r.api.create({onFrame(){}}),started=mic.start();r.requests[0].resolve(r.stream());await started;
 let resolve;r.contexts[0].resume=()=>new Promise(done=>resolve=done);r.contexts[0].state='suspended';const recovery=r.contexts[0].events.statechange();
 assert.equal(mic.state,'pending');mic.stop();resolve();await recovery;assert.equal(mic.state,'off');assert.equal(r.tracks[0].readyState,'ended');
});
test('Failed foreground recovery releases capture and reports a retryable error',async()=>{
 const r=environment(),errors=[],mic=r.api.create({onFrame(){},onState:(_,error)=>{if(error)errors.push(error.name)}}),started=mic.start();r.requests[0].resolve(r.stream());await started;
 r.contexts[0].resume=()=>Promise.reject({name:'NotAllowedError'});r.contexts[0].state='suspended';await r.contexts[0].events.statechange();
 assert.equal(mic.state,'off');assert.equal(r.tracks[0].readyState,'ended');assert.deepEqual(errors,['NotAllowedError']);
});
