(() => {
  'use strict';
  const logo=document.querySelector('#home .hero-logo svg');
  const artworkReady=new Promise(resolve=>{
    const artwork=logo.querySelector('image');
    artwork.addEventListener('load',()=>resolve(true),{once:true});
    artwork.addEventListener('error',()=>resolve(false),{once:true});
    artwork.setAttribute('href','./assets/home/product-wordmarks.webp');
  });
  const CATALOG={
    'guitar':{instrumentKey:'guitar',instrument:'./instruments/guitar.js?v=10.19.2',productKey:'guitar',product:'./products/guitar-fretboard-hero.js?v=10.22.0'},
    'bass-4':{instrumentKey:'bass4',instrument:'./instruments/bass-4.js?v=10.19.2',productKey:'bass',product:'./products/bass-fretboard-hero.js?v=10.22.0'},
    'ukulele':{instrumentKey:'ukulele',instrument:'./instruments/ukulele.js?v=10.19.2',productKey:'ukulele',product:'./products/ukulele-fretboard-hero.js?v=10.22.0'},
  };
  const CORE=['music-theory','circle-of-fifths','circle-renderer','play-exercises','play-renderer','play-session','tuning','fretboard-engine','fretboard-layout','fretboard-appearance','fretboard-map','pentatonic-renderer','triad-engine','arpeggio-engine','chord-engine','quiz-engine','controls','mode-registry','product-shell'].map(n=>`./core/${n}.js?v=${['play-session','circle-renderer','fretboard-map'].includes(n)?'10.20.0':n==='product-shell'?'10.22.0':'10.19.2'}`);
  const MODES=['pentatonic','triads','chords','arpeggios'].map(n=>`./modes/${n}.js?v=10.19.2`);
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.async=false;s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error(`Unable to load ${src}`));document.head.appendChild(s);});
  const fail=err=>{document.body.setAttribute('aria-busy','false');console.error(err);document.body.innerHTML=`<main style="min-height:100vh;display:grid;place-items:center;background:#05080b;color:#f8fbff;font-family:system-ui;padding:24px"><div><h1 style="color:#ff3ec9">CONFIGURATION ERROR</h1><p>${String(err.message||err)}</p><p>Check <code>site.config.json</code> and README.md.</p></div></main>`;};
  (async()=>{
    try{
      const response=await fetch('./site.config.json',{cache:'no-store'});if(!response.ok)throw new Error(`site.config.json returned HTTP ${response.status}`);
      const config=await response.json();
      await load('./core/access.js?v=10.21.1');
      window.FRETBOARD_ACCESS=FretboardAccess.create(await FretboardAccess.resolve(config,location.search));
      const defaultInstrument=config.instrument;
      if(!CATALOG[defaultInstrument])throw new Error(`Unknown instrument "${defaultInstrument}". Supported: ${Object.keys(CATALOG).join(', ')}`);
      // Session-only choice preserves the default identity of each native build.
      let selected;const linkedInstrument=new URLSearchParams(location.search).get('instrument');try{
        selected=sessionStorage.getItem('fretboard-home-instrument');
        if(selected&&!CATALOG[selected])sessionStorage.removeItem('fretboard-home-instrument');
      }catch{}
      if(Object.hasOwn(CATALOG,linkedInstrument))config.instrument=linkedInstrument;
      else if(CATALOG[selected])config.instrument=selected;
      const entry=CATALOG[config.instrument];if(!entry)throw new Error(`Unknown instrument "${config.instrument}". Supported: ${Object.keys(CATALOG).join(', ')}`);
      window.FRETBOARD_SITE_CONFIG=Object.freeze({...config,defaultInstrument});
      // Fetch scripts concurrently while classic-script async=false preserves execution order.
      await Promise.all([...CORE,...MODES,entry.instrument,entry.product].map(load));
      const instrument=window.FRETBOARD_INSTRUMENTS?.[entry.instrumentKey],product=window.FRETBOARD_PRODUCTS?.[entry.productKey];
      if(!instrument)throw new Error(`Instrument profile did not register: ${entry.instrumentKey}`);if(!product)throw new Error(`Product profile did not register: ${entry.productKey}`);
      window.FRETBOARD_ACTIVE_PRODUCT={...product,instrument:entry.instrumentKey};window.FRETBOARD_ACTIVE_INSTRUMENT=instrument;
      document.documentElement.dataset.instrument=config.instrument;
      window.ProductShell.apply(product,instrument);
      await load('./home.js?v=10.22.0');
      await document.fonts.load('800 26px "Hero Condensed"').catch(()=>[]);
      await load('./app.js?v=10.22.0');
      if(!await artworkReady){
        logo.setAttribute('hidden','');
        const fallback=document.createElement('span');
        fallback.className='hero-logo-fallback';fallback.textContent=product.name;
        logo.parentElement.append(fallback);
      }
      document.body.removeAttribute('data-loading');
      document.body.setAttribute('aria-busy','false');
      document.querySelector('#startupLoader').hidden=true;
    }catch(err){fail(err);}
  })();
})();
