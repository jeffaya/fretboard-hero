(() => {
  'use strict';
  function create({root=document,engine,refreshControls,random=Math.random,encouragementRandom=Math.random}){
    const $=s=>root.querySelector(s),access=window.FRETBOARD_ACCESS||{unlocked:true},premium=window.FRETBOARD_PREMIUM;
    const t=value=>window.FretboardI18n?.text(value)||value;
    const state={root:'A',quality:'minor',index:0},completed=new Set(),gate=RoutineGuide.createGate(),strumGate=RoutineGuide.createStrumGate();
    let storage;try{storage=localStorage}catch{}
    const rhythmPractice=RoutinePatterns.practice(storage);let patterns=RoutinePatterns.defaults();
    function chooseRhythmPatterns(){
      if(engine.profile.family==='guitar')patterns=rhythmPractice.choose();
    }
    const detector=FretboardChordDetector.create({minMidi:Math.min(...engine.courses.map(c=>c.midi)),maxMidi:Math.max(...engine.courses.map(c=>c.midi))+15});
    const encouragements=RoutineEncouragement.createDeck(encouragementRandom);
    let exercises=[],guides=[],active=false,transition=0,settleUntil=0,lastPitches=[];
    const micPreference=FretboardMicrophone.preference('routine');
    const microphone=FretboardMicrophone.create({fftSize:16384,interval:80,onFrame:listen,onState:audioState});
    const strumming=RoutineStrumming.create({root,
      onProgress(index,progress){if(current()){current().index=index;current().rhythm=progress;renderNext()}},onComplete:advance,onRepeat:(id,success)=>rhythmPractice.record(id,success),onAudioReset:()=>{strumGate.reset();settleUntil=performance.now()+120}
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
    function isFlowExercise(){return engine.profile.family==='guitar'&&['penta','triads'].includes(exercises[state.index]?.id)}
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
      const detail=section?.diagonal?`Diagonal ${section.diagonal} · ${section.frets}`:exercise.detail;
      if(exercise.melody)$('#routineContext').textContent=t(`${detail} · ${section.label}`);
      if(exercise.rootJourney)$('#routineContext').textContent=t(`${exercise.detail} · ${section.recall?'From memory':'Ascending'}`);
      const rootRecall=Boolean(exercise.rootJourney&&section.recall&&!current().rootRevealed);
      $('#routineRootReveal').hidden=!rootRecall;
      $('#routineTabScroll').hidden=Boolean(exercise.strumming);
      $('#routineLegend').hidden=false;
      $('#routineNoteProgress').hidden=!guided||Boolean(exercise.strumming);
      microphone.setInterval?.(exercise.strumming?20:isFlowExercise()?25:80);
      // A long FFT retains the previous shape during quick triad/liaison changes.
      // Keep the larger window for low bass notes and the rhythm echo reference.
      microphone.setFftSize?.(isFlowExercise()?8192:16384);
      // Match the known guide against raw instrument input. Speech-oriented
      // browser cancellation can suppress guitar and alter that reference.
      microphone.setEchoCancellation?.(false);
      if(!exercise.strumming){
        $('#routineLegend').textContent=t(guided?'Highlight = target · Green = played':'Cyan = root note');
        if(exercise.melody)$('#routineLegend').textContent+=' · '+t(section.diagonal?'P1–P5 = boxes · / = slide · 1 = root':'Numbers above = degrees · 1 = root');
        if(section?.diagonal)$('#routineLegend').textContent+=' · '+t('~ = let the root ring; light vibrato optional');
        if(rootRecall)$('#routineLegend').textContent+=' · '+t('? = find the fret');
      }
      const visible=section?{...exercise,detail,rootRecall,columns:exercise.columns.slice(section.start,section.end)}:exercise;
      if(!exercise.strumming)RoutineRenderer.render($('#routineTab'),visible,engine,guided?{index:current().index-(section?.start||0),animate}:null);
      strumming.update(active?exercise:null,current().index,guided,current().rhythm);
      if(guided){
        const guide=current();
        const count=section?section.end-section.start:exercise.columns.length;
        if(!exercise.strumming)$('#routineNoteProgress').textContent=`${Math.min(guide.index-(section?.start||0)+1,count)} / ${count}`;
        const column=exercise.columns[guide.index];
        $('#routineMicStatus').textContent=t(column?.holdMs?`Root: ${column.noteName} — let it ring`:'Listening…');
      }
    }
    function showTarget(){
      if(!active||transition||microphone.state!=='on'||exercises[state.index]?.strumming)return;
      const svg=$('#routineTab'),target=svg.querySelector('.is-target'),screen=$('#routine');
      if(!target||!screen.clientHeight)return;
      // Scroll the actual routine container, not an SVG <g> inside an
      // overflow-hidden panel. Follow the whole staff, including its heading.
      const viewport=window.visualViewport,screenRect=screen.getBoundingClientRect();
      const top=Math.max(screenRect.top,viewport?.offsetTop||0)+16;
      const bottom=Math.min(screenRect.bottom,viewport?viewport.offsetTop+viewport.height:window.innerHeight)-16;
      if(bottom<=top)return;
      const rect=svg.getBoundingClientRect(),scale=rect.height/svg.viewBox.baseVal.height;
      let start=rect.top+Number(target.getAttribute('data-staff-top'))*scale;
      let height=Number(target.getAttribute('data-staff-height'))*scale;
      // In a short landscape viewport a complete staff may not fit. Keep
      // the target itself comfortably visible instead of clipping the note.
      if(height>bottom-top){const note=target.getBoundingClientRect();start=note.top;height=note.height}
      if(start>=top&&start+height<=bottom)return;
      screen.scrollTo({top:screen.scrollTop+start+height/2-(top+bottom)/2,
        behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
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
      const e=exercises[state.index],section=currentSection();
      if(e.rootJourney&&section.recall){
        $('#routineInstruction').textContent=t(current().rootRevealed?
          `Play each note and say “${e.root}” aloud.`:'Use the first root to find the hidden frets on the indicated strings. Return along the same path.');
        return;
      }
      const instruction=e.melody&&section.label==='Returning'?(section.diagonal?'Play the same motif back through the three blocks.':`Return to ${state.root}, reading from left to right.`):microphone.state==='on'&&e.id==='triads'&&!e.sections?'Play each triad together.':e.instruction;
      $('#routineInstruction').textContent=t(instruction);
      if(section?.diagonal)$('#routineInstruction').textContent+=' '+t('Let the root ring. Light vibrato is optional.');
    }
    function listen({samples,spectrum,sampleRate,fftSize,now}){
      if(!active||state.index>=5||transition||now<settleUntil)return;
      if(exercises[state.index].strumming){
        strumGate.update({samples,sampleRate,now,refractory:strumming.refractory,onAttack:at=>strumming.captureAttack(at,now)});
        strumming.processInput({samples,sampleRate,now});
        return;
      }
      const pitches=targetPitches();if(!pitches.length)return;
      const flow=isFlowExercise(),column=exercises[state.index].columns[current().index];
      // Follow the arrival pitch, not a mixture of the slide and the old note.
      const recent=samples.subarray(Math.max(0,samples.length-(flow?Math.ceil(sampleRate*.06):8192)));
      const levelSamples=flow?recent:samples;
      let energy=0;for(const value of levelSamples)energy+=value*value;
      const level=Math.sqrt(energy/levelSamples.length),chord=pitches.length>1;
      let match=false;
      if(level>=FretboardPitch.minLevel){
        if(chord)match=detector.matches(detector.analyze(spectrum,sampleRate,fftSize),pitches);
        else{
          const hz=FretboardPitch.detect(recent,sampleRate,{maxFrequency:1500});
          match=Boolean(hz&&Math.abs(FretboardPitch.cents(hz,pitches[0]))<=(flow?45:38));
          // A liaison is one isolated note. A full triad whose fundamental
          // happens to be that third must not skip the single-note target.
          if(match&&exercises[state.index].columns[current().index].kind==='third'){
            const result=detector.analyze(spectrum,sampleRate,fftSize);
            match=detector.matchesSingle(result,pitches[0]);
          }
        }
      }
      if(!gate.update({match,level,now,chord,holdMs:column.holdMs??(flow?(chord?64:50):undefined),minConfirmations:flow?3:undefined,maxGapMs:flow?120:undefined}))return;
      lastPitches=pitches;current().index++;
      draw(true);
      if(current().index===(currentSection()?.end||exercises[state.index].columns.length)){advance();return}
      const next=targetPitches();gate.reset(soundKey(next)===soundKey(pitches));
      // Different notes can follow immediately, including a slide with no new
      // pluck. The gate still requires fresh evidence and blocks held repeats.
      settleUntil=now+(flow?0:200);showTarget();
    }
    function cancelTransition(){
      clearTimeout(transition);transition=0;
      $('#routineTransition').hidden=true;$('#routineNext').disabled=false;
      $('#routineExercise').classList.toggle('is-transitioning',false);
    }
    function renderNext(){
      const exercise=exercises[state.index];
      if(!exercise)return;
      const nextSection=exercise.sections?.[current().section+1];
      let label='Next →';
      if(nextSection?.label==='Returning')label='Return →';
      else if(nextSection?.diagonal)label=`${t(`Diagonal ${nextSection.diagonal}`)} →`;
      else if(nextSection)label=exercise.rootJourney?'Try from memory →':'Next strings →';
      else if((!exercise.strumming||current().index===exercise.patterns.length-1)&&
        exercises.every((_,i)=>i===state.index||completed.has(i)))label='Done';
      $('#routineNext').textContent=t(label);
    }
    function render(){
      const done=state.index===5,exercise=exercises[Math.min(state.index,4)];
      $('#routineSteps').replaceChildren();
      exercises.forEach((item,i)=>{
        const step=document.createElement('li'),button=document.createElement('button');
        button.type='button';button.className='ui-step';button.textContent=t(item.step);button.dataset.step=String(i+1);button.dataset.exercise=item.id;
        button.addEventListener('click',()=>{
          strumming.stop();cancelTransition();state.index=i;
          if(completed.has(i)||(!exercises[state.index].strumming&&current().index===exercises[state.index].columns.length)){current().index=0;current().section=0;current().rhythm=null;current().rootRevealed=false}
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
        const label=t(exercise.id==='root'?(exercise.rootJourney?'Connect the root notes':'Find the root note'):exercise.title);
        const at=exercise.id==='root'?-1:label.indexOf(target);
        const before=document.createElement('span'),badge=document.createElement('span'),after=document.createElement('span');
        before.textContent=at<0?label+' ':label.slice(0,at);
        badge.className='routine-target';badge.textContent=target;
        after.textContent=at<0?'':label.slice(at+target.length);
        title.replaceChildren();title.append(before,badge,after);title.setAttribute('data-no-i18n','');
      }
      $('#routineContext').hidden=!done&&!exercise.melody&&exercise.id!=='root'&&exercise.id!=='penta';
      $('#routineContext').textContent=t(done?`${state.root} ${state.quality} · Five exercises completed`:exercise.detail);
      if(done)$('#routineInstruction').textContent=t('Five exercises. One key. You did it! Keep building your skills in Learn, or put your knowledge to the test in Quiz.');else renderInstruction();
      $('#routineCelebration').hidden=!done;$('#routineExercise').classList.toggle('is-complete',done);
      $('#routineTabScroll').hidden=done;$('#routineLegend').hidden=done;
      if(done)strumming.update(null);
      $('#routineNext').hidden=done;$('#routineFinish').hidden=!done;
      $('#routineRootReveal').hidden=true;
      renderNext();
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
      transition=setTimeout(completeTransition,2600);
    }
    function completeTransition(){
      if(!transition)return;
      cancelTransition();if(!active)return;
      const section=currentSection(),hasNextSection=section&&current().section<exercises[state.index].sections.length-1;
      if(hasNextSection){current().index=section.end;current().section++;current().rootRevealed=false}
      else{
        completed.add(state.index);state.index++;
        if(state.index===5&&completed.size<5)state.index=exercises.findIndex((_,i)=>!completed.has(i));
      }
      if(state.index===5)microphone.stop();
      else {resetGates(soundKey(targetPitches())===soundKey(lastPitches));settleUntil=performance.now()+400}
      render();$('#routineTitle').focus({preventScroll:true});$('#routineSteps').scrollIntoView({block:'nearest',behavior:'auto'});
      if(hasNextSection||exercises[state.index]?.melody)showTarget();
    }
    window.FretboardModal?.addClose($('#routineTransition'),completeTransition);
    function reset(){
      strumming.stop();cancelTransition();completed.clear();state.index=0;encouragements.reset();lastPitches=[];
      exercises=RoutineExercises.create({engine,root:state.root,quality:state.quality,random,patterns});
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
    $('#routineRootReveal').addEventListener('click',()=>{
      if(!active||transition||!exercises[state.index]?.rootJourney||!currentSection()?.recall)return;
      current().rootRevealed=true;renderInstruction();draw();
    });
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
      chooseRhythmPatterns();reset();if(micPreference.enabled)microphone.start();$('#routineTitle').focus({preventScroll:true});$('#routineSteps').scrollIntoView({block:'nearest',behavior:'auto'});
    });
    if(window.ResizeObserver)new window.ResizeObserver(()=>{draw();showTarget()}).observe($('#routineTabScroll'));
    return {
      resize(){draw();showTarget()},
      leave(){active=false;cancelTransition();microphone.stop();strumming.stop()},
      enter(){active=true;microphone.stop();state.root=access.unlocked?MusicTheory.NOTES[Math.floor(random()*MusicTheory.NOTES.length)]:'A';state.quality='minor';chooseRhythmPatterns();reset();if(micPreference.enabled)microphone.start()}
    };
  }
  window.RoutineSession=Object.freeze({create});
})();

