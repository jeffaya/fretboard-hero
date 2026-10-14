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
  // An onset-only gate: short RMS rises include pitchless muted strokes.
  // A 120 ms peak envelope bridges harmonic beating in ringing chords;
  // comparing adjacent windows alone mistakes those dips for new attacks.
  // Timestamp at the start of the attack window, rather than at FFT delivery.
  function createStrumGate(){
    let last=-Infinity,lastAttack=-Infinity,envelope=0;
    return {
      reset(){last=-Infinity;lastAttack=-Infinity;envelope=0},
      update({samples,sampleRate,now,refractory=100,onAttack=()=>{}}){
        const gap=now-last;
        const duration=Math.min(100,Number.isFinite(gap)?gap:20),size=Math.max(1,Math.round(sampleRate*.01));
        const start=Math.max(0,samples.length-Math.round(sampleRate*duration/1000));
        for(let i=start;i+size<=samples.length;i+=size){
          let energy=0;for(let j=i;j<i+size;j++)energy+=samples[j]*samples[j];
          const level=Math.sqrt(energy/size),time=now-(samples.length-i)*1000/sampleRate;
          if(level>=.0005&&level>envelope*1.45&&time-lastAttack>=refractory){lastAttack=time;onAttack(time)}
          envelope=Math.max(level,envelope*Math.exp(-.01/.12));
        }
        last=now;
      }
    };
  }
  const api={createGate,createStrumGate};
  if(typeof module==='object')module.exports=api;else root.RoutineGuide=Object.freeze(api);
})(typeof window==='object'?window:globalThis);
