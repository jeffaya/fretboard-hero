const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(initial=false,platform='android'){
 const elements=[];const el=()=>({children:[],classList:{add(){}},setAttribute(){},append(...children){this.children.push(...children)},addEventListener(event,fn){this[event]=fn}});
 const home=el();let reloads=0,owned=initial,result={unlocked:initial,status:initial?'purchased':'not_owned'},calls=0;
 const plugin={cachedState:async()=>({unlocked:owned}),restore:async()=>result,price:async()=>({price:'€9.99'}),purchase:async()=>{calls++;return result},addListener:()=>({remove(){}})};
 const window={Capacitor:{getPlatform:()=> platform,Plugins:{[platform==='ios'?'StoreBilling':'PlayBilling']:plugin}}};
 const ctx={window,document:{createElement:()=>{const e=el();elements.push(e);return e},querySelector:()=>home,visibilityState:'visible'},location:{reload(){reloads++}},setTimeout,clearTimeout,setInterval(){}};
 vm.runInNewContext(fs.readFileSync('web/core/native-billing.js','utf8'),ctx);
 return {api:window.FretboardBilling,plugin,home,el,get reloads(){return reloads},get calls(){return calls},setResult(value){result=value},setOwned(value){owned=value}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('Web never initializes native billing; native cache controls startup',async()=>{
 const s=setup();s.plugin.cachedState=()=>assert.fail('Native billing accessed on web');assert.equal(await s.api.initialize({unlocked:true}),false);
 for(const cached of [false,true]){const n=setup(cached);assert.equal(await n.api.initialize({nativeBilling:true,unlocked:!cached}),cached)}
});
test('Localized purchase and restore controls grant access only on verified ownership',async()=>{
 const s=setup();await s.api.initialize({nativeBilling:true});const host=s.el();s.api.mountPaywall(host);await s.api.refreshPrice();
 const [buy,restore,,status]=host.children;assert.match(buy.textContent,/€9.99/);assert.match(host.children[2].textContent,/Guitar, bass & ukulele/);
 for(const state of ['pending','cancelled']){s.setResult({unlocked:false,status:state});buy.click();await flush();assert.equal(s.reloads,0);assert.match(status.textContent,state==='pending'?/pending/:/cancelled/)}
 s.setResult({unlocked:true,status:'purchased'});restore.click();await flush();assert.equal(s.reloads,1);
});
test('Only a confirmed revocation clears access; outages never expire paid ownership',async()=>{
 const s=setup(true);await s.api.initialize({nativeBilling:true});const host=s.el();s.api.mountPaywall(host);
 s.plugin.restore=async()=>{throw Error('Offline')};host.children[1].click();await flush();assert.equal(s.reloads,0);
 s.setOwned(false);host.children[1].click();await flush();assert.equal(s.reloads,0);
 const r=setup(true);await r.api.initialize({nativeBilling:true});const h=r.el();r.api.mountPaywall(h);r.setResult({unlocked:false,status:'not_owned'});h.children[1].click();await flush();assert.equal(r.reloads,1);
});
test('Native static bridge listener handles work and quiet demo restore stays unobtrusive',async()=>{
 const s=setup();await s.api.initialize({nativeBilling:true});s.api.attach();await flush();assert.equal(s.home.children[0].children[2].textContent,'');
});
test('Apple uses StoreBilling and silent refresh; explicit restore alone synchronizes the account',async()=>{
 const s=setup(false,'ios');let refreshes=0,restores=0;
 s.plugin.refresh=async()=>{refreshes++;return {unlocked:false,status:'not_owned'}};
 s.plugin.restore=async()=>{restores++;return {unlocked:true,status:'purchased'}};
 assert.equal(await s.api.initialize({nativeBilling:true}),false);s.api.attach();await flush();assert.equal(refreshes,1);assert.equal(restores,0);
 const host=s.el();s.api.mountPaywall(host);await s.api.refreshPrice();s.setResult({unlocked:false,status:'pending'});host.children[0].click();await flush();assert.match(host.children[3].textContent,/App Store/);assert.equal(s.reloads,0);
 host.children[1].click();await flush();assert.equal(restores,1);assert.equal(s.reloads,1);
});
test('Apple transaction update during a purchase is replayed after pending completion',async()=>{
 const s=setup(false,'ios');let changed,finish,refreshes=0;
 s.plugin.addListener=(_,fn)=>{changed=fn;return {remove(){}}};
 s.plugin.refresh=async()=>{refreshes++;return {unlocked:refreshes>1,status:'purchased'}};
 s.plugin.purchase=()=>new Promise(resolve=>{finish=resolve});
 await s.api.initialize({nativeBilling:true});s.api.attach();await flush();const host=s.el();s.api.mountPaywall(host);await s.api.refreshPrice();host.children[0].click();changed();finish({unlocked:false,status:'pending'});await flush();assert.equal(refreshes,2);assert.equal(s.reloads,1);
});
test('Missing Apple bridge never unlocks from config flags or calls Android billing',async()=>{
 const s=setup(false,'web');assert.equal(await s.api.initialize({nativeBilling:true,unlocked:true}),false);assert.equal(s.calls,0);
});

test('Fresh offline installs remain demo and silent checks do not show alarming errors',async()=>{
 const s=setup(false);s.plugin.restore=async()=>{throw Error('Offline')};s.plugin.price=async()=>{throw Error('Offline')};
 assert.equal(await s.api.initialize({nativeBilling:true,unlocked:true}),false);s.api.attach();await flush();
 assert.equal(s.reloads,0);assert.equal(s.home.children[0].children[2].textContent,'');
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
  s.api.attach();await flush();assert.equal(s.home.children[0].children[0].hidden,true);
  assert.equal(s.home.children[0].children[1].textContent,'Restore purchases');
 }
});
