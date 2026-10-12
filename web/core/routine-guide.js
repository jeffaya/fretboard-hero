(function(root){
  'use strict';
  // Consecutive evidence, not accumulated successes: a wrong note resets the hold.
  // Identical pitches in adjacent positions need a release or a fresh attack.
  function createGate(){
    let since=null,last=-Infinity,blocked=false,quietSince=null,previousLevel=0,attack=0,confirmations=0;
    return {
      reset(repeat=false){since=null;last=-Infinity;blocked=repeat;quietSince=null;previousLevel=0;attack=0;confirmations=0},
      update({match,level,now,chord=false}){
        if(now-last>250){since=null;confirmations=0}last=now;
        // A fresh pluck is a relative rise, even when both notes are quiet.
        const onset=match&&previousLevel>0&&level>previousLevel*1.9;
        previousLevel=level;
        if(blocked){
          if(!match){if(quietSince===null)quietSince=now;if(now-quietSince>=150)blocked=false}else quietSince=null;
          if(onset)attack=now;
          if(attack&&now-attack>=180)blocked=false;
          if(blocked)return false;
        }
        if(!match){since=null;confirmations=0;return false}
        if(since===null)since=now;
        confirmations++;
        // Three complete chord observations at the 80 ms cadence are enough;
        // a long hold used to outlast short finger-plucked chords.
        if(now-since<(chord?160:190)||(chord&&confirmations<3))return false;
        since=null;confirmations=0;blocked=true;quietSince=null;attack=0;return true;
      }
    };
  }
  // Strumming needs a fresh transient for every stroke, including the first.
  // Look at short RMS windows in the newest audio, not the long chord FFT:
  // its overlapping tail otherwise hides the next attack under a ringing chord.
  function createStrumGate(){
    let last=-Infinity,lastAttack=-Infinity,previous=0,pending=null,matches=0;
    return {
      reset(){last=-Infinity;lastAttack=-Infinity;previous=0;pending=null;matches=0},
      update({samples,sampleRate,now,match,onAttack=()=>{}}){
        const gap=now-last;
        if(gap>250){pending=null;matches=0}
        const duration=Math.min(80,Number.isFinite(gap)?gap:80),size=Math.max(1,Math.round(sampleRate*.02));
        const start=Math.max(0,samples.length-Math.round(sampleRate*duration/1000));
        for(let i=start;i+size<=samples.length;i+=size){
          let energy=0;for(let j=i;j<i+size;j++)energy+=samples[j]*samples[j];
          const level=Math.sqrt(energy/size),time=now-(samples.length-i-size)*1000/sampleRate;
          if(level>=.0005&&level>previous*1.65&&time-lastAttack>=240){pending=time;lastAttack=time;matches=0;onAttack(time)}
          previous=level;
        }
        last=now;
        if(pending===null)return false;
        if(now-pending>560){const at=pending;pending=null;matches=0;return {at,match:false}}
        // Let the FFT catch up with the attack before judging its harmony.
        if(now-pending<160)return false;
        matches=(typeof match==='function'?match(pending):match)?matches+1:0;
        if(matches<2)return false;
        const at=pending;pending=null;matches=0;return {at,match:true};
      }
    };
  }
  const api={createGate,createStrumGate};
  if(typeof module==='object')module.exports=api;else root.RoutineGuide=Object.freeze(api);
})(typeof window==='object'?window:globalThis);
