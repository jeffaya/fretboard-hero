(() => {
  'use strict';
  function create({root=document,engine,refreshControls,random=Math.random}){
    const $=s=>root.querySelector(s),access=window.FRETBOARD_ACCESS||{unlocked:true},premium=window.FRETBOARD_PREMIUM;
    const state={root:'A',quality:'minor',index:0};
    let exercises=[];
    const completed=new Set();
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
        const step=document.createElement('li'),button=document.createElement('button');
        button.type='button';button.textContent=item.step;
        button.addEventListener('click',()=>{state.index=i;render();$('#routineTitle').focus({preventScroll:true})});
        step.append(button);
        step.classList.toggle('is-current',i===state.index);step.classList.toggle('is-complete',completed.has(i));
        if(i===state.index)button.setAttribute('aria-current','step');
        $('#routineSteps').append(step);
      });
      const title=$('#routineTitle'),t=value=>window.FretboardI18n?.text(value)||value;
      title.textContent=done?t('Routine complete!'):exercise.title;
      if(!done){
        const target=exercise.id==='root'?(window.FretboardI18n?.note(state.root)||state.root):t(`${state.root} ${state.quality}`);
        const label=t(exercise.id==='root'?'Find the root note':exercise.title);
        const at=exercise.id==='root'?-1:label.indexOf(target);
        const before=document.createElement('span'),badge=document.createElement('span'),after=document.createElement('span');
        before.textContent=at<0?label+' ':label.slice(0,at);
        badge.className='routine-target';badge.textContent=target;
        after.textContent=at<0?'':label.slice(at+target.length);
        title.replaceChildren();title.append(before,badge,after);
        title.setAttribute('data-no-i18n','');
      }
      $('#routineContext').hidden=!done;
      $('#routineContext').textContent=done?`${state.root} ${state.quality} · Five exercises completed`:exercise.detail;
      $('#routineInstruction').textContent=done?'Five exercises. One key. You did it! Keep building your skills in Learn, or put your knowledge to the test in Quiz.':exercise.instruction;
      $('#routineCelebration').hidden=!done;$('#routineExercise').classList.toggle('is-complete',done);
      $('#routineTabScroll').hidden=done;$('#routineLegend').hidden=done;
      $('#routineNext').hidden=done;$('#routineFinish').hidden=!done;
      $('#routineNext').textContent=state.index===4&&[0,1,2,3].every(i=>completed.has(i))?'Done':'Next →';
      if(!done)RoutineRenderer.render($('#routineTab'),exercise,engine);
      for(const key of ['root','quality'])$('#routine'+(key==='root'?'Root':'Quality')+'Controls').querySelectorAll('button').forEach(b=>{
        const active=b.dataset.value===state[key];b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
      });
      refreshControls();
    }
    function reset(){completed.clear();state.index=0;exercises=RoutineExercises.create({engine,root:state.root,quality:state.quality,random});render()}
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
      if(state.index>=5)return;completed.add(state.index);state.index++;
      if(state.index===5&&completed.size<5)state.index=exercises.findIndex((_,i)=>!completed.has(i));
      render();
      $('#routineTitle').focus({preventScroll:true});$('#routineSteps').scrollIntoView({block:'nearest',behavior:'auto'});
    });
    if(window.ResizeObserver)new window.ResizeObserver(()=>{if(exercises.length&&state.index<5)RoutineRenderer.render($('#routineTab'),exercises[state.index],engine)}).observe($('#routineTabScroll'));
    return {
      resize(){if(exercises.length&&state.index<5)RoutineRenderer.render($('#routineTab'),exercises[state.index],engine)},
      enter(){state.root=access.unlocked?MusicTheory.NOTES[Math.floor(random()*MusicTheory.NOTES.length)]:'A';state.quality='minor';reset()}
    };
  }
  window.RoutineSession=Object.freeze({create});
})();
