(() => {
  'use strict';
  function create({root,onNextBar}){
    const $=selector=>root.querySelector(selector),t=value=>window.FretboardI18n?.text(value)||value;
    let visible=false,paused=false,frame=0,origin=0,tempo=72,cells=[];
    function stop(){cancelAnimationFrame(frame);frame=0}
    function tick(now){
      const beat=Math.floor((now-origin)*tempo/60000)%4;
      cells.forEach((cell,index)=>cell.classList.toggle('on-beat',Math.floor(index/2)===beat));
      frame=requestAnimationFrame(tick);
    }
    function pulse(){
      stop();cells.forEach(cell=>cell.classList.toggle('on-beat',false));
      $('#routinePulse').textContent=t(paused?'Start pulse':'Pause pulse');
      $('#routinePulse').setAttribute('aria-pressed',String(!paused));
      if(visible&&!paused){origin=performance.now();frame=requestAnimationFrame(tick)}
    }
    $('#routinePulse').addEventListener('click',()=>{paused=!paused;pulse()});
    $('#routineTempo').addEventListener('change',event=>{tempo=Number(event.target.value);pulse()});
    $('#routineStrumNext').addEventListener('click',onNextBar);
    return {
      stop(){visible=false;stop()},
      update(exercise,index,guided){
        const wasVisible=visible;visible=Boolean(exercise?.strumming);
        $('#routineStrumming').hidden=!visible;
        if(!visible){stop();return}
        const target=exercise.columns[Math.min(index,exercise.columns.length-1)],bar=target.bar;
        $('#routineStrumBar').textContent=t(`Bar ${bar+1} / 8`);
        $('#routineStrumCount').textContent=t(`Strums: ${index} / 40`);
        $('#routineTempoLabel').textContent=t('Tempo');
        $('#routineStrumNext').textContent=t('Next bar →');
        $('#routineStrumHelp').textContent=t(guided?'Each new strum counts. Timing is free; arrows suggest the direction.':'Microphone off: follow the arrows, then move to the next bar.');
        const host=$('#routineStrumPattern');host.setAttribute('aria-label',t('Strumming pattern'));host.replaceChildren();cells=[];
        for(let beat=0;beat<8;beat++){
          const column=exercise.columns.findIndex(c=>c.bar===bar&&c.beat===beat),cell=document.createElement('li');
          const count=document.createElement('span'),arrow=document.createElement('strong');
          count.textContent=beat%2?'&':String(beat/2+1);arrow.textContent=column<0?'·':beat%2?'↑':'↓';
          arrow.setAttribute('aria-hidden','true');cell.append(count,arrow);
          cell.setAttribute('aria-label',column<0?t('No stroke'):t(beat%2?'Upstroke':'Downstroke'));
          cell.classList.toggle('is-played',column>=0&&column<index);
          cell.classList.toggle('is-target',column===index);
          if(column===index)cell.setAttribute('aria-current','step');
          host.append(cell);cells.push(cell);
        }
        if(!wasVisible)pulse();
      }
    };
  }
  window.RoutineStrumming=Object.freeze({create});
})();
