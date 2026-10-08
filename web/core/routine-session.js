(() => {
  'use strict';
  function create({root=document,engine,refreshControls,random=Math.random}){
    const $=s=>root.querySelector(s),access=window.FRETBOARD_ACCESS||{unlocked:true},premium=window.FRETBOARD_PREMIUM;
    const state={root:'A',quality:'minor',index:0};
    let exercises=[];
    function render(){
      const done=state.index===5,exercise=exercises[Math.min(state.index,4)];
      $('#routineSteps').replaceChildren();
      exercises.forEach((item,i)=>{
        const step=document.createElement('li');step.textContent=item.step;
        step.classList.toggle('is-current',i===state.index);step.classList.toggle('is-complete',i<state.index);
        if(i===state.index)step.setAttribute('aria-current','step');
        $('#routineSteps').append(step);
      });
      $('#routineKicker').textContent=done?'5 OF 5 COMPLETED':`EXERCISE ${state.index+1} OF 5`;
      $('#routineTitle').textContent=done?'Routine complete':exercise.title;
      $('#routineContext').textContent=done?`${state.root} ${state.quality} · Five exercises completed`:exercise.detail;
      $('#routineInstruction').textContent=done?'You have connected the root, scale, triads, chord tones and pentatonic. Come back for a new key and new positions.':exercise.instruction;
      $('#routineTabScroll').hidden=done;$('#routineLegend').hidden=done;
      $('#routineNext').hidden=done;$('#routineFinish').hidden=!done;
      $('#routineNext').textContent=state.index===4?'Done':'Next →';
      if(!done)RoutineRenderer.render($('#routineTab'),exercise,engine);
      for(const key of ['root','quality'])$('#routine'+(key==='root'?'Root':'Quality')+'Controls').querySelectorAll('button').forEach(b=>{
        const active=b.dataset.value===state[key];b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
      });
      refreshControls();
    }
    function reset(){state.index=0;exercises=RoutineExercises.create({engine,root:state.root,quality:state.quality,random});render()}
    function setup(id,values,key){
      const host=$('#'+id),feature='routine'+key[0].toUpperCase()+key.slice(1);
      values.forEach(value=>{
        const b=document.createElement('button');b.type='button';b.textContent=key==='quality'?value.toUpperCase():value;b.dataset.value=value;
        if(!access.unlocked)premium.mark(b,feature,value);
        b.addEventListener('click',()=>{
          if(!access.unlocked&&!access.allows(feature,value)){premium.open();return}
          if(state[key]===value)return;
          state[key]=value;reset();
        });host.append(b);
      });
    }
    setup('routineRootControls',MusicTheory.NOTES,'root');setup('routineQualityControls',['major','minor'],'quality');
    $('#routineNext').addEventListener('click',()=>{
      if(state.index>=5)return;state.index++;render();
      $('#routineTitle').focus({preventScroll:true});$('#routineSteps').scrollIntoView({block:'nearest',behavior:'auto'});
    });
    return {
      resize(){if(exercises.length&&state.index<5)RoutineRenderer.render($('#routineTab'),exercises[state.index],engine)},
      enter(){state.root=access.unlocked?MusicTheory.NOTES[Math.floor(random()*MusicTheory.NOTES.length)]:'A';state.quality='minor';reset()}
    };
  }
  window.RoutineSession=Object.freeze({create});
})();
