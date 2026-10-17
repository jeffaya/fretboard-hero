const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(initial=false,platform='android'){
 const events={},nativeEvents={},timers=new Map();let clock=0,timerId=0;
 const setTimer=(fn,ms)=>{const id=++timerId;timers.set(id,{fn,at:clock+ms});return id};
 const elements=[];const el=()=>({children:[],attrs:{},classList:{add(){}},get textContent(){return this.label??this.children.map(child=>child.textContent).join('')},set textContent(value){this.label=value;this.children=[];this.innerHTML=''},setAttribute(key,value){this.attrs[key]=value},append(...children){this.children.push(...children)},addEventListener(event,fn){this[event]=fn}});
 const home=el();let reloads=0,owned=initial,result={unlocked:initial,status:initial?'purchased':'not_owned'},calls=0;
 const plugin={cachedState:async()=>({unlocked:owned}),restore:async()=>result,price:async()=>({price:'€9.99'}),purchase:async()=>{calls++;return result},addListener:()=>({remove(){}})};
 const app={addListener:(event,fn)=>{nativeEvents[event]=fn;return {remove(){}}}};
 const window={addEventListener:(event,fn)=>{events[event]=fn},Capacitor:{getPlatform:()=> platform,Plugins:{[platform==='ios'?'StoreBilling':'PlayBilling']:plugin,App:app}}};
 const ctx={window,document:{createElement:()=>{const e=el();elements.push(e);return e},querySelector:()=>home,visibilityState:'visible',addEventListener:(event,fn)=>{events[event]=fn}},location:{reload(){reloads++}},setTimeout:setTimer,clearTimeout:id=>timers.delete(id),setInterval(){}};
 vm.runInNewContext(fs.readFileSync('web/core/native-billing.js','utf8'),ctx);
 return {api:window.FretboardBilling,plugin,home,el,events,nativeEvents,window,document:ctx.document,timers,
  async advance(ms){const end=clock+ms;for(;;){const next=[...timers].filter(([,timer])=>timer.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;const [id,timer]=next;clock=timer.at;timers.delete(id);timer.fn();await flush()}clock=end},
  get reloads(){return reloads},get calls(){return calls},setResult(value){result=value},setOwned(value){owned=value}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('Web never initializes native billing; native cache controls startup',async()=>{
 const s=setup();s.plugin.cachedState=()=>assert.fail('Native billing accessed on web');assert.equal(await s.api.initialize({unlocked:true}),false);
 for(const cached of [false,true]){const n=setup(cached);assert.equal(await n.api.initialize({nativeBilling:true,unlocked:!cached}),cached)}
});
test('Localized purchase and restore controls grant access only on verified ownership',async()=>{
 const s=setup();await s.api.initialize({nativeBilling:true});const host=s.el();s.api.mountPaywall(host);await s.api.refreshPrice();
 const [buy,restore,help,status]=host.children;assert.equal(buy.textContent,'Unlock for life');assert.doesNotMatch(host.textContent,/€9.99/);
 assert.equal(help.textContent,'Already purchased on another phone? Restore your access with the same account, without paying again.');assert.equal(restore.attrs['aria-describedby'],help.id);
 assert.equal(buy.className,'ui-primary modal-action');assert.equal(restore.className,'ui-secondary modal-action');
 const icons=[buy.innerHTML,restore.innerHTML];for(const icon of icons)assert.match(icon,/<svg.*aria-hidden="true"/);
 for(const state of ['pending','cancelled']){s.setResult({unlocked:false,status:state});buy.click();await flush();assert.equal(s.reloads,0);assert.match(status.textContent,state==='pending'?/pending/:/cancelled/)}
 s.setResult({unlocked:true,status:'purchased'});restore.click();await flush();assert.equal(s.reloads,1);
 assert.deepEqual([buy.innerHTML,restore.innerHTML],icons);assert.equal(restore.textContent,'Restore your access');
});
test('Android and Apple catalog refreshes preserve translated lifetime and recovery labels',async()=>{
 for(const platform of ['android','ios']){
  const s=setup(false,platform);await s.api.initialize({nativeBilling:true});const host=s.el();s.api.mountPaywall(host);
  const [buy,restore]=host.children;assert.equal(buy.textContent,'Unlock for life');assert.equal(restore.textContent,'Restore your access');
  buy.children[0].textContent='Débloquer à vie';restore.children[0].textContent='Récupérer votre accès';
  await s.api.refreshPrice();s.plugin.price=async()=>({price:'4,79 €'});await s.api.refreshPrice();
  s.setResult({unlocked:false,status:'cancelled'});buy.click();await flush();
  assert.equal(s.calls,1);assert.equal(s.reloads,0);assert.equal(buy.textContent,'Débloquer à vie');assert.equal(restore.textContent,'Récupérer votre accès');assert.doesNotMatch(host.textContent,/€|9\.99|4,79/);
 }
});
test('Only a confirmed revocation clears access; outages never expire paid ownership',async()=>{
 const s=setup(true);await s.api.initialize({nativeBilling:true});const host=s.el();s.api.mountPaywall(host);
 s.plugin.restore=async()=>{throw Error('Offline')};host.children[1].click();await flush();assert.equal(s.reloads,0);
 s.setOwned(false);host.children[1].click();await flush();assert.equal(s.reloads,0);
 const r=setup(true);await r.api.initialize({nativeBilling:true});const h=r.el();r.api.mountPaywall(h);r.setResult({unlocked:false,status:'not_owned'});h.children[1].click();await flush();assert.equal(r.reloads,1);
});
test('Native static bridge listener handles work and quiet demo restore stays unobtrusive',async()=>{
 const s=setup();await s.api.initialize({nativeBilling:true});const host=s.el();s.api.mountPaywall(host);s.api.attach();await flush();assert.equal(s.home.children.length,0);assert.equal(host.children[3].textContent,'');
});
test('Apple uses StoreBilling and silent refresh; explicit restore alone synchronizes the account',async()=>{
 const s=setup(false,'ios');let refreshes=0,restores=0;
 s.plugin.refresh=async()=>{refreshes++;return {unlocked:false,status:'not_owned'}};
 s.plugin.restore=async()=>{restores++;return {unlocked:true,status:'purchased'}};
 assert.equal(await s.api.initialize({nativeBilling:true}),false);s.api.attach();await flush();assert.equal(refreshes,1);assert.equal(restores,0);
 const host=s.el();s.api.mountPaywall(host);await s.api.refreshPrice();s.setResult({unlocked:false,status:'pending'});host.children[0].click();await flush();assert.match(host.children[3].textContent,/App Store/);assert.equal(s.reloads,0);
 host.children[1].click();await flush();assert.equal(restores,1);assert.equal(s.reloads,1);
});
test('Apple transaction update reconciles while a purchase is still pending',async()=>{
 const s=setup(false,'ios');let changed,finish,refreshes=0;
 s.plugin.addListener=(_,fn)=>{changed=fn;return {remove(){}}};
 s.plugin.refresh=async()=>{refreshes++;return {unlocked:refreshes>1,status:'purchased'}};
 s.plugin.purchase=()=>new Promise(resolve=>{finish=resolve});
 await s.api.initialize({nativeBilling:true});s.api.attach();await flush();const host=s.el();s.api.mountPaywall(host);await s.api.refreshPrice();host.children[0].click();changed();finish({unlocked:false,status:'pending'});await flush();assert.equal(refreshes,2);assert.equal(s.reloads,1);
});

async function readyToBuy(s){
 await s.api.initialize({nativeBilling:true});s.api.attach();await flush();
 const host=s.el();s.api.mountPaywall(host);await s.api.refreshPrice();return host;
}
test('A verified purchase refreshes full access immediately without a manual restart',async()=>{
 const s=setup(),host=await readyToBuy(s);s.setResult({unlocked:true,status:'purchased'});
 host.children[0].click();await flush();assert.equal(s.reloads,1);assert.equal(s.timers.size,0);
});
test('Returning from Google Play unlocks even when the purchase callback never arrives',async()=>{
 const s=setup(),host=await readyToBuy(s);let finish;
 s.plugin.purchase=()=>new Promise(resolve=>{finish=resolve});host.children[0].click();
 s.nativeEvents.appStateChange({isActive:false});s.setResult({unlocked:true,status:'purchased'});
 s.nativeEvents.appStateChange({isActive:true});await flush();assert.equal(s.reloads,1);
 // A late callback from the original request cannot overwrite verified ownership.
 finish({unlocked:false,status:'not_owned'});await flush();assert.equal(s.reloads,1);assert.equal(s.timers.size,0);
});
test('A store update checks ownership without waiting for an unresolved purchase',async()=>{
 const s=setup();let changed;
 s.plugin.addListener=(_,fn)=>{changed=fn;return {remove(){}}};
 const host=await readyToBuy(s);s.plugin.purchase=()=>new Promise(()=>{});host.children[0].click();
 s.setResult({unlocked:true,status:'purchased'});changed();await flush();assert.equal(s.reloads,1);
});
test('Transient post-payment verification failures recover automatically with bounded backoff',async()=>{
 const s=setup(),host=await readyToBuy(s);let restores=0;
 s.plugin.purchase=async()=>{throw Error('Verification temporarily unavailable')};
 s.plugin.restore=async()=>{restores++;if(restores===2)throw Error('Offline');return {unlocked:restores===3,status:restores===3?'purchased':'not_owned'}};
 host.children[0].click();await flush();assert.equal(restores,1);assert.equal(s.reloads,0);
 assert.match(host.children[3].textContent,/Verification temporarily unavailable/);
 await s.advance(999);assert.equal(restores,1);
 await s.advance(1);assert.equal(restores,2);assert.equal(s.reloads,0);
 await s.advance(2000);assert.equal(restores,3);assert.equal(s.reloads,1);assert.equal(s.timers.size,0);
});
test('Pending payments remain locked and automatic retries stop after five delays',async()=>{
 const s=setup(),host=await readyToBuy(s);let restores=0;
 s.setResult({unlocked:false,status:'pending'});s.plugin.restore=async()=>{restores++;return {unlocked:false,status:'pending'}};
 host.children[0].click();await flush();assert.equal(restores,1);
 await s.advance(38000);assert.equal(restores,6);assert.equal(s.reloads,0);assert.equal(s.timers.size,0);
 assert.match(host.children[3].textContent,/Payment pending/);
 await s.advance(60000);assert.equal(restores,6);
 // A later store event/foreground return can start a new reconciliation window.
 s.plugin.restore=async()=>({unlocked:true,status:'purchased'});s.nativeEvents.appStateChange({isActive:true});
 await flush();assert.equal(s.reloads,1);
});
test('Cancellation never starts recovery or grants access',async()=>{
 const s=setup(),host=await readyToBuy(s);let restores=0;
 s.plugin.restore=async()=>{restores++;return {unlocked:false,status:'not_owned'}};
 s.setResult({unlocked:false,status:'cancelled'});host.children[0].click();await flush();await s.advance(60000);
 assert.equal(restores,0);assert.equal(s.reloads,0);assert.equal(s.timers.size,0);assert.match(host.children[3].textContent,/cancelled/);
});
test('Visibility and online events recover when the App lifecycle plugin is unavailable',async()=>{
 const s=setup();delete s.window.Capacitor.Plugins.App;
 s.window.Capacitor.registerPlugin=()=>{throw Error('App bridge unavailable')};
 const host=await readyToBuy(s);let restores=0;
 s.plugin.purchase=async()=>{throw Error('Offline')};
 s.plugin.restore=async()=>{restores++;throw Error('Offline')};
 host.children[0].click();await flush();assert.equal(restores,1);
 s.document.visibilityState='hidden';s.events.visibilitychange();await s.advance(10000);assert.equal(restores,1);
 s.document.visibilityState='visible';s.events.visibilitychange();await flush();assert.equal(restores,2);
 s.plugin.restore=async()=>({unlocked:true,status:'purchased'});s.events.online();await flush();assert.equal(s.reloads,1);assert.equal(s.timers.size,0);
});
test('Overlapping foreground signals coalesce into one follow-up ownership query',async()=>{
 const s=setup();await readyToBuy(s);let finish,restores=0,inFlight=0;
 s.plugin.restore=()=>{restores++;inFlight++;assert.equal(inFlight,1);return new Promise(resolve=>{finish=value=>{inFlight--;resolve(value)}})};
 s.nativeEvents.appStateChange({isActive:true});s.events.visibilitychange();s.events.online();
 assert.equal(restores,1);finish({unlocked:false,status:'not_owned'});await flush();assert.equal(restores,2);
 finish({unlocked:true,status:'purchased'});await flush();assert.equal(s.reloads,1);
});
test('A stale background result cannot relock a purchase confirmed in parallel',async()=>{
 const s=setup(),host=await readyToBuy(s);let finish;
 s.plugin.restore=()=>new Promise(resolve=>{finish=resolve});s.nativeEvents.appStateChange({isActive:true});
 s.setResult({unlocked:true,status:'purchased'});host.children[0].click();await flush();assert.equal(s.reloads,1);
 finish({unlocked:false,status:'not_owned'});await flush();assert.equal(s.reloads,1);assert.equal(s.timers.size,0);
});
test('Missing Apple bridge never unlocks from config flags or calls Android billing',async()=>{
 const s=setup(false,'web');assert.equal(await s.api.initialize({nativeBilling:true,unlocked:true}),false);assert.equal(s.calls,0);
});

test('Fresh offline installs remain demo and silent checks do not show alarming errors',async()=>{
 const s=setup(false);s.plugin.restore=async()=>{throw Error('Offline')};s.plugin.price=async()=>{throw Error('Offline')};
 assert.equal(await s.api.initialize({nativeBilling:true,unlocked:true}),false);const host=s.el();s.api.mountPaywall(host);s.api.attach();await flush();
 assert.equal(s.reloads,0);assert.equal(s.home.children.length,0);assert.equal(host.children[3].textContent,'');
});
test('Missing price never starts payment; repeated clicks during purchase are ignored',async()=>{
 const s=setup();await s.api.initialize({nativeBilling:true});const host=s.el();s.api.mountPaywall(host);
 s.plugin.price=async()=>{throw Error('No catalog')};host.children[0].click();await flush();assert.equal(s.calls,0);
 s.plugin.price=async()=>({price:'2,99 €'});await s.api.refreshPrice();let finish,count=0;
 s.plugin.purchase=()=>{count++;return new Promise(resolve=>finish=resolve)};
 host.children[0].click();host.children[0].click();assert.equal(count,1);assert.equal(host.children[0].disabled,true);
 finish({unlocked:false,status:'cancelled'});await flush();assert.equal(s.reloads,0);assert.equal(host.children[0].disabled,false);
});
test('All paid instruments share one entitlement and no native paywall links to a website payment',async()=>{
 for(const instrument of ['guitar','bass-4','ukulele']){
  const s=setup(true);assert.equal(await s.api.initialize({instrument,nativeBilling:true,unlocked:false}),true);
  s.api.attach();await flush();assert.equal(s.home.children.length,0);
 }
});
