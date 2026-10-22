(function(root){
  'use strict';
  // Consecutive evidence, not accumulated successes: a wrong note resets the hold.
  // Identical pitches in adjacent positions need a release or a fresh attack.
  function createGate(){
    let since=null,last=-Infinity,blocked=false,quietSince=null,previousLevel=0,attack=0,confirmations=0;
    return {
      reset(repeat=false){since=null;last=-Infinity;blocked=repeat;quietSince=null;previousLevel=0;attack=0;confirmations=0},
      update({match,level,now,chord=false,holdMs=chord?160:190}){
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
        if(now-since<holdMs||(chord&&confirmations<3))return false;
        since=null;confirmations=0;blocked=true;quietSince=null;attack=0;return true;
      }
    };
  }
  // Detect fresh attacks above the local noise floor, including pitchless
  // muted strums. An existing sound at capture/reset is a baseline, not a hit.
  function createStrumGate(){
    let last=-Infinity,lastAttack=-Infinity,envelope=0,noise=0,pending=null;
    const levels=[];
    function remember(level){levels.push(level);if(levels.length>40)levels.shift()}
    function background(){const sorted=[...levels].sort((a,b)=>a-b);return sorted[Math.floor(sorted.length*.25)]||0}
    function rms(samples,start,size){
      let sum=0,energy=0;
      for(let j=start;j<start+size;j++){const value=samples[j];sum+=value;energy+=value*value}
      // Ignore the microphone's DC offset, which is not an acoustic attack.
      return Math.sqrt(Math.max(0,energy/size-(sum/size)**2));
    }
    return {
      reset(){last=-Infinity;lastAttack=-Infinity;envelope=0;noise=0;pending=null;levels.length=0},
      update({samples,sampleRate,now,refractory=100,onAttack=()=>{}}){
        const gap=now-last,size=Math.max(1,Math.round(sampleRate*.01));
        if(!Number.isFinite(gap)||gap>100){
          // Seed from the buffered audio without emitting retrospective hits.
          // This also absorbs ringing preview audio after a reset or stall.
          levels.length=0;envelope=0;pending=null;
          for(let i=Math.max(0,samples.length-size*40);i+size<=samples.length;i+=size){
            const level=rms(samples,i,size);remember(level);envelope=Math.max(level,envelope*Math.exp(-.01/.12));
          }
          noise=Math.max(background(),levels.at(-1)||0);last=now;return;
        }
        const start=Math.max(0,samples.length-Math.round(sampleRate*gap/1000));
        for(let i=start;i+size<=samples.length;i+=size){
          const level=rms(samples,i,size),time=now-(samples.length-i)*1000/sampleRate;
          const threshold=Math.max(.0005,noise*3);
          if(pending){
            // A second 10 ms window rejects isolated clicks. Preserve the
            // first window's timestamp so confirmation does not bias grading.
            if(time-pending.time<=25&&level>=Math.max(pending.threshold,pending.level*.35)){
              lastAttack=pending.time;onAttack(lastAttack);
            }
            pending=null;
          }else if(level>=threshold&&level>envelope*1.45&&time-lastAttack>=refractory){
            pending={time,level,threshold};
          }
          remember(level);
          // Follow ambient changes, but don't learn repeated guitar attacks
          // as room noise while the player is actively strumming.
          if(!pending&&time-lastAttack>800){const target=background();noise+=(target-noise)*(target>noise?.05:.1)}
          envelope=Math.max(level,envelope*Math.exp(-.01/.12));
        }
        last=now;
      }
    };
  }
  const api={createGate,createStrumGate};
  if(typeof module==='object')module.exports=api;else root.RoutineGuide=Object.freeze(api);
})(typeof window==='object'?window:globalThis);
