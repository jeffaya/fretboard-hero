(() => {
  'use strict';
  // Native apps open Privacy in a separate browser, so carry the active universe.
  const privacy=document.querySelector('a[href^="https://fretboard-hero.com/privacy"]');
  if(privacy){
    const url=new URL(privacy.href);
    url.searchParams.set('instrument',window.FRETBOARD_SITE_CONFIG.instrument);
    privacy.href=url.href;
  }
  // Guides currently exist in French and English. Keep web navigation local;
  // native builds open the public document outside the app like Privacy.
  const guide=document.querySelector('.guide-card');
  if(guide){
    const route=window.FretboardI18n?.locale==='fr'?'/fr/guitare/':'/en/guitar/';
    guide.href=route;
    if(['android','ios'].includes(window.Capacitor?.getPlatform?.())){
      guide.href=new URL(route,'https://fretboard-hero.com').href;
      guide.target='_blank';guide.rel='noopener noreferrer';
    }
  }
  // Instrument selection and the shared footer entry; motion is automatic in CSS.
  const dock=document.querySelector('.home-instruments');
  const buttons=[...document.querySelectorAll('[data-home-instrument]')];
  const preferred=buttons.find(button=>button.dataset.homeInstrument===window.FRETBOARD_SITE_CONFIG.defaultInstrument);
  if(preferred)dock.prepend(preferred);
  buttons.forEach(button => {
    const instrument = button.dataset.homeInstrument;
    const active = instrument === window.FRETBOARD_SITE_CONFIG.instrument;
    button.setAttribute('aria-pressed', String(active));
    button.addEventListener('click', () => {
      if (active) return;
      try {
        localStorage.setItem('fretboard-instrument', instrument);
      } catch { /* URL navigation still works when persistent storage is disabled. */ }
      const destination=new URL(location.href);
      destination.searchParams.set('instrument',instrument);
      location.assign(destination.href);
    });
  });
  if(!window.FRETBOARD_ACCESS.unlocked){
    const entry=document.createElement('span'),separator=document.createElement('span'),download=document.createElement('button');
    entry.className='home-footer-entry';
    separator.className='home-footer-separator';separator.setAttribute('aria-hidden','true');
    download.className='home-footer-link';download.type='button';
    download.textContent=window.FRETBOARD_SITE_CONFIG.nativeBilling?'Unlock full access':'Get the app';
    download.setAttribute('aria-haspopup','dialog');
    download.addEventListener('click',()=>window.FRETBOARD_PREMIUM.open());
    entry.append(separator,download);document.querySelector('.home-footer').append(entry);
  }
})();

