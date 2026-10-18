(() => {
  'use strict';
  // All translations remain readable in the initial HTML without JavaScript.
  const articles=[...document.querySelectorAll('article[lang]')],links=[...document.querySelectorAll('[data-policy-language]')];
  const menu=document.querySelector('.language-menu'),trigger=menu.querySelector('summary');
  const label=document.querySelector('#language-label'),main=document.querySelector('main');
  const skip=document.querySelector('.skip-link'),back=document.querySelector('#back-label');
  const supported=new Set(articles.map(article=>article.lang)),storageKey='fretboard-language';
  const selection=window.FretboardInstrumentSelection,products=new Map();
  let defaultInstrument='guitar',instrument=selection.resolve(defaultInstrument),brandName='Fretboard Hero';
  function updateHomeLinks(locale){
    document.querySelectorAll('[data-policy-home]').forEach(link=>{link.href='./?lang='+locale+'&instrument='+instrument});
  }
  function updateTitle(locale){
    document.title=articles.find(article=>article.lang===locale).querySelector('h1').textContent+' — '+brandName;
  }
  async function updateInstrument(){
    const chosen=selection.resolve(defaultInstrument);instrument=chosen;
    document.documentElement.dataset.instrument=chosen;
    updateHomeLinks(document.documentElement.lang);
    const entry=selection.catalog[chosen];
    if(!products.has(chosen)){
      products.set(chosen,new Promise((resolve,reject)=>{
        const script=document.createElement('script');script.src=entry.product;
        script.onload=resolve;script.onerror=()=>reject(new Error('Product branding unavailable'));
        document.head.appendChild(script);
      }).catch(error=>{products.delete(chosen);throw error}));
    }
    try{
      await products.get(chosen);
      if(instrument!==chosen)return;
      const product=window.FRETBOARD_PRODUCTS[entry.productKey];
      brandName=product.branding?.name||product.name;
      document.querySelector('.brand svg').setAttribute('viewBox',product.assets.heroLogoViewport);
      document.querySelector('.brand').setAttribute('aria-label',brandName);
      document.querySelector('link[rel="icon"]').href='./assets/instruments/'+entry.productKey+'/favicon.ico';
      updateTitle(document.documentElement.lang);
    }catch{ /* The static policy and its navigation stay usable if branding fails to load. */ }
  }
  function match(value){
    if(typeof value!=='string')return null;
    const base=value.replace(/_/g,'-').toLowerCase().split('-')[0];
    return base==='pt'?'pt-BR':base==='zh'?'zh-CN':supported.has(base)?base:null;
  }
  function requested(){
    const url=new URL(location.href),hash=url.hash.slice(1);
    return articles.find(article=>hash===article.lang||hash.startsWith(article.lang+'-'))?.lang||match(url.searchParams.get('lang'));
  }
  function preferred(){
    let saved;try{saved=localStorage.getItem(storageKey)}catch{}
    return match(saved)||(navigator.languages||[navigator.language]).map(match).find(Boolean)||'en';
  }
  function select(locale){
    const article=articles.find(item=>item.lang===locale);if(!article)return;
    articles.forEach(item=>{item.hidden=item!==article});
    links.forEach(link=>{link.setAttribute('aria-current',String(link.dataset.policyLanguage===locale))});
    document.documentElement.lang=locale;
    updateTitle(locale);
    document.querySelector('meta[name="description"]').content=article.querySelector('.policy-intro').textContent;
    label.textContent=links.find(link=>link.dataset.policyLanguage===locale).textContent;
    trigger.setAttribute('aria-label',article.dataset.languageLabel);
    menu.querySelector('nav').setAttribute('aria-label',article.dataset.languageLabel);
    skip.textContent=article.dataset.skipLabel;back.textContent=article.dataset.backLabel;
    updateHomeLinks(locale);
    menu.open=false;
  }
  links.forEach(link=>link.addEventListener('click',event=>{
    if(event.button>0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();const locale=link.dataset.policyLanguage;
    try{localStorage.setItem(storageKey,locale)}catch{}
    const url=new URL(location.href);url.searchParams.set('lang',locale);url.hash='';
    history.pushState(null,'',url);select(locale);main.focus();main.scrollIntoView({block:'start'});
  }));
  document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false});
  menu.addEventListener('keydown',event=>{if(event.key==='Escape'){menu.open=false;trigger.focus();event.preventDefault()}});
  menu.addEventListener('focusout',event=>{if(event.relatedTarget&&!menu.contains(event.relatedTarget))menu.open=false});
  window.addEventListener('popstate',()=>{select(requested()||preferred());void updateInstrument()});
  window.addEventListener('hashchange',()=>select(requested()||preferred()));
  select(requested()||preferred());
  (async()=>{
    try{
      const response=await fetch('./site.config.json',{cache:'no-store'});
      if(response.ok){const config=await response.json();if(Object.hasOwn(selection.catalog,config.instrument))defaultInstrument=config.instrument}
    }catch{ /* Explicit URLs and remembered instruments still work offline. */ }
    await updateInstrument();
  })();
})();
