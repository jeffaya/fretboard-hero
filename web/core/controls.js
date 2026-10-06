(() => {
  'use strict';
  function bindDrawer({root=document,name}){
    const $=s=>root.querySelector(s),drawer=$('#'+name+'Drawer'),btn=$('#'+name+'MenuBtn'),close=$('#'+name+'MenuClose'),backdrop=$('#'+name+'DrawerBackdrop');
    if(!drawer||!btn)return;
    const compact=matchMedia('(max-width:767px), (orientation:landscape) and (max-width:1000px) and (max-height:599px)');
    const sync=()=>{const open=drawer.classList.contains('open');drawer.setAttribute('aria-hidden',String(compact.matches&&!open));drawer.inert=compact.matches&&!open;btn.setAttribute('aria-expanded',String(open))};
    const setOpen=(open,restore=false)=>{drawer.classList.toggle('open',open);backdrop?.classList.toggle('show',open);sync();if(open)close?.focus();else if(restore)btn.focus()};
    btn.addEventListener('click',()=>setOpen(!drawer.classList.contains('open')));close?.addEventListener('click',()=>setOpen(false,true));backdrop?.addEventListener('click',()=>setOpen(false,true));
    drawer.addEventListener('keydown',e=>{if(e.key==='Escape'&&compact.matches){e.preventDefault();setOpen(false,true)}});
    compact.addEventListener('change',()=>{setOpen(false)});sync();
  }
  function context(profile,mode){const m=profile.modes?.[mode];if(!m)return null;return {label:m.context?.label||'',values:m.context?.values||['all'],defaultValue:m.context?.defaultValue||'all'}}
  window.FretboardControls={bindDrawer,context};
})();
