(() => {
  'use strict';
  // Native apps open Privacy in a separate browser, so carry the active universe.
  const privacy=document.querySelector('a[href^="https://fretboard-hero.com/privacy"]');
  if(privacy){
    const url=new URL(privacy.href);
    url.searchParams.set('instrument',window.FRETBOARD_SITE_CONFIG.instrument);
    privacy.href=url.href;
  }
  // Preserve the active language and instrument for every guide. Keep navigation local;
  // native builds open the public document outside the app like Privacy.
  const guide=document.querySelector('.guide-card');
  if(guide){
    const route=window.FretboardGuideRoutes.route(window.FretboardI18n?.locale,window.FRETBOARD_SITE_CONFIG.instrument);
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
  window.FretboardFooter.mountDownload({config:window.FRETBOARD_SITE_CONFIG,access:window.FRETBOARD_ACCESS,
    open:button=>window.FRETBOARD_PREMIUM.open(button)});
})();
