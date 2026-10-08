const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(initial=false){
 const elements=[];const el=()=>({children:[],classList:{add(){}},setAttribute(){},append(...children){this.children.push(...children)},addEventListener(event,fn){this[event]=fn}});
 const home=el();let reloads=0,owned=initial,result={unlocked:initial,status:initial?'purchased':'not_owned'},calls=0;
 const plugin={cachedState:async()=>({unlocked:owned}),restore:async()=>result,price:async()=>({price:'€9.99'}),purchase:async()=>{calls++;return result},addListener:()=>({remove(){}})};
 const window={Capacitor:{getPlatform:()=> 'android',Plugins:{PlayBilling:plugin}}};
 const ctx={window,document:{createElement:()=>{const e=el();elements.push(e);return e},querySelector:()=>home,visibilityState:'visible'},location:{reload(){reloads++}},setTimeout,clearTimeout,setInterval(){}};
 vm.runInNewContext(fs.readFileSync('web/core/play-billing.js','utf8'),ctx);
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
test('Refund clears access; outage preserves valid cache but expires stale access',async()=>{
 const s=setup(true);await s.api.initialize({nativeBilling:true});const host=s.el();s.api.mountPaywall(host);
 s.plugin.restore=async()=>{throw Error('Offline')};host.children[1].click();await flush();assert.equal(s.reloads,0);
 s.setOwned(false);host.children[1].click();await flush();assert.equal(s.reloads,1);
 const r=setup(true);await r.api.initialize({nativeBilling:true});const h=r.el();r.api.mountPaywall(h);r.setResult({unlocked:false,status:'not_owned'});h.children[1].click();await flush();assert.equal(r.reloads,1);
});
test('Native static bridge listener handles work and quiet demo restore stays unobtrusive',async()=>{
 const s=setup();await s.api.initialize({nativeBilling:true});s.api.attach();await flush();assert.equal(s.home.children[0].children[2].textContent,'');
});
