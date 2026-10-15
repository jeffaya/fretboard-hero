const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {webcrypto,createHash} = require('node:crypto');

// Execute the real bootstrap, billing and access modules together. This guards
// their wiring, including home purchase controls, not just isolated flag values.
async function startup(config, cachedState, {saved=null,search='',session=null}={}) {
  let storeCalls = 0, reloads = 0, appStarted = false;
  const failures = [], rows = [];
  class Node {
    constructor(){this.children=[];this.dataset={};this.selected={};this.classList={add(){},toggle(){}};this.events={};this.style={}}
    append(...nodes){for(const n of nodes){this.children.push(n);n.parentElement=this}} querySelector(s){return this.selected[s]??=new Node()}
    querySelectorAll(){return []} setAttribute(){} addEventListener(name,fn){this.events[name]=fn} focus(){}
  }
  const app=new Node();
  let artworkLoaded;
  const artwork = {addEventListener(name, fn) { if (name === 'load') artworkLoaded = fn; }, setAttribute() { artworkLoaded(); }};
  const logo = {querySelector: () => artwork};
  const loader = {hidden: false};
  const document = {
    querySelector(selector) { return selector === '#home .hero-logo svg' ? logo : selector === '#startupLoader' ? loader : selector === '#app' ? app : {append: row => rows.push(row)}; },
    querySelectorAll: () => [], addEventListener(){},
    createElement: () => new Node(),
    body: {dataset:{},setAttribute() {}, removeAttribute() {}},
    documentElement: {dataset: {}},
    fonts: {load: async () => []},
    head: {appendChild(script) { queueMicrotask(() => {
      try {
        const name = script.src.split('?')[0];
        if (['./core/access.js', './core/native-billing.js'].includes(name)) vm.runInContext(fs.readFileSync(`web/${name.slice(2)}`, 'utf8'), ctx);
        if (name === './app.js') {
          appStarted = true;
          ctx.FRETBOARD_PREMIUM = ctx.FretboardAccess.mount(ctx.FRETBOARD_SITE_CONFIG, ctx.FRETBOARD_ACCESS);
        }
        script.onload();
      } catch (error) { failures.push(error); script.onerror(); }
    }); }},
  };
  const unavailable = () => { storeCalls++; throw Error('Google Play is unavailable. Please try again.'); };
  const plugin = {cachedState: () => { storeCalls++; return Promise.resolve(cachedState); }, restore: unavailable, purchase: unavailable, price: unavailable, addListener: () => ({remove(){}})};
  const ctx = vm.createContext({document, URL, URLSearchParams, TextEncoder, crypto:webcrypto, queueMicrotask, setTimeout, clearTimeout,
    matchMedia:()=>({matches:false,addEventListener(){}}), FretboardModal:{bindDismiss(){}},
    setInterval(){}, location: {search, reload() { reloads++; }},
    localStorage:{getItem:()=>saved,setItem(){},removeItem(){}}, sessionStorage: {getItem: () => session,removeItem(){}}, fetch: async () => ({ok: true, json: async () => ({...config})}),
    console: {error: error => failures.push(error)},
    Capacitor: {getPlatform: () => 'android', Plugins: {PlayBilling: plugin}, registerPlugin: unavailable},
    FretboardI18n: {initialize: async () => {}, mount() {}},
    ProductShell: {apply() {}},
    FRETBOARD_INSTRUMENTS: {guitar: {}, bass4: {}, ukulele: {}},
    FRETBOARD_PRODUCTS: {guitar: {}, bass: {}, ukulele: {}},
  });
  ctx.window = ctx;
  vm.runInContext(fs.readFileSync('web/bootstrap.js', 'utf8'), ctx);
  for (let i = 0; i < 20 && !loader.hidden && !failures.length; i++) await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(failures, []);
  assert.equal(loader.hidden, true, 'bootstrap must complete');
  assert.equal(appStarted, true);
  return {ctx, storeCalls, reloads, rows};
}

for (const instrument of ['guitar', 'bass-4', 'ukulele']) {
  for (const [state, cache] of Object.entries({fresh: {unlocked: false}, expired: {unlocked: false, status: 'expired'}, previouslyPaid: {unlocked: true}})) {
    test(`Preview ${instrument} starts fully unlocked without store calls or messages (${state}, store unavailable)`, async () => {
      const {ctx, storeCalls, reloads, rows} = await startup({instrument, unlocked: true, nativeBilling: false,accessProfile:'Preview'}, cache);
      const access = ctx.FRETBOARD_ACCESS;
      assert.equal(access.unlocked, true);
      for (const [feature, values] of Object.entries({root: ['C', 'F#'], quality: ['major'], mode: ['triads', 'chords', 'arpeggios'], position: ['all', '2', '5'], mapNote: ['all', 'C'], circle: [undefined], routineRoot: ['B'], routineQuality: ['major']})) {
        for (const value of values) assert.equal(access.allows(feature, value), true, `${feature}: ${value}`);
      }
      assert.equal(access.notes, null);
      ctx.FRETBOARD_PREMIUM.open();
      ctx.FRETBOARD_PREMIUM.mark();
      assert.equal(ctx.FretboardBilling.native, false);
      assert.equal(storeCalls, 0);
      assert.equal(reloads, 0);
      assert.deepEqual(rows, [], 'no unlock/restore buttons or Google Play status on home');
    });
  }
}

for(const instrument of ['guitar','bass-4','ukulele']) for(const owned of [false,true]) {
 test(`Store ${instrument} starts from verified ownership (${owned}) despite static flags and URL key`,async()=>{
  const key='valid-test-key';
  const {ctx,rows}=await startup({instrument:'guitar',nativeBilling:true,unlocked:true,testKeyHash:createHash('sha256').update(key).digest('hex')},{unlocked:owned},{search:`?instrument=${instrument}&key=${key}`});
  assert.equal(ctx.FRETBOARD_ACCESS.unlocked,owned);assert.equal(ctx.FRETBOARD_SITE_CONFIG.instrument,instrument);
  assert.equal(ctx.FRETBOARD_ACCESS.allows('root','C'),owned);assert.equal(ctx.FRETBOARD_ACCESS.allows('mode','triads'),owned);
  assert.equal(rows.length,1);assert.equal(rows[0].children[0].hidden,owned);
 });
}
test('Remembered instrument survives restart and campaign URL overrides it without changing purchase',async()=>{
 for(const [options,expected] of [[{saved:'bass-4'},'bass-4'],[{saved:'bass-4',search:'?instrument=ukulele'},'ukulele'],[{session:'ukulele'},'ukulele'],[{saved:'invalid'},'guitar']]){
  const {ctx}=await startup({instrument:'guitar',unlocked:false,nativeBilling:true},{unlocked:true},options);
  assert.equal(ctx.FRETBOARD_SITE_CONFIG.instrument,expected);assert.equal(ctx.FRETBOARD_ACCESS.unlocked,true);
 }
});
