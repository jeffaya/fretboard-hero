(() => {
  'use strict';
  // Shared by the app bootstrap and Privacy: URL, remembered universe, build default.
  const catalog=Object.freeze({
    'guitar':{instrumentKey:'guitar',instrument:'./instruments/guitar.js?v=10.26.4',productKey:'guitar',product:'./products/guitar-fretboard-hero.js?v=10.49.22'},
    'bass-4':{instrumentKey:'bass4',instrument:'./instruments/bass-4.js?v=10.26.4',productKey:'bass',product:'./products/bass-fretboard-hero.js?v=10.49.22'},
    'ukulele':{instrumentKey:'ukulele',instrument:'./instruments/ukulele.js?v=10.26.4',productKey:'ukulele',product:'./products/ukulele-fretboard-hero.js?v=10.49.22'},
  });
  const supported=value=>Object.hasOwn(catalog,value);
  function resolve(defaultInstrument,search=location.search){
    if(!supported(defaultInstrument))throw new Error('Unknown instrument "'+defaultInstrument+'". Supported: '+Object.keys(catalog).join(', '));
    let selected;try{
      selected=localStorage.getItem('fretboard-instrument')||sessionStorage.getItem('fretboard-home-instrument');
      if(selected&&!supported(selected)){localStorage.removeItem('fretboard-instrument');sessionStorage.removeItem('fretboard-home-instrument')}
    }catch{}
    const requested=new URLSearchParams(search).get('instrument');
    if(supported(requested)){try{localStorage.setItem('fretboard-instrument',requested)}catch{}return requested}
    return supported(selected)?selected:defaultInstrument;
  }
  window.FretboardInstrumentSelection=Object.freeze({catalog,resolve});
})();
