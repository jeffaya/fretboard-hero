(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const el=(tag,attrs={},text='')=>{const node=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);if(text)node.textContent=text;return node};
  function create({root,engine,onProgress,onComplete,onRestart}){
    const $=selector=>root.querySelector(selector),t=value=>window.FretboardI18n?.text(value)||value;
    const svg=$('#routineRhythmTab'),motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    let exercise=null,clock=null,guided=false,paused=false,frame=0,lastFrame=0,pausedAt=0,tempo=72;
    let track,playhead,cells=[],width=0,spacing=0,lineX=0;
    function text(selector,value){const node=$(selector);if(node.textContent!==value)node.textContent=value}
    function cancel(){cancelAnimationFrame(frame);frame=0;lastFrame=0}
    function build(){
      width=Math.max(240,Math.round(svg.parentElement.clientWidth));spacing=motion.matches?(width-68)/4:Math.max(64,Math.min(104,(width-80)/4));lineX=width<600?72:110;
      svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${width} 252`);
      svg.setAttribute('aria-label',t('Play when the chord reaches the line.'));
      const defs=el('defs'),clip=el('clipPath',{id:'routineRhythmClip'});
      clip.append(el('rect',{x:36,y:0,width:width-36,height:252}));defs.append(clip);svg.append(defs);
      engine.courses.forEach((course,string)=>{
        const y=74+(engine.stringCount-1-string)*27;
        svg.append(el('text',{x:7,y:y+5,'class':'rhythm-string'},window.FretboardI18n?.note(course.name)||course.name),el('line',{x1:36,y1:y,x2:width,y2:y,'class':'rhythm-string-line'}));
      });
      const viewport=el('g',{'clip-path':'url(#routineRhythmClip)'});
      playhead=el('line',{x1:lineX,x2:lineX,y1:48,y2:220,'class':'rhythm-playhead','aria-hidden':'true'});
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
    function paint(now){
      if(!clock)return;
      if(paused)now=pausedAt;
      const s=clock.snapshot(now),position=s.finished?3:Math.max(-1,s.beat),target=s.bar*4+Math.max(0,Math.min(3,Math.round(position)));
      if(motion.matches){
        const step=(width-68)/4;
        track.setAttribute('transform',`translate(${52-s.bar*4*step} 0)`);
        const x=52+Math.max(0,Math.min(3,Math.floor(position)))*step;
        playhead.setAttribute('x1',x);playhead.setAttribute('x2',x);
      }else{
        track.setAttribute('transform',`translate(${lineX-(s.bar*4+position)*spacing} 0)`);
        playhead.setAttribute('x1',lineX);playhead.setAttribute('x2',lineX);
      }
      cells.forEach(({group,beat},i)=>{
        group.style.display=motion.matches&&Math.floor(i/4)!==s.bar?'none':'';
        group.classList.toggle('is-target',i===target&&!s.finished&&s.states[i]!=='played');
        group.classList.toggle('is-played',s.states[i]==='played');
        group.classList.toggle('is-missed',s.states[i]==='missed');
        const label=s.states[i]==='played'?'✓':s.states[i]==='missed'?'×':String(i%4+1);
        if(beat.textContent!==label)beat.textContent=label;
      });
      const countdown=Math.min(4,Math.max(1,Math.ceil(-s.beat-1e-8)));
      text('#routineStrumBar',t(`Bar ${s.bar+1} / 8`));
      text('#routineRhythmStatus',t(s.finished?(guided?'Well played!':'Practice complete'):paused?'Paused':s.beat<0?`${s.retrying?'Again':'Ready'}: ${countdown}`:`Beat ${Math.min(4,Math.floor(s.beat)+1)} / 4`));
      text('#routineStrumHelp',t(!guided?'Microphone off: practice without validation.':s.retrying&&s.beat<0?'Missed beat or chord. Replay this bar.':'Play at the line. Down or up: your choice.'));
      text('#routineNoteProgress',`${s.states.filter(state=>state==='played').length} / ${exercise.columns.length}`);
      text('#routineRhythmToggle',t(paused||s.finished?'Start':'Pause'));
      $('#routineRhythmToggle').setAttribute('aria-pressed',String(!paused&&!s.finished));
    }
    function handle(event,manual=false){
      if(event==='retry')onRestart();
      if(event==='bar')onProgress(clock.snapshot(0).bar*4,clock.snapshot(0).states);
      if(event==='complete'){
        cancel();
        if(guided||manual){onProgress(exercise.columns.length,clock.snapshot(0).states);onComplete()}
      }
    }
    function tick(now){
      frame=0;if(!clock||paused)return;
      // A stalled/background frame must not silently miss beats or skip bars.
      if(lastFrame&&now-lastFrame>350){clock.restart(now,tempo);onRestart()}
      lastFrame=now;
      handle(clock.tick(now));paint(now);
      if(clock&&!clock.snapshot(now).finished&&!paused)frame=requestAnimationFrame(tick);
    }
    function start(){cancel();if(clock&&!paused)frame=requestAnimationFrame(tick)}
    function restart(){if(!clock)return;pausedAt=performance.now();clock.restart(pausedAt,tempo);onRestart();paint(performance.now());start()}
    $('#routineRhythmToggle').addEventListener('click',()=>{
      if(!clock)return;
      if(clock.snapshot(performance.now()).finished){clock=RoutineRhythm.create({columns:exercise.columns,tempo,guided,now:performance.now()});onProgress(0,[]);paused=false;onRestart()}
      else{paused=!paused;pausedAt=performance.now();if(!paused)restart()}
      if(paused)cancel();else start();paint(performance.now());
    });
    $('#routineTempo').addEventListener('change',event=>{tempo=Number(event.target.value);restart()});
    $('#routineStrumNext').addEventListener('click',()=>{
      if(!clock)return;handle(clock.skip(performance.now()),true);onRestart();paint(performance.now());start();
    });
    motion.addEventListener?.('change',()=>{if(clock){build();paint(performance.now())}});
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden&&clock){paused=true;pausedAt=performance.now();cancel();paint(performance.now())}
    });
    return {
      stop(){cancel();exercise=null;clock=null},
      update(next,index=0,listening=false,played=[]){
        next=next?.strumming?next:null;
        $('#routineStrumming').hidden=!next;
        if(!next){this.stop();return}
        if(next!==exercise||guided!==listening){
          exercise=next;guided=listening;paused=false;
          clock=RoutineRhythm.create({columns:exercise.columns,bar:Math.min(7,Math.floor(index/4)),tempo,guided,played,now:performance.now()});
          onRestart();start();
        }
        text('#routineTempoLabel',t('Tempo'));text('#routineStrumNext',t('Next bar →'));
        build();paint(performance.now());
      },
      targetAt(at){
        if(!clock||paused||!guided)return null;
        const index=clock.targetAt(at);return index<0?null:exercise.columns[index];
      },
      hit(at,now){if(clock&&!paused&&clock.hit(at,now)){paint(now);return true}return false}
    };
  }
  window.RoutineStrumming=Object.freeze({create});
})();
