(() => {
  'use strict';
  const DEMO_MAP_NOTES=Object.freeze(['A']);
  async function resolve(config,search=''){
    if(typeof config.unlocked!=='boolean')throw new Error('site.config.json: unlocked must be true or false');
    if(config.unlocked)return true;
    const key=new URLSearchParams(search).get('key');
    if(!key||!config.testKeyHash)return false;
    const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));
    return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')===config.testKeyHash;
  }
  function create(unlocked){
    const allows=(feature,value)=>unlocked||({root:value==='A',quality:value==='minor',mapNote:value==='A',play:false,playRoot:value==='A',playQuality:value==='minor',playStyle:value==='Blues',playLevel:value==='Beginner',circle:false,position:String(value)==='1',mode:value==='pentatonic'}[feature]===true);
    return Object.freeze({unlocked,allows,notes:unlocked?null:DEMO_MAP_NOTES});
  }
  function storeUrl(config,platform){
    try{const value=config.stores?.[config.instrument]?.[platform];if(!value)return null;const url=new URL(value);return url.protocol==='https:'?url.href:null}catch{return null}
  }
  let qrLoad;
  function loadQR(){
    if(window.FretboardQRCode)return Promise.resolve();
    if(!qrLoad)qrLoad=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='./vendor/qrcode.js?v=10.21.0';script.onload=resolve;script.onerror=()=>{qrLoad=null;reject(new Error('QR script failed'))};document.head.append(script)});
    return qrLoad;
  }
  function qrSvg(url){
    const qr=new window.FretboardQRCode(-1,1);qr.addData(url);qr.make();const size=qr.getModuleCount(),edge=size+8;let cells='';
    for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(qr.isDark(y,x))cells+=`M${x+4} ${y+4}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${edge} ${edge}" role="img" aria-label="Scan to open the store" shape-rendering="crispEdges"><path fill="#fff" d="M0 0h${edge}v${edge}H0z"/><path fill="#080d1d" d="${cells}"/></svg>`;
  }
  function mount(config,access){
    if(access.unlocked)return {open(){},mark(){}};
    const lock='<svg class="premium-lock" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
    const overlay=document.createElement('div');overlay.className='premium-overlay';overlay.hidden=true;
    overlay.innerHTML=`<section class="premium-dialog ui-panel ui-modal" role="dialog" aria-modal="true" aria-labelledby="premiumTitle" aria-describedby="premiumPitch" tabindex="-1">
      <h2 id="premiumTitle"><span>UNLOCK YOUR</span><em>FRETBOARD SKILLS</em></h2>
      <p id="premiumPitch" class="premium-pitch">Stop switching tools. Start playing solos worth sharing.</p>
      <img class="premium-neck" src="./assets/premium-neck.svg" alt="" width="800" height="130">
      <ul class="premium-skills" aria-label="Skills included"></ul>
      <div class="premium-stores"></div>
      <p class="premium-promise">One purchase. Every skill unlocked.</p>
      <button type="button" class="ui-back premium-close">← Continue exploring</button>
    </section>`;
    document.querySelector('#app').append(overlay);
    const dialog=overlay.querySelector('section'),stores=overlay.querySelector('.premium-stores');
    // Home is the single source for menu order, labels and artwork.
    for(const menu of document.querySelectorAll('#home .hero-btn[data-go]')){
      const icon=menu.querySelector('.hero-icon img'),title=menu.querySelector('.home-card-copy strong');
      if(!icon||!title)continue;
      const item=document.createElement('li'),label=document.createElement('span');
      label.textContent=title.textContent.trim();
      item.append(icon.cloneNode(true));item.append(label);
      overlay.querySelector('.premium-skills').append(item);
    }
    const icons={android:'<path fill="#32d477" d="M3 2v20l12-10Z"/><path fill="#46c5ff" d="m3 2 15 8-3 2Z"/><path fill="#ffce45" d="m15 12 3-2 4 2-4 2Z"/><path fill="#fa5b75" d="m3 22 15-8-3-2Z"/>',ios:'<path fill="currentColor" d="M15 3c-2 0-3 2-3 4 2 0 3-2 3-4ZM12 9c-3-3-8-1-8 3 0 4 3 9 5 9l3-1 3 1c2 0 4-3 5-5-4-2-4-5-1-7-2-2-4-2-7 0Z"/>'};
    const qrTargets=[];
    for(const platform of ['android','ios']){
      const url=storeUrl(config,platform),column=document.createElement('div');column.className='premium-store-column';
      const el=document.createElement(url?'a':'button');el.className='ui-primary premium-store';
      el.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[platform]}</svg><span><small>${platform==='android'?'Get it on':'Download on the'}</small><b>${platform==='android'?'Google Play':'App Store'}</b></span>`;
      if(url){el.href=url;el.target='_blank';el.rel='noopener noreferrer'}else{el.type='button';el.disabled=true;el.setAttribute('aria-label',`${platform==='android'?'Google Play':'App Store'} — store link not configured`)}
      column.append(el);
      if(url){const qr=document.createElement('figure');qr.className='premium-qr';qr.innerHTML=`<div></div><figcaption>Scan for ${platform==='android'?'Android':'iOS'}</figcaption>`;column.append(qr);qrTargets.push({url,host:qr.querySelector('div'),figure:qr})}
      stores.append(column);
    }
    const desktop=matchMedia('(min-width:1024px) and (any-hover:hover) and (any-pointer:fine)');
    let qrReady=false;
    async function prepareQR(){if(qrReady||!desktop.matches||!qrTargets.length)return;qrReady=true;try{await loadQR();for(const {url,host} of qrTargets)host.innerHTML=qrSvg(url)}catch(error){qrTargets.forEach(({figure})=>figure.hidden=true);console.error('Store QR unavailable',error)}}
    desktop.addEventListener('change',()=>{if(!overlay.hidden)prepareQR()});
    let previous,background=[];
    const close=()=>{overlay.hidden=true;background.forEach(([node,inert])=>node.inert=inert);previous?.focus()};
    const open=()=>{if(!overlay.hidden)return;previous=document.activeElement;background=[...overlay.parentElement.children].filter(n=>n!==overlay).map(n=>[n,n.inert]);background.forEach(([n])=>n.inert=true);overlay.hidden=false;dialog.focus();prepareQR()};
    overlay.querySelector('.premium-close').addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}if(e.key==='Tab'){const nodes=[...dialog.querySelectorAll('a[href],button:not(:disabled)')];const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){e.preventDefault();last.focus()}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===dialog)){e.preventDefault();first.focus()}}});
    const mark=(button,feature,value)=>{if(!button)return;const locked=!access.allows(feature,value);button.classList.toggle('premium-locked',locked);button.dataset.premiumLocked=String(locked);button.querySelector('.premium-lock')?.remove();if(locked){if(button.hasAttribute('data-premium-icon-only'))button.textContent='';button.insertAdjacentHTML('beforeend',lock)}};
    document.addEventListener('click',e=>{const button=e.target.closest('[data-premium-locked="true"]');if(button){e.preventDefault();e.stopImmediatePropagation();open()}},true);
    document.body.dataset.access='demo';
    return {open,mark};
  }
  window.FretboardAccess=Object.freeze({resolve,create,mount,storeUrl,qrSvg});
})();
