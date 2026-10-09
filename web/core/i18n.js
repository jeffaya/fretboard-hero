(() => {
  'use strict';
  const languages=[['en','us','English'],['es','es','Español'],['fr','fr','Français'],['de','de','Deutsch'],['it','it','Italiano'],['ja','jp','日本語'],['ko','kr','한국어'],['zh-CN','cn','简体中文'],['pt-BR','br','Português (Brasil)'],['hi','in','हिन्दी'],['id','id','Bahasa Indonesia']];
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
  function note(input){
    const found=/^([A-Ga-g])([#♯♭b]?)(m|°|7|maj7|m7)?$/.exec(input);
    if(!found)return input;
    const [,letter,accidental,suffix='']=found,base=letter.toUpperCase();
    if(locale==='de'&&base==='B'&&(accidental==='♭'||accidental==='b'))return 'B'+suffix;
    return (dictionary['Note name '+base]||base)+accidental+suffix;
  }
  function music(input){
    // Strings such as EAD are tuning sets, never the CAGED system name.
    return input.replace(/\b[A-G]{2,3}\b/g,set=>[...set].map(note).join('–'))
      .replace(/(?<![\p{L}\p{N}])([A-G][#♯♭b]?(?:maj7|m7|m|°|7)?)(?![\p{L}\p{N}])/gu,token=>note(token));
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
      else if(/[·•]/.test(core))result=core.split(/([·•])/).map(part=>text(part,depth+1)).join('');
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
    document.querySelector('meta[property="og:image:alt"]')?.setAttribute('content',document.title);
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content',({'en':'en_US','zh-CN':'zh_CN','pt-BR':'pt_BR'})[locale]||locale+'_'+({'es':'ES','fr':'FR','de':'DE','it':'IT','ja':'JP','ko':'KR','hi':'IN','id':'ID'})[locale]);
    const structured=document.querySelector('#productStructuredData');if(structured){try{const data=JSON.parse(structured.textContent);data.inLanguage=locale;data.description=description;data.featureList=['Learn','Daily Routine','Fretboard Map','Circle of Fifths','Quiz'].map(value=>text(value));structured.textContent=JSON.stringify(data)}catch{}}
  }
  function mount(){
    const wrapper=document.createElement('div');wrapper.className='language-picker';
    const detected=detect(navigator.languages?.length?navigator.languages:[navigator.language]);
    let saved;try{saved=localStorage.getItem(storageKey)}catch{}
    const requested=new URL(location.href).searchParams.get('lang');
    const selected=supported.has(requested)?requested:supported.has(saved)?saved:'auto';
    const countries=Object.fromEntries(languages.map(([value,country])=>[value,country]));
    const choices=[['auto',detected,text('Automatic')],...languages.map(([value,,name])=>[value,value,name])];
    const trigger=document.createElement('button');trigger.type='button';trigger.className='language-trigger ui-secondary';
    trigger.setAttribute('aria-haspopup','menu');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','language-menu');
    const menu=document.createElement('div');menu.id='language-menu';menu.className='language-menu';menu.setAttribute('popover','auto');menu.setAttribute('role','menu');menu.setAttribute('aria-label',text('Language'));
    function label(node,language,name){
      const flag=document.createElement('img');flag.src='./assets/flags/'+countries[language]+'.svg';flag.alt='';flag.width=24;flag.height=18;
      const caption=document.createElement('span');caption.textContent=name;node.append(flag,caption);
    }
    const chosen=choices.find(([value])=>value===selected);label(trigger,chosen[1],chosen[2]);
    trigger.setAttribute('aria-label',text('Language')+': '+chosen[2]);
    choices.forEach(([value,language,name])=>{
      const option=document.createElement('button');option.type='button';option.dataset.language=value;option.setAttribute('role','menuitemradio');option.setAttribute('aria-checked',String(value===selected));
      label(option,language,name);
      option.addEventListener('click',()=>{
        try{if(value==='auto')localStorage.removeItem(storageKey);else localStorage.setItem(storageKey,value)}catch{}
        const url=new URL(location.href);if(value==='auto')url.searchParams.delete('lang');else url.searchParams.set('lang',value);location.assign(url.href);
      });menu.append(option);
    });
    function positionMenu(){
      const r=trigger.getBoundingClientRect(),height=Math.min(360,innerHeight-24),width=Math.min(Math.max(240,r.width),innerWidth-24);
      menu.style.width=width+'px';menu.style.maxHeight=height+'px';
      menu.style.left=Math.max(12,Math.min(r.left,innerWidth-width-12))+'px';
      const top=r.bottom+6+height<=innerHeight-12?r.bottom+6:r.top-height-6;
      menu.style.top=Math.max(12,Math.min(top,innerHeight-height-12))+'px';
    }
    function open(){positionMenu();menu.showPopover();menu.querySelector('[aria-checked="true"]').focus({preventScroll:true})}
    trigger.addEventListener('click',()=>menu.matches(':popover-open')?menu.hidePopover():open());
    trigger.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();open()}});
    menu.addEventListener('toggle',()=>trigger.setAttribute('aria-expanded',String(menu.matches(':popover-open'))));
    menu.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();menu.hidePopover();trigger.focus();return}
      const options=[...menu.querySelectorAll('button')],index=options.indexOf(document.activeElement);
      if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
        e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?options.length-1:(index+(e.key==='ArrowDown'?1:options.length-1))%options.length;options[next].focus();
      }
    });
    menu.addEventListener('focusout',e=>{if(e.relatedTarget&&e.relatedTarget!==trigger&&!menu.contains(e.relatedTarget)&&menu.matches(':popover-open'))menu.hidePopover()});
    window.addEventListener('resize',()=>{if(menu.matches(':popover-open'))positionMenu()});
    window.addEventListener('languagechange',()=>{if(selected==='auto'&&detect(navigator.languages)!==locale)location.reload()});
    wrapper.append(trigger,menu);
    const footer=document.createElement('footer');footer.className='home-footer';footer.append(wrapper);
    // Move the same controls so reading/tab order matches their visual placement.
    const desktop=matchMedia('(min-width:1001px) and (orientation:landscape)');
    const placeUtilities=()=>document.querySelector(desktop.matches?'.home-brand':'.home-content').append(footer);
    placeUtilities();desktop.addEventListener('change',placeUtilities);
    translateNode(document.body);metadata();
    // Legacy renderers write text directly. Observe only changed nodes/labels,
    // never rewrite HTML, canonical gameplay attributes, or event handlers.
    const observer=new MutationObserver(records=>{
      for(const change of records){if(change.type==='childList')change.addedNodes.forEach(translateNode);else if(change.type==='characterData')translateNode(change.target);else{const el=change.target;if(!skip(el)){const value=el.getAttribute(change.attributeName),translated=text(value);if(value!==translated)el.setAttribute(change.attributeName,translated)}}}
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt']});
  }
  async function initialize(){
    let saved;try{saved=localStorage.getItem(storageKey)}catch{}
    const requested=new URL(location.href).searchParams.get('lang');
    locale=supported.has(requested)?requested:supported.has(saved)?saved:detect(navigator.languages?.length?navigator.languages:[navigator.language]);
    if(locale!=='en'){
      try{const response=await fetch('./locales/'+locale+'.json?v=10.30.0');if(!response.ok)throw Error('Locale unavailable');install(await response.json())}catch{locale='en';install({})}
    }
    document.documentElement.lang=locale;document.documentElement.dir='ltr';
    return locale;
  }
  window.FretboardI18n={initialize,mount,text,note,music,detect,match,languages,get locale(){return locale}};
})();
