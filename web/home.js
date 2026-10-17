(() => {
  'use strict';
  // The home only handles instrument selection; motion is automatic in CSS.
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
  if(!window.FRETBOARD_SITE_CONFIG.nativeBilling&&!window.FRETBOARD_ACCESS.unlocked){
    const separator=document.createElement('span'),download=document.createElement('button');
    separator.className='home-footer-separator';separator.setAttribute('aria-hidden','true');
    download.className='home-footer-link';download.type='button';download.textContent='Get the app';
    download.setAttribute('aria-haspopup','dialog');
    download.addEventListener('click',()=>window.FRETBOARD_PREMIUM.open());
    document.querySelector('.home-footer').append(separator,download);
  }
})();
