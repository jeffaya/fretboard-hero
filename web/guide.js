(() => {
  'use strict';
  async function initialize(){
    const data=JSON.parse(document.querySelector('#guideConfig').textContent);
    const host=document.querySelector('.public-shell'),footer=host.querySelector('.home-footer');
    const config={instrument:'guitar',stores:data.stores},access=window.FretboardAccess.create(false);
    await window.FretboardI18n.initialize(data.locale);
    // The guide is a public document. Reuse the web download dialog without
    // booting the app, changing its access state or replacing the article.
    const modal=window.FretboardAccess.mount(config,access,{host,
      menus:document.querySelector('#guideAppMenu').content.querySelectorAll('.hero-btn[data-go]')});
    window.FretboardFooter.mountDownload({config,access,host:footer,open:button=>modal.open(button)});
    window.FretboardI18n.mount({selected:data.locale,choices:data.languages.map(lang=>[lang.locale,lang.label]),
      roots:[footer,host.querySelector('.premium-overlay')],updateMetadata:false,
      navigate:locale=>location.assign(data.languages.find(lang=>lang.locale===locale).href)});
    const privacy=footer.querySelector('a[href^="https://fretboard-hero.com/privacy"]');
    const url=new URL(privacy.href);url.searchParams.set('instrument','guitar');privacy.href=url.href;
    for(const button of document.querySelectorAll('[data-get-app]')){
      button.addEventListener('click',()=>modal.open(button));button.disabled=false;
    }
  }
  initialize().catch(error=>console.error('Guide controls unavailable',error));
})();
