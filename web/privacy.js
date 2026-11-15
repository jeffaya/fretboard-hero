(() => {
 'use strict';
 const articles=[...document.querySelectorAll('article[lang]')];
 const policies=new Map(articles.map(article=>[article.lang,{article,title:article.querySelector('h1').textContent,intro:article.querySelector('.policy-intro').textContent}]));
 const homeLinks=[...document.querySelectorAll('[data-policy-home]')];
 const selection=window.FretboardInstrumentSelection;
 const data=JSON.parse(document.querySelector('#policyConfig').textContent);
 let instrument=selection.resolve('guitar'),brandName='Fretboard Hero';
 function match(value){
  if(typeof value!=='string')return null;
  const base=value.replace(/_/g,'-').toLowerCase().split('-')[0];
  return base==='pt'?'pt-BR':base==='zh'?'zh-CN':policies.has(base)?base:null;
 }
 function requested(){
  const url=new URL(location.href),hash=url.hash.slice(1);
  return articles.find(a=>hash===a.lang||hash.startsWith(a.lang+'-'))?.lang||match(url.searchParams.get('lang'));
 }
 function preferred(){
  let saved;try{saved=localStorage.getItem('fretboard-language')}catch{}
  return match(saved)||(navigator.languages||[navigator.language]).map(match).find(Boolean)||'en';
 }
 const locale=requested()||preferred(),policy=policies.get(locale);
 articles.forEach(a=>{a.hidden=a!==policy.article});
 document.documentElement.lang=locale;
 document.querySelector('meta[name="description"]').content=policy.intro;
 document.querySelector('.skip-link').textContent=policy.article.dataset.skipLabel;
 function updateNavigation(){
  homeLinks.forEach(link=>{link.href='./?lang='+locale+'&instrument='+instrument});
  document.title=policy.title+' — '+brandName;
 }
 updateNavigation();
 (async()=>{
  let defaultInstrument='guitar';
  try{const response=await fetch('./site.config.json',{cache:'no-store'});if(response.ok){const config=await response.json();if(Object.hasOwn(selection.catalog,config.instrument))defaultInstrument=config.instrument}}catch{}
  instrument=selection.resolve(defaultInstrument);
  document.documentElement.dataset.instrument=instrument;
  try{const product=await window.FretboardDocumentBranding.apply(instrument,'./');brandName=product.branding?.name||product.name}catch{}
  updateNavigation();
  await window.FretboardDocumentShell.mount({...data,locale,instrument,ui:data.localizedUI[locale]},{navigate:next=>{
   const url=new URL(location.href);url.searchParams.set('lang',next);url.searchParams.set('instrument',instrument);url.hash='';location.assign(url.href);
  }});
 })().catch(error=>console.error('Privacy controls unavailable',error));
 // Old /privacy#xx-section links still select the right complete translation.
 function restore(){if((requested()||preferred())!==locale||selection.resolve(instrument)!==instrument)location.reload()}
 window.addEventListener('popstate',restore);window.addEventListener('hashchange',restore);
})();
