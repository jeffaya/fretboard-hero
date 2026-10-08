(() => {
  'use strict';
  function create({root=document,engine,refreshControls,random=Math.random}){
    const $=s=>root.querySelector(s),access=window.FRETBOARD_ACCESS||{unlocked:true},premium=window.FRETBOARD_PREMIUM;
    const state={root:'A',quality:'minor',index:0};
    let exercises=[];
    // A short CSS celebration, created once and replayed only on completion.
    const confettiColors=['#ff9814','#70f7ff','#ff4ed8','#ffe38a','#b88cff'];
    for(let i=0;i<40;i++){
      const piece=document.createElement('i');
      piece.setAttribute('style',`--x:${(i*37)%100}%;--drift:${(i%7-3)*18}px;--delay:${(i%9)*.08}s;--turn:${(i%2?1:-1)*(360+i*17)}deg;background:${confettiColors[i%confettiColors.length]}`);
      $('#routineConfetti').append(piece);
    }
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
      $('#routineTitle').textContent=done?'Routine complete!':exercise.title;
      $('#routineContext').textContent=done?`${state.root} ${state.quality} · Five exercises completed`:exercise.detail;
      $('#routineInstruction').textContent=done?'Five exercises. One key. You did it! Keep building your skills in Learn, or put your knowledge to the test in Quiz.':exercise.instruction;
      $('#routineCelebration').hidden=!done;$('#routineExercise').classList.toggle('is-complete',done);
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
        const b=document.createElement('button');b.type='button';b.textContent=key==='quality'?value.toUpperCase():(window.FretboardI18n?.note(value)||value);b.dataset.value=value;
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
