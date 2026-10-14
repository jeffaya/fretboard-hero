const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Execute the real bootstrap, billing and access modules together. This guards
// their wiring, including home purchase controls, not just isolated flag values.
async function startup(config, cachedState) {
  let storeCalls = 0, reloads = 0, appStarted = false;
  const failures = [], rows = [];
  let artworkLoaded;
  const artwork = {addEventListener(name, fn) { if (name === 'load') artworkLoaded = fn; }, setAttribute() { artworkLoaded(); }};
  const logo = {querySelector: () => artwork};
  const loader = {hidden: false};
  const document = {
    querySelector(selector) { return selector === '#home .hero-logo svg' ? logo : selector === '#startupLoader' ? loader : {append: row => rows.push(row)}; },
    createElement: () => ({}),
    body: {setAttribute() {}, removeAttribute() {}},
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
  const plugin = {cachedState: () => { storeCalls++; return Promise.resolve(cachedState); }, restore: unavailable, purchase: unavailable, price: unavailable, addListener: unavailable};
  const ctx = vm.createContext({document, URLSearchParams, TextEncoder, queueMicrotask, setTimeout, clearTimeout,
    setInterval: unavailable, location: {search: '', reload() { reloads++; }},
    sessionStorage: {getItem: () => null}, fetch: async () => ({ok: true, json: async () => ({...config})}),
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
    test(`Paid ${instrument} starts fully unlocked without store calls or messages (${state}, store unavailable)`, async () => {
      const {ctx, storeCalls, reloads, rows} = await startup({instrument, unlocked: true, nativeBilling: false}, cache);
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
