(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const el=(tag,attrs={},text='')=>{const node=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);if(text)node.textContent=text;return node};
  function create({root,onProgress,onComplete,onAudioReset,onRepeat}){
    const $=selector=>root.querySelector(selector),t=value=>window.FretboardI18n?.text(value)||value,svg=$('#routineRhythmTab'),audio=RoutineRhythmAudio.create();
    let exercise=null,index=0,clock=null,preview=null,opening=false,guided=false,frame=0,lastFrame=0,tempo=RoutineRhythm.DEFAULT_TEMPO,feedback=null,cells=[],request=0,lastSlot=-1;
    const pattern=()=>exercise.patterns[index],activeClock=()=>preview||clock;
    function text(selector,value){const node=$(selector);if(node.textContent!==value)node.textContent=value}
    function cancel(){cancelAnimationFrame(frame);frame=0;lastFrame=0}
    function save(){if(clock)onProgress(index,{clock,index,tempo})}
    function clearFeedback(){feedback=null;$('#routineRhythmFeedback').hidden=true}
    function makeClock(listening,now=performance.now()){return RoutineRhythm.create({pattern:pattern(),tempo,guided:listening,now,onRepeat:success=>onRepeat(pattern().id,success)})}
    function resumePractice(){
      if(!clock||preview||opening||document.hidden||document.querySelector?.('.tuner-dialog[open]'))return;
      clock.resume(performance.now());onAudioReset();save();start();paint(performance.now());
    }
    function build(){
      if(!exercise)return;
      const p=pattern(),width=Math.max(240,Math.round(svg.parentElement.clientWidth));
      const perRow=p.division===4?(width<600?2:width<1050?4:8):(width<680?4:8),beats=Math.min(p.beats,perRow),slots=beats*p.division;
      const spacing=(width-32)/slots,rows=Math.ceil(p.beats/beats),height=rows*126;
      svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('aria-label',t(p.name));cells=[];
      p.slots.forEach((stroke,slot)=>{
        const row=Math.floor(slot/slots),column=slot%slots,x=16+(column+.5)*spacing,y=45+row*126;
        const group=el('g',{'data-slot':slot});
        if(stroke){
          const title=t(stroke.mute==='percussive'?'Muted hit':stroke.mute==='palm'?'Palm mute':stroke.direction==='up'?'Up':'Down');
          group.append(el('title',{},title));
          const size=Math.min(21,spacing*.34);
          const arrow=stroke.mute==='percussive'?el('text',{x,y:y+16,'text-anchor':'middle','class':'rhythm-arrow rhythm-percussive'},'×'):el('path',{d:'M-4 -21 H4 V5 H13 L0 21 L-13 5 H-4 Z',transform:`translate(${x} ${y}) scale(${size/21})${stroke.direction==='up'?' rotate(180)':''}`,'class':'rhythm-arrow'});
          group.append(arrow);if(stroke.mute==='palm')group.append(el('text',{x,y:y-27,'text-anchor':'middle','class':'rhythm-mark'},'PM'));
          if(stroke.accent)group.append(el('text',{x,y:y-27,'text-anchor':'middle','class':'rhythm-mark'},'>'));
          cells[slot]={arrow,x,y,row};
        }
        const sub=slot%p.division,beat=Math.floor(slot/p.division)+1,label=sub===0?String(beat):p.division===2?'&':['','e','&','a'][sub];
        group.append(el('text',{x,y:y+46,'text-anchor':'middle','class':'rhythm-beat'},label));svg.append(group);
        if(sub===0){const right=x+(p.division-1)*spacing;svg.append(el('path',{d:`M${x} ${y+57} v7 H${right} v-7`,'class':'rhythm-beam'}));if(p.division===4)svg.append(el('line',{x1:x,x2:right,y1:y+69,y2:y+69,'class':'rhythm-beam'}))}
      });
      const nav=$('#routinePatternSteps');nav.replaceChildren();
      exercise.patterns.forEach((p,i)=>{
        const step=document.createElement('li'),label=document.createElement('span');
        label.className='ui-step';label.dataset.step=String(i+1);label.textContent=t(p.name);
        step.classList.toggle('is-current',i===index);step.classList.toggle('is-complete',i<index);
        if(i===index)step.setAttribute('aria-current','step');step.append(label);nav.append(step);
      });
      nav.setAttribute('aria-label',t('Warm-up patterns'));
      text('#routinePatternHelp',t('Keep your hand moving through the gaps.'));
      const timing=t('Numbers = beats · & = halfway between beats · Beams = one beat');
      text('#routineLegend',[
        t('↓ Downstroke · ↑ Upstroke · × Muted hit · PM Palm-muted stroke · > Accent (play louder)'),
        timing+(p.division===4?' · '+t('e / a = second / fourth sixteenth of the beat'):''),
        t('No arrow = keep moving without striking · Pink = current stroke')
      ].join('\n'));
      text('#routineRepeatLabel',t('Successful repeats'));
      text('#routineRepeatHint',t('3 successful repeats → continue automatically.'));
      const dots=$('#routineRepeatDots');dots.replaceChildren();
      for(let i=0;i<RoutineRhythm.REQUIRED_REPEATS;i++)dots.append(document.createElement('span'));
      $('#routineTempo').setAttribute('aria-label',t('Tempo'));
      paint(performance.now());
    }
    function paint(now){
      if(!clock)return;
      const s=activeClock().snapshot(now),slot=s.slot;
      cells.forEach((cell,i)=>{if(cell)cell.arrow.classList.toggle('is-current',i===slot&&!s.paused)});
      const show=feedback&&now<feedback.until&&!s.paused&&!preview;
      $('#routineRhythmFeedback').hidden=!show;
      if(show){const cell=cells[feedback.slot];if(cell){const box=svg.viewBox?.baseVal,width=box?.width||Number(svg.getAttribute('viewBox').split(' ')[2]),height=box?.height||Number(svg.getAttribute('viewBox').split(' ')[3]);$('#routineRhythmFeedback').style.left=`${Math.max(15,Math.min(85,cell.x/width*100))}%`;$('#routineRhythmFeedback').style.top=`${Math.max(0,(cell.y-43)/height*100)}%`}}
      const successes=clock.snapshot(now).successes;
      text('#routineRepeatCount',`${successes} / ${RoutineRhythm.REQUIRED_REPEATS}`);
      Array.from($('#routineRepeatDots').children).forEach((dot,i)=>dot.classList.toggle('is-complete',i<successes));
      text('#routineRepeatStatus',t(preview?'Pause the example when you are ready to play.':!guided?'Turn on the mic to advance automatically.':''));
      $('#routineRepeatStatus').hidden=guided&&!preview;
      text('#routineRhythmPreview',t(preview?'Pause':'Listen'));$('#routineRhythmPreview').setAttribute('aria-pressed',String(Boolean(preview)));
      $('#routineNoteProgress').hidden=true;
      if(slot!==lastSlot&&slot>=0&&!s.paused){
        const cell=cells[slot],previous=cells[lastSlot];
        if(cell&&cell.row!==previous?.row)svg.querySelector(`[data-slot="${slot}"]`)?.scrollIntoView({block:'nearest',behavior:'auto'});
      }
      lastSlot=slot;
    }
    function tick(now){
      frame=0;if(!clock||activeClock().snapshot(now).paused)return;
      if(lastFrame&&now-lastFrame>350){activeClock().shift(now-lastFrame);audio.stop();onAudioReset();clearFeedback()}
      lastFrame=now;
      if(preview)audio.schedule(pattern(),preview.snapshot(now));
      else if(clock.tick(now)){next();return}
      paint(now);frame=requestAnimationFrame(tick);
    }
    function start(){cancel();if(clock&&!activeClock().snapshot(performance.now()).paused)frame=requestAnimationFrame(tick)}
    function stopPreview(){request++;audio.close();preview=null;opening=false;$('#routineRhythmPreview').setAttribute('aria-busy','false');clearFeedback();onAudioReset()}
    async function startPreview(){
      if(!clock||preview||document.hidden||document.querySelector?.('.tuner-dialog[open]'))return;
      clock.pause(performance.now());cancel();clearFeedback();save();onAudioReset();paint(performance.now());
      const token=++request;opening=true;$('#routineRhythmPreview').setAttribute('aria-busy','true');
      // A browser may leave resume() pending until a user gesture. Keep Listen
      // clickable so a tap can unlock audio; stale openings cannot start it.
      const ready=await audio.open();if(token!==request||!exercise)return;
      opening=false;$('#routineRhythmPreview').setAttribute('aria-busy','false');
      if(!ready){stopPreview();text('#routinePatternHelp',t('Audio preview unavailable.'));resumePractice();return}
      text('#routinePatternHelp',t('Keep your hand moving through the gaps.'));
      const now=performance.now();preview=makeClock(false,now);audio.schedule(pattern(),preview.snapshot(now));start();paint(now);
    }
    function next(){
      if(!exercise)return;
      stopPreview();cancel();index++;
      if(index===exercise.patterns.length){save();onComplete();return}
      clock=makeClock(guided);save();onAudioReset();lastSlot=-1;build();startPreview();
    }
    $('#routineTempo').value=String(tempo);
    $('#routineTempo').addEventListener('change',event=>{
      const value=Number(event.target.value);if(!Number.isFinite(value)||value<20||value>120)return;tempo=value;if(!clock)return;
      const now=performance.now();clock.setTempo(tempo,now);clearFeedback();save();
      if(preview){preview.setTempo(tempo,now);audio.stop();audio.schedule(pattern(),preview.snapshot(now));start();paint(now)}
      else resumePractice();
    });
    $('#routineRhythmPreview').addEventListener('click',async()=>{
      if(!clock)return;
      if(preview){stopPreview();resumePractice();return}
      await startPreview();
    });
    $('#routineTuner').addEventListener('click',()=>{if(clock){stopPreview();clock.pause(performance.now());save();cancel();paint(performance.now())}});
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden&&clock){stopPreview();clock.pause(performance.now());save();cancel();paint(performance.now())}
      else if(!document.hidden)resumePractice();
    });
    document.addEventListener('close',event=>{if(event.target.classList?.contains('tuner-dialog'))resumePractice()},true);
    return {
      next,
      stop(){if(clock){clock.pause(performance.now());save()}stopPreview();cancel();exercise=null;clock=null;cells=[];lastSlot=-1},
      update(nextExercise,nextIndex=0,listening=false,progress=null){
        const next=nextExercise?.strumming?nextExercise:null;
        $('#routineStrumming').hidden=!next;$('#routineRhythmControls').hidden=!next;
        if(!next){this.stop();return}
        let firstVisit=false;
        if(next!==exercise){
          this.stop();exercise=next;index=Math.min(next.patterns.length-1,nextIndex);guided=listening;
          tempo=progress?.tempo||tempo;$('#routineTempo').value=String(tempo);
          clock=progress?.clock||makeClock(guided);if(clock.snapshot(performance.now()).guided!==guided)clock.setGuided(guided,performance.now());
          if(progress?.clock)clock.resume(performance.now());
          firstVisit=!progress?.clock;save();onAudioReset();start();
        }else if(guided!==listening){guided=listening;clock.setGuided(guided,performance.now());onAudioReset()}
        build();if(firstVisit)startPreview();
      },
      attack(at,now){
        if(!clock||preview||opening)return;const value=clock.attack(at);if(!value||!value.accepted&&value.inTime)return;
        feedback={...value,until:now+Math.min(900,clock.snapshot(now).beatMs)};
        text('#routineRhythmGrade',t(value.grade));const host=$('#routineRhythmFeedback');host.classList.toggle('rhythm-feedback-pop',false);void host.offsetWidth;host.classList.toggle('rhythm-feedback-pop',true);paint(now);
      },
      get refractory(){return clock?.refractory||100}
    };
  }
  window.RoutineStrumming=Object.freeze({create});
})();
