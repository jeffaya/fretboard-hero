(function(root){
  'use strict';
  function sequence(exercise){
    const forward=exercise.columns.map((_,i)=>i);
    const returns=exercise.id==='scale'||exercise.id==='penta'||(exercise.id==='chords'&&exercise.columns.every(c=>c.notes.length===1));
    return returns?forward.concat(forward.slice(0,-1).reverse()):forward;
  }
  // Consecutive evidence, not accumulated successes: a wrong note resets the hold.
  // Identical pitches in adjacent positions need a release or a fresh attack.
  function createGate(){
    let since=null,last=-Infinity,blocked=false,quietSince=null,previousLevel=0,attack=0;
    return {
      reset(repeat=false){since=null;last=-Infinity;blocked=repeat;quietSince=null;previousLevel=0;attack=0},
      update({match,level,now,chord=false}){
        if(now-last>250)since=null;last=now;
        const onset=previousLevel>0&&level>Math.max(.008,previousLevel*1.9);
        previousLevel=level;
        if(blocked){
          if(!match){if(quietSince===null)quietSince=now;if(now-quietSince>=150)blocked=false}else quietSince=null;
          if(onset)attack=now;
          if(attack&&now-attack>=180)blocked=false;
          if(blocked)return false;
        }
        if(!match){since=null;return false}
        if(since===null)since=now;
        if(now-since<(chord?360:190))return false;
        since=null;blocked=true;quietSince=null;attack=0;return true;
      }
    };
  }
  const api={sequence,createGate};
  if(typeof module==='object')module.exports=api;else root.RoutineGuide=Object.freeze(api);
})(typeof window==='object'?window:globalThis);
