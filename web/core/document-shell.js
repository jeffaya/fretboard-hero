(() => {
 'use strict';
 // Guides and Privacy share footer markup, language control and download modal.
 async function mount(data,{navigate}={}){
  const host=document.querySelector('.public-shell'),footer=host.querySelector('.home-footer');
  const config={instrument:data.instrument,stores:data.stores},access=window.FretboardAccess.create(false);
  await window.FretboardI18n.initialize(data.locale);
  const privacy=footer.querySelector('a[href^="https://fretboard-hero.com/privacy"]');
  privacy.textContent=data.ui.privacy;
  footer.querySelector('a[href^="mailto:"]').textContent=data.ui.contact;
  const url=new URL(privacy.href);
  url.searchParams.set('lang',data.locale);
  url.searchParams.set('instrument',data.instrument);
  privacy.href=url.href;
  const modal=window.FretboardAccess.mount(config,access,{host,
   menus:document.querySelector('#documentAppMenu').content.querySelectorAll('.hero-btn[data-go]')});
  window.FretboardFooter.mountDownload({config,access,host:footer,open:button=>modal.open(button)});
  window.FretboardI18n.mount({selected:data.locale,choices:data.languages.map(l=>[l.locale,l.label]),
   roots:[footer,host.querySelector('.premium-overlay')],updateMetadata:false,
   navigate:navigate||((locale)=>location.assign(data.languages.find(l=>l.locale===locale).href+location.search))});
 }
 window.FretboardDocumentShell={mount};
})();
