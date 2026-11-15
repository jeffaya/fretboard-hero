(() => {
 'use strict';
 const data=JSON.parse(document.querySelector('#guideConfig').textContent);
 // The document route is authoritative; a remembered instrument must never
 // relabel a guitar lesson as bass or display the wrong number of strings.
 window.FretboardDocumentBranding.apply(data.instrument,'/').catch(error=>console.error('Guide branding unavailable',error));
 async function initialize(){
  const host=document.querySelector('.public-shell'),footer=host.querySelector('.home-footer');
  const config={instrument:data.instrument,stores:data.stores},access=window.FretboardAccess.create(false);
  await window.FretboardI18n.initialize(data.locale);
  const privacy=footer.querySelector('a[href^="https://fretboard-hero.com/privacy"]');
  const privacyURL=new URL(privacy.href);privacyURL.searchParams.set('instrument',data.instrument);privacy.href=privacyURL.href;
  const modal=window.FretboardAccess.mount(config,access,{host,
    menus:document.querySelector('#guideAppMenu').content.querySelectorAll('.hero-btn[data-go]')});
  window.FretboardFooter.mountDownload({config,access,host:footer,open:button=>modal.open(button)});
  window.FretboardI18n.mount({selected:data.locale,choices:data.languages.map(lang=>[lang.locale,lang.label]),
    roots:[footer,host.querySelector('.premium-overlay')],updateMetadata:false,
    navigate:locale=>location.assign(data.languages.find(lang=>lang.locale===locale).href+location.search)});
 }
 initialize().catch(error=>console.error('Guide controls unavailable',error));
 const picker=document.querySelector('#chord-quality');if(!picker)return;
 const library=window.FretboardChords,buttons=[...document.querySelectorAll('[data-chord-root]')];
 let root=7,quality='major';
 function render(updateURL){
  buttons.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.chordRoot)===root)));
  picker.value=quality;
  document.querySelector('#chord-summary').textContent=library.roots[root]+library.qualities[quality].suffix+' · '+data.ui[quality]+' — '+data.ui.tones+': '+library.notes(root,quality).join(' · ');
  document.querySelector('#chord-positions').innerHTML=window.FretboardLessonDiagrams.chordCards({instrument:data.instrument,root,quality,ui:data.ui});
  if(updateURL){const url=new URL(location.href);url.searchParams.set('root',root);url.searchParams.set('quality',quality);history.replaceState(null,'',url);}
  for(const link of document.querySelectorAll('[data-guide-route]')){const url=new URL(link.href);url.searchParams.set('root',root);url.searchParams.set('quality',quality);link.href=url.href;}
 }
 function restore(){const search=new URLSearchParams(location.search),requested=Number(search.get('root'));
  root=search.has('root')&&Number.isInteger(requested)&&requested>=0&&requested<12?requested:7;
  quality=Object.hasOwn(library.qualities,search.get('quality'))?search.get('quality'):'major';render(false);
 }
 for(const button of buttons)button.addEventListener('click',()=>{root=Number(button.dataset.chordRoot);render(true);});
 picker.addEventListener('change',()=>{quality=picker.value;render(true);});
 window.addEventListener('popstate',restore);restore();
})();
