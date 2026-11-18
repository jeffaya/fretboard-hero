(() => {
 'use strict';
 const data=JSON.parse(document.querySelector('#guideConfig').textContent);
 // The document route is authoritative; a remembered instrument must never
 // relabel a guitar lesson as bass or display the wrong number of strings.
 window.FretboardDocumentBranding.apply(data.instrument,'/').catch(error=>console.error('Guide branding unavailable',error));
 window.FretboardDocumentShell.mount(data).catch(error=>console.error('Guide controls unavailable',error));
 const positions=document.querySelector('#chord-positions');if(!positions)return;
 const library=window.FretboardChords,buttons=[...document.querySelectorAll('[data-chord-root]')];
 let root=7;
 function render(updateURL){
  buttons.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.chordRoot)===root)));
  document.querySelector('#chord-summary').textContent=data.ui.root+': '+library.roots[root];
  positions.innerHTML=window.FretboardLessonDiagrams.chordFamilies({instrument:data.instrument,root,ui:data.ui});
  const url=new URL(location.href);
  if(updateURL||url.searchParams.has('quality')){url.searchParams.set('root',root);url.searchParams.delete('quality');history.replaceState(null,'',url);}
 }
 function restore(){const search=new URLSearchParams(location.search),requested=Number(search.get('root'));
  root=search.has('root')&&Number.isInteger(requested)&&requested>=0&&requested<12?requested:7;
  render(false);
 }
 for(const button of buttons)button.addEventListener('click',()=>{root=Number(button.dataset.chordRoot);render(true);});
 window.addEventListener('popstate',restore);restore();
})();
