(() => {
  'use strict';
  const STORAGE='fretboard-play-v1';
  function create({root=document,engine,refreshControls}){
    const $=s=>root.querySelector(s),family=engine.profile.family;
    const state={root:'A',style:'Blues',level:'Beginner',index:0,daily:true};
    let completed=new Set(),storageAvailable=true;
    try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'[]');if(Array.isArray(saved))completed=new Set(saved.filter(x=>typeof x==='string').slice(-2000))}catch{storageAvailable=false}
    function current(){const choices=PlayExercises.list(family,state.style,state.level);return PlayExercises.transpose(choices[state.index%choices.length],state.root,engine)}
    const identity=exercise=>exercise.id+'-'+state.root;
    function save(){try{localStorage.setItem(STORAGE,JSON.stringify([...completed]));storageAvailable=true}catch{storageAvailable=false}}
    function render(){
      const exercise=current(),done=completed.has(identity(exercise));
      $('#playLickTitle').textContent=exercise.title;
      $('#playLickKicker').textContent=state.daily?'DAILY LICK':'PRACTICE LICK';
      const frets=exercise.notes.map(n=>n.fret);
      $('#playLickContext').textContent=`${state.root} minor pentatonic · ${state.style} · Frets ${Math.min(...frets)}–${Math.max(...frets)}`;
      $('#playTip').textContent=exercise.tip;
      $('#playTechniques').replaceChildren();
      exercise.techniques.forEach(code=>{const span=document.createElement('span');span.textContent=`${code} · ${PlayExercises.techniques[code]}`;$('#playTechniques').append(span)});
      $('#playNoteCount').textContent=`${exercise.notes.length} notes · ${exercise.techniques.length} technique${exercise.techniques.length===1?'':'s'}`;
      $('#playGotIt').textContent=done?'✓ Next lick':'✓ Got it';
      $('#playProgress').textContent=`Your practice · ${[...completed].filter(x=>x.startsWith(family+'-')).length} licks completed${storageAvailable?'':' · Saving unavailable on this device'}`;
      $('#playStatus').textContent=done?'Completed. Move on when you feel ready.':'';
      $('#playSimpler').hidden=true;
      PlayRenderer.render($('#playTab'),exercise,engine);
      $('#playTabScroll').scrollLeft=0;
      refreshControls();
    }
    function setup(id,values,key){const host=$('#'+id);values.forEach(value=>{const b=document.createElement('button');b.type='button';b.textContent=key==='root'?value+' minor':value;b.classList.toggle('active',state[key]===value);b.setAttribute('aria-pressed',String(state[key]===value));b.addEventListener('click',()=>{state[key]=value;state.index=PlayExercises.dailyIndex();state.daily=true;host.querySelectorAll('button').forEach(n=>{n.classList.toggle('active',n===b);n.setAttribute('aria-pressed',String(n===b))});render()});host.append(b)})}
    setup('playRootControls',MusicTheory.NOTES,'root');setup('playStyleControls',PlayExercises.styles,'style');setup('playLevelControls',PlayExercises.levels,'level');
    const next=()=>{state.index++;state.daily=false;render()};
    $('#playAnother').addEventListener('click',next);
    $('#playGotIt').addEventListener('click',()=>{const id=identity(current());if(completed.has(id)){next();return}completed.add(id);save();render();$('#playStatus').textContent='Nice work. This lick is marked as completed.'});
    $('#playPracticing').addEventListener('click',()=>{$('#playStatus').textContent='Take your time. Keep this lick and practise it again.';$('#playSimpler').hidden=state.level==='Beginner'});
    $('#playSimpler').addEventListener('click',()=>{state.level=PlayExercises.levels[Math.max(0,PlayExercises.levels.indexOf(state.level)-1)];$('#playLevelControls').querySelectorAll('button').forEach(b=>{const active=b.textContent===state.level;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});render()});
    return {resize(){PlayRenderer.render($('#playTab'),current(),engine)},enter(){if(state.daily)state.index=PlayExercises.dailyIndex();render()}};
  }
  window.PlaySession=Object.freeze({create});
})();
