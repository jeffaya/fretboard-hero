(() => {
  'use strict';
  function create({root=document,engine,refreshControls,random=Math.random,encouragementRandom=Math.random}){
    const $=s=>root.querySelector(s),access=window.FRETBOARD_ACCESS||{unlocked:true},premium=window.FRETBOARD_PREMIUM;
    const t=value=>window.FretboardI18n?.text(value)||value;
    const state={root:'A',quality:'minor',index:0,diagonal:0},completed=new Set(),gate=RoutineGuide.createGate(),strumGate=RoutineGuide.createStrumGate();
    let storage;try{storage=localStorage}catch{}
    const rhythmPractice=RoutinePatterns.practice(storage);let patterns=RoutinePatterns.defaults();
    const diagonalKey='fretboard-routine-diagonal-'+engine.profile.id;
    let nextDiagonal=0;
    try{nextDiagonal=localStorage.getItem(diagonalKey)==='1'?1:0}catch{}
    function beginRoutine(){
      if(engine.profile.family==='guitar')patterns=rhythmPractice.choose();state.diagonal=nextDiagonal;nextDiagonal=1-nextDiagonal;
      if(engine.profile.family==='guitar')try{localStorage.setItem(diagonalKey,String(nextDiagonal))}catch{}
    }
    const detector=FretboardChordDetector.create({minMidi:Math.min(...engine.courses.map(c=>c.midi)),maxMidi:Math.max(...engine.courses.map(c=>c.midi))+15});
    const encouragements=RoutineEncouragement.createDeck(encouragementRandom);
    let exercises=[],guides=[],active=false,transition=0,settleUntil=0,lastPitches=[];
    const micPreference=FretboardMicrophone.preference('routine');
    const microphone=FretboardMicrophone.create({fftSize:16384,interval:80,onFrame:listen,onState:audioState});
    const strumming=RoutineStrumming.create({root,
      onProgress(index,progress){if(current()){current().index=index;current().rhythm=progress}},onComplete:advance,onRepeat:(id,success)=>rhythmPractice.record(id,success),onAudioReset:()=>{strumGate.reset();settleUntil=performance.now()+120}
    });
    function resetGates(repeat=false){gate.reset(repeat);strumGate.reset()}
    // A short CSS celebration, created once and replayed only on completion.
    const confettiColors=['#ff9814','#70f7ff','#ff4ed8','#ffe38a','#b88cff'];
    for(let i=0;i<40;i++){
      const piece=document.createElement('i');
      piece.setAttribute('style',`--x:${(i*37)%100}%;--drift:${(i%7-3)*18}px;--delay:${(i%9)*.08}s;--turn:${(i%2?1:-1)*(360+i*17)}deg;background:${confettiColors[i%confettiColors.length]}`);
      $('#routineConfetti').append(piece);
    }
    function current(){return guides[state.index]}
    function currentSection(){return exercises[state.index]?.sections?.[current()?.section||0]}
    function targetPitches(){
      const guide=current(),column=exercises[state.index]?.columns[guide?.index];
      return column?[...new Set(column.notes.map(n=>engine.midiAt(n.string,n.fret)))].sort((a,b)=>a-b):[];
    }
    function soundKey(pitches){
      return pitches.length>1?`${Math.min(...pitches)}:${[...new Set(pitches.map(midi=>midi%12))].sort((a,b)=>a-b).join(',')}`:pitches.join(',');
    }
    function draw(animate=false){
      if(!exercises.length||state.index>=5||transition)return;
      const guided=microphone.state==='on',exercise=exercises[state.index],section=currentSection();
      if(exercise.melody)$('#routineContext').textContent=t(`${exercise.detail} · ${section.label}`);
      $('#routineTabScroll').hidden=Boolean(exercise.strumming);
      $('#routineLegend').hidden=false;
      $('#routineNoteProgress').hidden=!guided||Boolean(exercise.strumming);
      microphone.setInterval?.(exercise.strumming?20:80);
      // Match the known guide against raw instrument input. Speech-oriented
      // browser cancellation can suppress guitar and alter that reference.
      microphone.setEchoCancellation?.(false);
      if(!exercise.strumming){
        $('#routineLegend').textContent=t(guided?'Highlight = target · Green = played':'Cyan = root note');
        if(exercise.melody)$('#routineLegend').textContent+=' · '+t(exercise.diagonal?'P1–P5 = boxes · / = slide · 1 = root':'Numbers above = degrees · 1 = root');
      }
      const visible=section?{...exercise,columns:exercise.columns.slice(section.start,section.end)}:exercise;
      if(!exercise.strumming)RoutineRenderer.render($('#routineTab'),visible,engine,guided?{index:current().index-(section?.start||0),animate}:null);
      strumming.update(active?exercise:null,current().index,guided,current().rhythm);
      if(guided){
        const guide=current();
        const count=section?section.end-section.start:exercise.columns.length;
        if(!exercise.strumming)$('#routineNoteProgress').textContent=`${Math.min(guide.index-(section?.start||0)+1,count)} / ${count}`;
        $('#routineMicStatus').textContent=t('Listening…');
      }
    }
    function showTarget(){
      if(exercises[state.index]?.strumming)return;
      const target=$('#routineTab').querySelector('.is-target');
      if(target){
        target.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      }
    }
    function audioState(value,error){
      const on=value==='on';
      $('#routineMic').disabled=state.index===5;
      $('#routineMic').setAttribute('aria-checked',String(on||value==='pending'));
      $('#routineMic').setAttribute('aria-busy',String(value==='pending'));
      $('#routineListening').hidden=!active||state.index===5;
      $('#routineNoteProgress').hidden=!on||Boolean(exercises[state.index]?.strumming);
      $('#routineMicStatus').classList.toggle('is-error',Boolean(error));
      $('#routineMicStatus').textContent=t(error?FretboardMicrophone.errorMessage(error):value==='pending'?'Allow microphone access':'Microphone off');
      resetGates();settleUntil=performance.now()+400;
      if(exercises.length)renderInstruction();
      draw();
      if(on){
        showTarget();
        if(!exercises[state.index]?.strumming&&current()?.index===(currentSection()?.end||exercises[state.index]?.columns.length))advance();
      }
    }
    function renderInstruction(){
      if(state.index>=5)return;
      const e=exercises[state.index];
      const instruction=e.melody&&current().section===1?(e.diagonal?'Play the same motif back through the three blocks.':`Return to ${state.root}, reading from left to right.`):microphone.state==='on'&&e.id==='root'?'Play the highlighted note.':microphone.state==='on'&&e.id==='triads'&&!e.sections?'Play each triad together.':e.instruction;
      $('#routineInstruction').textContent=t(instruction);
    }
    function listen({samples,spectrum,sampleRate,fftSize,now}){
      if(!active||state.index>=5||transition||now<settleUntil)return;
      if(exercises[state.index].strumming){
        strumGate.update({samples,sampleRate,now,refractory:strumming.refractory,onAttack:at=>strumming.captureAttack(at,now)});
        strumming.processInput({samples,sampleRate,now});
        return;
      }
      const pitches=targetPitches();if(!pitches.length)return;
      let energy=0;for(const value of samples)energy+=value*value;
      const level=Math.sqrt(energy/samples.length),chord=pitches.length>1;
      let match=false;
      if(level>=FretboardPitch.minLevel){
        if(chord)match=detector.matches(detector.analyze(spectrum,sampleRate,fftSize),pitches);
        else{
          const hz=FretboardPitch.detect(samples.subarray(samples.length-8192),sampleRate,{maxFrequency:1500});
          match=Boolean(hz&&Math.abs(FretboardPitch.cents(hz,pitches[0]))<=38);
          // A liaison is one isolated note. A full triad whose fundamental
          // happens to be that third must not skip the single-note target.
          if(match&&exercises[state.index].columns[current().index].kind==='third'){
            const result=detector.analyze(spectrum,sampleRate,fftSize);
            match=detector.matchesSingle(result,pitches[0]);
          }
        }
      }
      if(!gate.update({match,level,now,chord}))return;
      lastPitches=pitches;current().index++;
      draw(true);
      if(current().index===(currentSection()?.end||exercises[state.index].columns.length)){advance();return}
      const next=targetPitches();gate.reset(soundKey(next)===soundKey(pitches));
      settleUntil=now+200;showTarget();
    }
    function cancelTransition(){
      clearTimeout(transition);transition=0;
      $('#routineTransition').hidden=true;$('#routineNext').disabled=false;
      $('#routineExercise').classList.toggle('is-transitioning',false);
    }
    function render(){
      const done=state.index===5,exercise=exercises[Math.min(state.index,4)];
      $('#routineSteps').replaceChildren();
      exercises.forEach((item,i)=>{
        const step=document.createElement('li'),button=document.createElement('button');
        button.type='button';button.className='ui-step';button.textContent=t(item.step);button.dataset.step=String(i+1);
        button.addEventListener('click',()=>{
          strumming.stop();cancelTransition();state.index=i;
          if(completed.has(i)||(!exercises[state.index].strumming&&current().index===exercises[state.index].columns.length)){current().index=0;current().section=0;current().rhythm=null}
          resetGates();settleUntil=performance.now()+400;render();$('#routineTitle').focus({preventScroll:true});
          if(currentSection()&&current().index===currentSection().end)advance();
          else if(exercises[state.index].melody)showTarget();
        });
        step.append(button);
        step.classList.toggle('is-current',i===state.index);step.classList.toggle('is-complete',completed.has(i));
        if(i===state.index)button.setAttribute('aria-current','step');
        $('#routineSteps').append(step);
      });
      const title=$('#routineTitle');
      title.textContent=done?t('Routine complete!'):t(exercise.title);
      if(!done&&!exercise.strumming){
        const target=exercise.id==='root'?(window.FretboardI18n?.note(state.root)||state.root):t(`${state.root} ${state.quality}`);
        const label=t(exercise.id==='root'?'Find the root note':exercise.title);
        const at=exercise.id==='root'?-1:label.indexOf(target);
        const before=document.createElement('span'),badge=document.createElement('span'),after=document.createElement('span');
        before.textContent=at<0?label+' ':label.slice(0,at);
        badge.className='routine-target';badge.textContent=target;
        after.textContent=at<0?'':label.slice(at+target.length);
        title.replaceChildren();title.append(before,badge,after);title.setAttribute('data-no-i18n','');
      }
      $('#routineContext').hidden=!done&&!exercise.melody&&exercise.id!=='penta';
      $('#routineContext').textContent=t(done?`${state.root} ${state.quality} · Five exercises completed`:exercise.detail);
      if(done)$('#routineInstruction').textContent=t('Five exercises. One key. You did it! Keep building your skills in Learn, or put your knowledge to the test in Quiz.');else renderInstruction();
      $('#routineCelebration').hidden=!done;$('#routineExercise').classList.toggle('is-complete',done);
      $('#routineTabScroll').hidden=done;$('#routineLegend').hidden=done;
      if(done)strumming.update(null);
      $('#routineNext').hidden=done;$('#routineFinish').hidden=!done;
      $('#routineNext').textContent=t(exercise.sections&&current()?.section<exercise.sections.length-1?(exercise.melody?'Return →':'Next strings →'):state.index===4&&[0,1,2,3].every(i=>completed.has(i))?'Done':'Next →');
      $('#routineMic').disabled=done;
      $('#routineListening').hidden=!active||done;
      draw();
      for(const key of ['root','quality'])$('#routine'+(key==='root'?'Root':'Quality')+'Controls').querySelectorAll('button').forEach(b=>{
        const active=b.dataset.value===state[key];b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
      });
      refreshControls();
    }
    function advance(){
      if(state.index>=5||transition||!active)return;
      strumming.stop();
      $('#routineTransition').hidden=false;$('#routineNext').disabled=true;
      // Encourage practice, including manual continuation, without claiming a score.
      const encouragement=encouragements.next();
      $('#routineEncouragement').textContent=t('Keep it going!');
      $('#routineEncouragementDetail').textContent=t(encouragement.text);
      $('#routineEncouragementCredit').textContent=t('Inspired by');
      $('#routineEncouragementAuthor').textContent=encouragement.author;
      $('#routineExercise').classList.toggle('is-transitioning',true);
      transition=setTimeout(()=>{
        cancelTransition();if(!active)return;
        const section=currentSection(),hasNextSection=section&&current().section<exercises[state.index].sections.length-1;
        if(hasNextSection){current().index=section.end;current().section++}
        else{
          completed.add(state.index);state.index++;
          if(state.index===5&&completed.size<5)state.index=exercises.findIndex((_,i)=>!completed.has(i));
        }
        if(state.index===5)microphone.stop();
        else {resetGates(soundKey(targetPitches())===soundKey(lastPitches));settleUntil=performance.now()+400}
        render();$('#routineTitle').focus({preventScroll:true});$('#routineSteps').scrollIntoView({block:'nearest',behavior:'auto'});
        if(hasNextSection||exercises[state.index]?.melody)showTarget();
      },2600);
    }
    function reset(){
      strumming.stop();cancelTransition();completed.clear();state.index=0;encouragements.reset();lastPitches=[];
      exercises=RoutineExercises.create({engine,root:state.root,quality:state.quality,random,diagonal:state.diagonal,patterns});
      guides=exercises.map(()=>({index:0,section:0}));
      resetGates();settleUntil=performance.now()+400;render();
    }
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
    $('#routineNext').addEventListener('click',()=>{if(exercises[state.index]?.strumming)strumming.next();else advance()});
    $('#routineMic').addEventListener('click',()=>{
      if(!active||state.index>=5)return;
      const enable=microphone.state==='off';micPreference.setEnabled(enable);
      if(enable)microphone.start();else microphone.stop();
    });
    $('#routineReplay').addEventListener('click',()=>{
      if(state.index!==5)return;
      const roots=MusicTheory.NOTES.filter(note=>note!==state.root);
      state.root=access.unlocked?roots[Math.floor(random()*roots.length)]:'A';
      if(!access.unlocked)state.quality='minor';
      beginRoutine();reset();if(micPreference.enabled)microphone.start();$('#routineTitle').focus({preventScroll:true});$('#routineSteps').scrollIntoView({block:'nearest',behavior:'auto'});
    });
    if(window.ResizeObserver)new window.ResizeObserver(()=>draw()).observe($('#routineTabScroll'));
    return {
      resize(){draw()},
      leave(){active=false;cancelTransition();microphone.stop();strumming.stop()},
      enter(){active=true;microphone.stop();state.root=access.unlocked?MusicTheory.NOTES[Math.floor(random()*MusicTheory.NOTES.length)]:'A';state.quality='minor';beginRoutine();reset();if(micPreference.enabled)microphone.start()}
    };
  }
  window.RoutineSession=Object.freeze({create});
})();
