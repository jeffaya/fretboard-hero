(() => {
  'use strict';
  const DEMO_NOTES=['A','C','D','E','G'];
  async function resolve(config,search=''){
    if(typeof config.unlocked!=='boolean')throw new Error('site.config.json: unlocked must be true or false');
    if(config.unlocked)return true;
    const key=new URLSearchParams(search).get('key');
    if(!key||!config.testKeyHash)return false;
    const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));
    return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')===config.testKeyHash;
  }
  function create(unlocked){
    const allows=(feature,value)=>unlocked||({root:value==='A',quality:value==='minor',mapNote:value==='all'||DEMO_NOTES.includes(value),play:false,playRoot:value==='A',playQuality:value==='minor',playStyle:value==='Blues',playLevel:value==='Beginner',circle:false,mode:value==='pentatonic'}[feature]===true);
    return Object.freeze({unlocked,allows,notes:unlocked?null:DEMO_NOTES});
  }
  function mount(config,access){
    if(access.unlocked)return {open(){},mark(){}};
    const lock='<svg class="premium-lock" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
    const overlay=document.createElement('div');overlay.className='premium-overlay';overlay.hidden=true;
    overlay.innerHTML='<section class="premium-dialog ui-panel" role="dialog" aria-modal="true" aria-labelledby="premiumTitle" tabindex="-1"><h2 id="premiumTitle">Unlock your fretboard skills.</h2><p>Learn notes, scales, triads and chords. Build confidence across the neck — for the price of a coffee.</p><p>Get the complete app for your instrument.</p><strong>€2.99 · One payment. No subscription.</strong><div class="premium-stores"></div><button type="button" class="ui-back premium-close">← Continue exploring</button></section>';
    document.querySelector('#app').append(overlay);
    const dialog=overlay.querySelector('section'),stores=overlay.querySelector('.premium-stores');
    const urls=config.stores?.[config.instrument]||{};
    const icons={android:'<path d="M5 8h14v10H5zM8 8 6 4m10 4 2-4M3 10v6m18-6v6M8 18v3m8-3v3"/>',ios:'<path d="M15 3c-2 0-3 2-3 4 2 0 3-2 3-4ZM12 9c-3-3-8-1-8 3 0 4 3 9 5 9l3-1 3 1c2 0 4-3 5-5-4-2-4-5-1-7-2-2-4-2-7 0Z"/>'};
    for(const platform of ['android','ios']){
      const url=urls[platform],valid=typeof url==='string'&&/^https:\/\//.test(url),el=document.createElement(valid?'a':'button');
      el.className='ui-primary premium-store';el.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[platform]}</svg><span>${platform==='android'?'Get the Android app':'Get the iOS app'}${valid?'':' · Coming soon'}</span>`;
      if(valid){el.href=url;el.target='_blank';el.rel='noopener noreferrer'}else{el.type='button';el.disabled=true}
      stores.append(el);
    }
    let previous,background=[];
    const close=()=>{overlay.hidden=true;background.forEach(([node,inert])=>node.inert=inert);previous?.focus()};
    const open=()=>{if(!overlay.hidden)return;previous=document.activeElement;background=[...overlay.parentElement.children].filter(n=>n!==overlay).map(n=>[n,n.inert]);background.forEach(([n])=>n.inert=true);overlay.hidden=false;dialog.focus()};
    overlay.querySelector('.premium-close').addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}if(e.key==='Tab'){const nodes=[...dialog.querySelectorAll('a[href],button:not(:disabled)')];const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){e.preventDefault();last.focus()}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===dialog)){e.preventDefault();first.focus()}}});
    const mark=(button,feature,value)=>{if(!button)return;const locked=!access.allows(feature,value);button.classList.toggle('premium-locked',locked);button.dataset.premiumLocked=String(locked);button.querySelector('.premium-lock')?.remove();if(locked){if(button.hasAttribute('data-premium-icon-only'))button.textContent='';button.insertAdjacentHTML('beforeend',lock)}};
    document.addEventListener('click',e=>{const button=e.target.closest('[data-premium-locked="true"],[data-premium-open]');if(button){e.preventDefault();e.stopImmediatePropagation();open()}},true);
    const banner=document.createElement('div');banner.className='premium-home';banner.innerHTML='<strong>Unlock your fretboard skills.</strong><span>The complete app — for the price of a coffee.</span><button class="ui-primary" type="button" data-premium-open>Get the app · €2.99</button>';
    document.querySelector('#home .home-menu').append(banner);
    document.body.dataset.access='demo';
    return {open,mark};
  }
  window.FretboardAccess=Object.freeze({resolve,create,mount});
})();
