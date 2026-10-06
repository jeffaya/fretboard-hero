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
        sessionStorage.setItem('fretboard-home-instrument', instrument);
      } catch {
        window.alert('Allow session storage to change instruments on this device.');
        return;
      }
      location.reload();
    });
  });
})();
