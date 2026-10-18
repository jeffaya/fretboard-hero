(() => {
  'use strict';
  // All translations remain readable in the initial HTML without JavaScript.
  const articles=[...document.querySelectorAll('article[lang]')],links=[...document.querySelectorAll('[data-policy-language]')];
  const menu=document.querySelector('.language-menu'),trigger=menu.querySelector('summary');
  const label=document.querySelector('#language-label'),main=document.querySelector('main');
  const skip=document.querySelector('.skip-link'),back=document.querySelector('#back-label');
  const supported=new Set(articles.map(article=>article.lang)),storageKey='fretboard-language';
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
    document.title=article.querySelector('h1').textContent+' — Fretboard Hero';
    document.querySelector('meta[name="description"]').content=article.querySelector('.policy-intro').textContent;
    label.textContent=links.find(link=>link.dataset.policyLanguage===locale).textContent;
    trigger.setAttribute('aria-label',article.dataset.languageLabel);
    menu.querySelector('nav').setAttribute('aria-label',article.dataset.languageLabel);
    skip.textContent=article.dataset.skipLabel;back.textContent=article.dataset.backLabel;
    document.querySelectorAll('[data-policy-home]').forEach(link=>{link.href='./?lang='+locale});
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
  window.addEventListener('popstate',()=>select(requested()||preferred()));
  window.addEventListener('hashchange',()=>select(requested()||preferred()));
  select(requested()||preferred());
})();
