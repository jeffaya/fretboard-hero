(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const el=(tag,attrs={},text='')=>{const node=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);if(text)node.textContent=text;return node};
  function create({root,engine,onProgress,onComplete,onAudioReset}){
    const $=selector=>root.querySelector(selector),t=value=>window.FretboardI18n?.text(value)||value;
    const svg=$('#routineRhythmTab'),motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    let exercise=null,clock=null,guided=false,paused=false,frame=0,lastFrame=0,pausedAt=0,tempo=RoutineRhythm.DEFAULT_TEMPO,feedback=null,savedNext=-1;
    let track,playhead,cells=[],width=0,spacing=0,lineX=0;
    function text(selector,value){const node=$(selector);if(node.textContent!==value)node.textContent=value}
    function cancel(){cancelAnimationFrame(frame);frame=0;lastFrame=0}
    function build(){
      width=Math.max(240,Math.round(svg.parentElement.clientWidth));spacing=motion.matches?(width-68)/4:Math.max(64,Math.min(104,(width-80)/4));lineX=width<600?72:110;
      svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${width} 252`);
      svg.setAttribute('aria-label',t('Aim for the center of the pink band.'));
      const defs=el('defs'),clip=el('clipPath',{id:'routineRhythmClip'});
      clip.append(el('rect',{x:36,y:0,width:width-36,height:252}));defs.append(clip);svg.append(defs);
      engine.courses.forEach((course,string)=>{
        const y=74+(engine.stringCount-1-string)*27;
        svg.append(el('text',{x:7,y:y+5,'class':'rhythm-string'},window.FretboardI18n?.note(course.name)||course.name),el('line',{x1:36,y1:y,x2:width,y2:y,'class':'rhythm-string-line'}));
      });
      const viewport=el('g',{'clip-path':'url(#routineRhythmClip)'});
      playhead=el('g',{'aria-hidden':'true'});
      playhead.append(el('rect',{x:-14,y:48,width:28,height:172,rx:8,'class':'rhythm-playhead'}),el('line',{x1:0,x2:0,y1:48,y2:220,'class':'rhythm-playhead-center'}));
      track=el('g');viewport.append(playhead,track);svg.append(viewport);cells=[];
      exercise.columns.forEach((column,index)=>{
        const x=index*spacing,group=el('g',{'class':'routine-tab-column','data-column':index});
        group.append(el('title',{},t(`${column.root} ${column.quality}`)+'. '+column.notes.map(n=>t(`${engine.tuning[n.string].name} string ${engine.stringCount-n.string}, fret ${n.fret}`)).join(', ')));
        if(column.beat===0)group.append(el('line',{x1:x-spacing/2,x2:x-spacing/2,y1:48,y2:220,'class':'rhythm-bar-line'}));
        if(!index||exercise.columns[index-1].rootPC!==column.rootPC||column.beat===0){
          const name=column.root+(column.quality==='minor'?'m':'');
          group.append(el('text',{x,y:29,'class':'rhythm-chord','text-anchor':'middle'},window.FretboardI18n?.note(name)||name));
        }
        engine.courses.forEach((_,string)=>{
          const note=column.notes.find(n=>n.string===string),y=74+(engine.stringCount-1-string)*27;
          group.append(el('rect',{x:x-14,y:y-12,width:28,height:24,rx:5,'class':note?'routine-note-face':'rhythm-mute-face'}),el('text',{x,y:y+1,'text-anchor':'middle','dominant-baseline':'central','class':note?'routine-note-number':'rhythm-mute'},note?String(note.fret):'×'));
        });
        const beat=el('text',{x,y:242,'text-anchor':'middle','class':'rhythm-beat'},String(column.beat+1));
        group.append(beat);track.append(group);cells.push({group,beat});
      });
    }
    function save(now){
      if(!clock)return;
      const s=clock.snapshot(now);savedNext=s.next;onProgress(s.next,s.states);
    }
    function clearFeedback(){feedback=null;$('#routineRhythmFeedback').hidden=true}
    function showFeedback(value,now){
      const fresh=!feedback||feedback.at!==value.at;
      feedback={...value,until:now+1000};
      text('#routineRhythmGrade',t(value.grade));
      text('#routineRhythmChord',t(value.match===undefined?'Checking chord…':value.match?'Chord recognized':'Chord not recognized'));
      const host=$('#routineRhythmFeedback');host.hidden=false;
      host.classList.toggle('is-confirmed',value.accepted===true);
      host.classList.toggle('is-offset',!value.inTime||value.grade==='Early'||value.grade==='Late');
      if(fresh){host.classList.toggle('rhythm-feedback-pop',false);void host.offsetWidth;host.classList.toggle('rhythm-feedback-pop',true)}
      paint(now);
    }
    function paint(now){
      if(!clock)return;
      if(paused)now=pausedAt;
      const s=clock.snapshot(now),position=Math.min(exercise.columns.length,Math.max(s.next-1,s.position));
      if(motion.matches){
        const step=(width-68)/4;
        track.setAttribute('transform',`translate(${52-s.bar*4*step} 0)`);
        const x=52+Math.max(0,Math.min(3,Math.floor(s.position)-s.bar*4))*step;
        playhead.setAttribute('transform',`translate(${x} 0)`);
      }else{
        track.setAttribute('transform',`translate(${lineX-position*spacing} 0)`);
        playhead.setAttribute('transform',`translate(${lineX} 0)`);
      }
      cells.forEach(({group,beat},i)=>{
        group.style.display=motion.matches&&Math.floor(i/4)!==s.bar?'none':'';
        // Light only while the note's center is inside the band. A preview
        // remains readable during count-in, but does not pretend it is due.
        group.classList.toggle('is-target',s.countIn===0&&!s.finished&&Math.abs(s.position-i)*spacing<=14&&s.states[i]!=='played');
        group.classList.toggle('is-played',s.states[i]==='played');
        group.classList.toggle('is-past',s.position>i+.5&&s.states[i]!=='played');
        const label=s.states[i]==='played'?'✓':String(i%4+1);
        if(beat.textContent!==label)beat.textContent=label;
      });
      $('#routineCountIn').hidden=s.countIn===0||paused||s.finished;
      text('#routineCountInLabel',t('Get ready'));
      text('#routineCountInNumber',String(Math.min(3,s.countIn)));
      const show=feedback&&now<feedback.until&&!paused;
      $('#routineRhythmFeedback').hidden=!show;
      $('#routineRhythmStatus').hidden=Boolean(show);
      text('#routineStrumBar',t(`Bar ${s.bar+1} / 8`));
      text('#routineRhythmStatus',t(s.finished?'Practice complete':paused?'Paused':s.countIn?'Get ready':`Beat ${Math.max(1,Math.min(4,Math.floor(s.position)-s.bar*4+1))} / 4`));
      text('#routineStrumHelp',t(!guided?'Microphone off: practice without validation.':'Aim for the center. Keep playing, even after a mistake.'));
      text('#routineNoteProgress',`${s.states.filter(state=>state==='played').length} / ${exercise.columns.length}`);
      text('#routineRhythmToggle',t(paused||s.finished?'Start':'Pause'));
      $('#routineRhythmToggle').setAttribute('aria-pressed',String(!paused&&!s.finished));
    }
    function complete(now,manual=false){
      save(now);cancel();
      if(guided||manual)onComplete();
    }
    function tick(now){
      frame=0;if(!clock||paused)return;
      // Freeze across a stalled frame, preserving the exact place in the
      // score. No count-in, rewinding, or failed-measure loop is introduced.
      if(lastFrame&&now-lastFrame>350){clock.shift(now-lastFrame);onAudioReset();clearFeedback()}
      lastFrame=now;
      const done=clock.tick(now);
      if(clock.snapshot(now).next!==savedNext)save(now);
      paint(now);
      if(done)complete(now);
      if(clock&&!clock.snapshot(now).finished&&!paused)frame=requestAnimationFrame(tick);
    }
    function start(){cancel();if(clock&&!paused&&!clock.snapshot(performance.now()).finished)frame=requestAnimationFrame(tick)}
    function pause(now){paused=true;pausedAt=now;clock.pause(now);onAudioReset();clearFeedback();save(now);cancel();paint(now)}
    $('#routineRhythmToggle').addEventListener('click',()=>{
      if(!clock)return;
      const now=performance.now();
      if(clock.snapshot(now).finished){clock=RoutineRhythm.create({columns:exercise.columns,tempo,guided,now});paused=false;save(now)}
      else if(!paused){pause(now);return}
      else{paused=false;clock.resume(now)}
      onAudioReset();clearFeedback();start();paint(now);
    });
    $('#routineTempo').addEventListener('change',event=>{
      tempo=Number(event.target.value);if(!clock)return;
      clock.setTempo(tempo,performance.now());onAudioReset();clearFeedback();paint(performance.now());
    });
    $('#routineStrumNext').addEventListener('click',()=>{
      if(!clock)return;
      const now=performance.now(),done=clock.skip(now);
      onAudioReset();clearFeedback();save(now);paint(now);
      if(done)complete(now,true);else start();
    });
    motion.addEventListener?.('change',()=>{if(clock){build();paint(performance.now())}});
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden&&clock)pause(performance.now())
    });
    return {
      stop(){if(clock)save(performance.now());cancel();exercise=null;clock=null;clearFeedback()},
      update(next,index=0,listening=false,played=[]){
        next=next?.strumming?next:null;
        $('#routineStrumming').hidden=!next;
        if(!next){this.stop();return}
        if(next!==exercise){
          exercise=next;guided=listening;paused=false;savedNext=-1;clearFeedback();
          clock=RoutineRhythm.create({columns:exercise.columns,index:Math.min(exercise.columns.length-1,index),tempo,guided,played,now:performance.now()});
          onAudioReset();start();
        }else if(guided!==listening){
          guided=listening;clock.setGuided(guided,performance.now());onAudioReset();clearFeedback();
        }
        text('#routineTempoLabel',t('Tempo'));text('#routineStrumNext',t('Next bar →'));
        build();paint(performance.now());
      },
      targetAt(at){
        if(!clock||paused||!guided)return null;
        const index=clock.targetAt(at);return index<0?null:exercise.columns[index];
      },
      attack(at,now){if(clock&&!paused){const result=clock.attack(at);if(result)showFeedback(result,now)}},
      confirm(at,match,now){
        if(!clock||paused)return;
        const result=clock.confirm(at,match,now);if(!result)return;
        save(now);if(feedback?.at===at)showFeedback(result,now);else paint(now);
      }
    };
  }
  window.RoutineStrumming=Object.freeze({create});
})();
