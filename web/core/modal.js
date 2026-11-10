/* Shared light-dismiss behavior for native dialogs and overlay modals. */
(() => {
  'use strict';
  function addClose(panel, close){
    const button=document.createElement('button');
    button.type='button';button.className='ui-modal-close';
    button.setAttribute('aria-label',window.FretboardI18n?.text('Close')||'Close');
    button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();close()});
    panel.classList.add('ui-dismissible');panel.prepend(button);
    return button;
  }
  function bindDismiss(surface, close){
    const panels=surface.tagName==='DIALOG'?[surface]:surface.querySelectorAll('.ui-modal,.result-modal');
    panels.forEach(panel=>addClose(panel,close));
    const outside=event=>{
      if(event.target!==surface)return false;
      if(surface.tagName!=='DIALOG')return true;
      const box=surface.getBoundingClientRect();
      return event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom;
    };
    let beganOutside=false;
    surface.addEventListener('pointerdown',event=>{beganOutside=outside(event)});
    surface.addEventListener('pointercancel',()=>{beganOutside=false});
    surface.addEventListener('click',event=>{if(beganOutside&&outside(event))close();beganOutside=false});
  }
  window.FretboardModal={bindDismiss,addClose};
})();
