(() => {
  'use strict';
  function mountDownload({config,access,open,host=document.querySelector('.home-footer')}){
    if(access.unlocked||!host)return;
    const entry=document.createElement('span'),separator=document.createElement('span'),download=document.createElement('button');
    entry.className='home-footer-entry';
    separator.className='home-footer-separator';separator.setAttribute('aria-hidden','true');
    download.className='home-footer-link';download.type='button';
    download.textContent=window.FretboardI18n?.text(config.nativeBilling?'Unlock full access':'Get the app')||(config.nativeBilling?'Unlock full access':'Get the app');
    download.setAttribute('aria-haspopup','dialog');
    download.addEventListener('click',()=>open(download));
    entry.append(separator,download);host.append(entry);
  }
  window.FretboardFooter={mountDownload};
})();
