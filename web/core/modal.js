/* Shared light-dismiss behavior for native dialogs and overlay modals. */
(() => {
  'use strict';
  function bindDismiss(surface, close){
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
  window.FretboardModal={bindDismiss};
})();
