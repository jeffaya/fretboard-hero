(() => {
  'use strict';
  const languages=[['en','English'],['es','Español'],['fr','Français'],['de','Deutsch'],['it','Italiano'],['ja','日本語'],['ko','한국어'],['zh-CN','简体中文'],['pt-BR','Português (Brasil)'],['hi','हिन्दी'],['id','Bahasa Indonesia'],['ar','العربية'],['bn','বাংলা']];
  const supported=new Set(languages.map(x=>x[0])),storageKey='fretboard-language';
  function match(value){
    if(typeof value!=='string')return null;
    const tag=value.replace(/_/g,'-').toLowerCase(),base=tag.split('-')[0];
    if(base==='zh')return 'zh-CN';
    if(base==='pt')return 'pt-BR';
    return supported.has(base)?base:null;
  }
  function detect(preferences){for(const language of preferences||[]){const value=match(language);if(value)return value}return 'en'}
  let locale='en',dictionary={},lower=new Map(),patterns=[],translatedValues=new Set();
  const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  function install(messages){
    dictionary=messages;translatedValues=new Set(Object.values(messages).map(value=>value.toLowerCase()));lower=new Map(Object.keys(messages).map(key=>[key.toLowerCase(),key]));
    patterns=Object.entries(messages).filter(([key])=>key.includes('{')).map(([key,value])=>{
      const names=[];let expression='',end=0;
      for(const token of key.matchAll(/\{(\w+)\}/g)){expression+=escape(key.slice(end,token.index));const prior=names.indexOf(token[1]);if(prior>=0)expression+=`\\${prior+1}`;else{names.push(token[1]);const numeric=['n','a','b','fret','string','score','seconds','correct'].includes(token[1]);expression+=numeric?'([0-9][0-9.,\\u00a0\\u202f]*)':token[1]==='instrument'?'(Guitar|Bass(?: 4)?|Ukulele)':'(.+?)'}end=token.index+token[0].length}
      expression+=escape(key.slice(end));return {regex:new RegExp('^'+expression+'$','iu'),names,value};
    }).sort((a,b)=>b.regex.source.length-a.regex.source.length);
  }
  // Canonical pitches never change; call only at musical presentation boundaries.
  function formatNote(input,language,messages){
    const found=/^([A-Ga-g])([#♯♭b]{0,2})(m|°|7|maj7|m7)?$/.exec(input);
    if(!found)return input;
    const [,letter,accidental,suffix='']=found,base=letter.toUpperCase();
    if(language==='de'&&base==='B'&&(accidental==='♭'||accidental==='b'))return 'B'+suffix;
    return (messages['Note name '+base]||base)+accidental+suffix;
  }
  const note=input=>formatNote(input,locale,dictionary);
  function music(input){
    // Strings such as EAD are tuning sets, never the CAGED system name.
    return input.replace(/\b[A-G]{2,3}\b/g,set=>[...set].map(note).join('–'))
      .replace(/(?<![\p{L}\p{N}])([A-G][#♯♭b]{0,2}(?:maj7|m7|m|°|7)?)(?![\p{L}\p{N}])/gu,token=>note(token));
  }
  function text(input,depth=0){
    if(typeof input!=='string'||locale==='en'||depth>5)return input;
    const core=input.trim();if(!core||!/[A-Za-z]/.test(core)||/^(?:(?:Guitar|Bass|Ukulele) )?Fretboard Hero(?: 🎸)?$/.test(core))return input;
    if(translatedValues.has(core.toLowerCase()))return input;
    let result=dictionary[core];
    if(result===undefined){const key=lower.get(core.toLowerCase());if(key){result=dictionary[key];if(core===core.toUpperCase())result=result.toLocaleUpperCase(locale)}}
    if(result===undefined&&/[·•]/.test(core))result=core.split(/([·•])/).map(part=>text(part,depth+1)).join('');
    if(result===undefined){
      for(const pattern of patterns){const found=pattern.regex.exec(core);if(found){result=pattern.value.replace(/\{(\w+)\}/g,(_,name)=>(['note','shape','set','sets'].includes(name)?music(found[pattern.names.indexOf(name)+1]):text(found[pattern.names.indexOf(name)+1],depth+1)));break}}
    }
    if(result===undefined){
      const key=/^([A-G][#♯♭]?)\s+(major|minor)$/i.exec(core);
      if(key)result=note(key[1])+' '+text(key[2],depth+1);
      else if(/^[A-Za-z ]+: /.test(core)){const split=core.indexOf(': ');result=text(core.slice(0,split),depth+1)+': '+text(core.slice(split+2),depth+1)}
      else if(core.includes('\n'))result=core.split('\n').map(part=>text(part,depth+1)).join('\n');
      else if(/\. /.test(core))result=core.split(/(?<=\.) /).map(part=>text(part,depth+1)).join(' ');
      else {const decorated=/^([^A-Za-z]+)([A-Za-z].*)$/u.exec(core);if(decorated)result=decorated[1]+text(decorated[2],depth+1)}
    }
    return result===undefined?input:input.slice(0,input.indexOf(core))+result+input.slice(input.indexOf(core)+core.length);
  }
  const rendered=new WeakMap();
  const musicalContext='#rootControls,#mapNoteControls,#routineRootControls,#learnPositionButtons,#quizChord,.degree-chord strong,#circleRelative,#circleSignature';
  const skip=element=>!element||element.closest('script,style,code,[data-no-i18n],.language-picker');
  function translateNode(node){
    if(node.nodeType===3){if(skip(node.parentElement))return;if(rendered.get(node)===node.data)return;const value=node.parentElement.closest(musicalContext)&&!/^([A-G][#♯♭]?)\s+(major|minor)$/i.test(node.data.trim())?text(music(node.data)):text(node.data);rendered.set(node,value);if(value!==node.data)node.data=value;return}
    if(node.nodeType!==1||skip(node))return;
    for(const attr of ['aria-label','title','placeholder','alt'])if(node.hasAttribute(attr)){const original=node.getAttribute(attr),value=text(original);if(value!==original)node.setAttribute(attr,value)}
    for(const child of node.childNodes)translateNode(child);
  }
  function metadata(){
    if(locale==='en')return;
    const description=text('Learn notes, scales, triads and chords. Build a daily routine and test your fretboard knowledge.');
    document.title=(window.FRETBOARD_ACTIVE_PRODUCT?.name||'Fretboard Hero')+' — '+text('Learn the fretboard');
    for(const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]'])document.querySelector(selector)?.setAttribute('content',description);
    for(const selector of ['meta[property="og:title"]','meta[name="twitter:title"]'])document.querySelector(selector)?.setAttribute('content',document.title);
    for(const selector of ['meta[property="og:image:alt"]','meta[name="twitter:image:alt"]'])document.querySelector(selector)?.setAttribute('content',document.title);
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content',({'en':'en_US','zh-CN':'zh_CN','pt-BR':'pt_BR'})[locale]||locale+'_'+({'es':'ES','fr':'FR','de':'DE','it':'IT','ja':'JP','ko':'KR','hi':'IN','id':'ID','ar':'SA','bn':'BD'})[locale]);
    const structured=document.querySelector('#productStructuredData');if(structured){try{const data=JSON.parse(structured.textContent);data.inLanguage=locale;data.description=description;data.featureList=['Learn','Daily Routine','Fretboard Map','Circle of Fifths','Quiz'].map(value=>text(value));structured.textContent=JSON.stringify(data)}catch{}}
  }
  function mount({choices,selected,navigate,roots=[document.body],updateMetadata=true,scrollRoot=document.querySelector('#home')||window}={}){
    const wrapper=document.querySelector('.language-picker');
    let saved;try{saved=localStorage.getItem(storageKey)}catch{}
    const requested=new URL(location.href).searchParams.get('lang');
    selected=selected??(supported.has(requested)?requested:supported.has(saved)?saved:'auto');
    choices=choices||[['auto',text('Automatic')],...languages];
    const trigger=document.createElement('button');trigger.type='button';trigger.className='language-trigger home-footer-link';
    trigger.setAttribute('aria-haspopup','menu');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','language-menu');
    trigger.setAttribute('popovertarget','language-menu');
    const menu=document.createElement('div');menu.id='language-menu';menu.className='language-menu';menu.setAttribute('popover','auto');menu.setAttribute('role','menu');menu.setAttribute('aria-label',text('Language'));
    trigger.innerHTML='<svg class="language-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6.5h14M5 17.5h14"/></svg>';
    const caption=document.createElement('span');caption.textContent=languages.find(([value])=>value===locale)[1];caption.lang=locale;trigger.append(caption);
    trigger.setAttribute('aria-label',text('Language')+': '+caption.textContent);
    choices.forEach(([value,name])=>{
      const option=document.createElement('button');option.type='button';option.dataset.language=value;option.setAttribute('role','menuitemradio');option.setAttribute('aria-checked',String(value===selected));
      option.textContent=name;option.autofocus=value===selected;if(value!=='auto')option.lang=value;
      option.addEventListener('click',()=>{
        menu.hidePopover();
        try{if(value==='auto')localStorage.removeItem(storageKey);else localStorage.setItem(storageKey,value)}catch{}
        if(navigate){navigate(value);return}
        const url=new URL(location.href);if(value==='auto')url.searchParams.delete('lang');else url.searchParams.set('lang',value);location.assign(url.href);
      });menu.append(option);
    });
    function positionMenu(){
      const r=trigger.getBoundingClientRect(),width=Math.min(240,innerWidth-24);
      menu.style.width=width+'px';menu.style.maxHeight=Math.min(360,Math.max(44,r.top-20))+'px';
      menu.style.left=Math.max(12,Math.min(r.left,innerWidth-width-12))+'px';
      menu.style.bottom=Math.max(12,innerHeight-r.top+8)+'px';
    }
    trigger.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!menu.matches(':popover-open'))menu.showPopover()}});
    menu.addEventListener('beforetoggle',e=>{if(e.newState==='open')positionMenu()});
    menu.addEventListener('toggle',()=>{
      const isOpen=menu.matches(':popover-open');trigger.setAttribute('aria-expanded',String(isOpen));
      if(isOpen){
        const focused=menu.contains(document.activeElement)?document.activeElement:menu.querySelector('[aria-checked="true"]');
        menu.scrollTop=focused.offsetTop-(menu.clientHeight-focused.offsetHeight)/2;
      }
    });
    menu.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();menu.hidePopover();trigger.focus();return}
      const options=[...menu.querySelectorAll('button')],index=options.indexOf(document.activeElement);
      if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
        e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?options.length-1:(index+(e.key==='ArrowDown'?1:options.length-1))%options.length;options[next].focus();
      }
    });
    menu.addEventListener('focusout',e=>{if(e.relatedTarget&&e.relatedTarget!==trigger&&!menu.contains(e.relatedTarget)&&menu.matches(':popover-open'))menu.hidePopover()});
    window.addEventListener('resize',()=>{if(menu.matches(':popover-open'))positionMenu()});
    scrollRoot.addEventListener('scroll',()=>{
      if(!menu.matches(':popover-open'))return;
      const r=trigger.getBoundingClientRect();
      if(r.top<64||r.bottom>innerHeight)menu.hidePopover();else positionMenu();
    });
    window.addEventListener('languagechange',()=>{if(selected==='auto'&&detect(navigator.languages)!==locale)location.reload()});
    wrapper.replaceChildren(trigger,menu);
    roots.forEach(translateNode);if(updateMetadata)metadata();
    // Legacy renderers write text directly. Observe only changed nodes/labels,
    // never rewrite HTML, canonical gameplay attributes, or event handlers.
    const observer=new MutationObserver(records=>{
      for(const change of records){if(change.type==='childList')change.addedNodes.forEach(translateNode);else if(change.type==='characterData')translateNode(change.target);else{const el=change.target;if(!skip(el)){const value=el.getAttribute(change.attributeName),translated=text(value);if(value!==translated)el.setAttribute(change.attributeName,translated)}}}
    });
    roots.forEach(root=>observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt']}));
  }
  async function initialize(pageLocale){
    let saved;try{saved=localStorage.getItem(storageKey)}catch{}
    const requested=new URL(location.href).searchParams.get('lang');
    locale=supported.has(pageLocale)?pageLocale:match(requested)||match(saved)||detect(navigator.languages?.length?navigator.languages:[navigator.language]);
    if(locale!=='en'){
      try{const response=await fetch('/locales/'+locale+'.json?v=10.58.0');if(!response.ok)throw Error('Locale unavailable');install(await response.json())}catch{locale=supported.has(pageLocale)?pageLocale:'en';install({})}
    }
    document.querySelector('a[href^="https://fretboard-hero.com/privacy"]')?.setAttribute('href','https://fretboard-hero.com/privacy?lang='+locale);
    document.documentElement.lang=locale;document.documentElement.dir=locale==='ar'?'rtl':'ltr';
    return locale;
  }
  if(typeof module==='object'&&module.exports)module.exports={formatNote};
  if(typeof window!=='undefined')window.FretboardI18n={initialize,mount,text,note,music,detect,match,languages,get locale(){return locale}};
})();

