(() => {
  'use strict';
  // Short locally synthesized string attacks. No samples or recordings fetched.
  function create(){
    let context=null,buffer=null,next=0;const sources=new Set();
    function stop(){for(const node of sources){try{node.stop()}catch{}}sources.clear();next=0}
    function close(){stop();const old=context;context=null;buffer=null;if(old&&old.state!=='closed')old.close().catch(()=>{})}
    return {
      async open(){
        const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;
        let pending;
        try{
          if(!context){
            context=new Audio();pending=context;buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.2),context.sampleRate);
            const data=buffer.getChannelData(0);let seed=17;
            for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=(seed/2147483647*2-1)}
          }
          pending=context;await pending.resume();return context===pending&&pending.state==='running';
        }catch{if(context===pending)close();return false}
      },
      schedule(pattern,snapshot){
        if(!context||context.state!=='running')return;
        const step=snapshot.beatMs/pattern.division,p=snapshot.position*pattern.division;
        // Resume from the next not-yet-scheduled subdivision, never replay a
        // backlog when an audio context or animation frame was suspended.
        next=Math.max(next,Math.ceil(p-1e-7));
        while((next-p)*step<=150){
          const stroke=pattern.slots[next%pattern.slots.length];
          if(stroke&&next>=0){
            const at=context.currentTime+Math.max(0,(next-p)*step/1000),source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
            const duration=stroke.mute==='percussive'?.035:stroke.mute==='palm'?.065:.13;
            source.buffer=buffer;filter.type='bandpass';filter.frequency.value=stroke.mute==='percussive'?1600:stroke.mute==='palm'?450:850;filter.Q.value=.7;
            const volume=stroke.accent?.65:.4;
            gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(volume,at+.003);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
            source.connect(filter);filter.connect(gain);gain.connect(context.destination);sources.add(source);
            source.onended=()=>{sources.delete(source);source.disconnect();filter.disconnect();gain.disconnect()};source.start(at);source.stop(at+duration+.01);
          }
          next++;
        }
      },
      stop,close
    };
  }
  window.RoutineRhythmAudio=Object.freeze({create});
})();
