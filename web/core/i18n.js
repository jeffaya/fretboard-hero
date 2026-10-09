(() => {
  'use strict';
  const languages=[['en','🇺🇸','English'],['es','🇪🇸','Español'],['fr','🇫🇷','Français'],['de','🇩🇪','Deutsch'],['it','🇮🇹','Italiano'],['ja','🇯🇵','日本語'],['ko','🇰🇷','한국어'],['zh-CN','🇨🇳','简体中文'],['pt-BR','🇧🇷','Português (Brasil)'],['hi','🇮🇳','हिन्दी'],['id','🇮🇩','Bahasa Indonesia']];
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
    const wrapper=document.createElement('label');wrapper.className='language-picker';
    const select=document.createElement('select');select.setAttribute('aria-label',text('Language'));
    const auto=document.createElement('option');auto.value='auto';const detected=detect(navigator.languages?.length?navigator.languages:[navigator.language]);const active=languages.find(x=>x[0]===detected);auto.textContent=active[1]+' '+text('Automatic');select.append(auto);
    languages.forEach(([value,flag,name])=>{const option=document.createElement('option');option.value=value;option.textContent=flag+' '+name;select.append(option)});
    let saved;try{saved=localStorage.getItem(storageKey)}catch{}const requested=new URL(location.href).searchParams.get('lang');select.value=supported.has(requested)?requested:supported.has(saved)?saved:'auto';
    select.addEventListener('change',()=>{
      try{if(select.value==='auto')localStorage.removeItem(storageKey);else localStorage.setItem(storageKey,select.value)}catch{}
      // URL fallback keeps manual choice functional when storage is unavailable.
      const url=new URL(location.href);if(select.value==='auto')url.searchParams.delete('lang');else url.searchParams.set('lang',select.value);location.assign(url.href);
    });
    window.addEventListener('languagechange',()=>{if(select.value==='auto'&&detect(navigator.languages)!==locale)location.reload()});
    wrapper.append(select);
    const footer=document.createElement('footer');footer.className='home-footer';footer.append(wrapper);document.querySelector('.home-content').append(footer);
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
      try{const response=await fetch('./locales/'+locale+'.json?v=10.26.2');if(!response.ok)throw Error('Locale unavailable');install(await response.json())}catch{locale='en';install({})}
    }
    document.documentElement.lang=locale;document.documentElement.dir='ltr';
    return locale;
  }
  window.FretboardI18n={initialize,mount,text,note,music,detect,match,languages,get locale(){return locale}};
})();
