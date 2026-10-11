(function(root){
  'use strict';
  // Both the moving tab and the microphone use this clock. Harmony arrives
  // later than an attack: judge its captured onset, never the callback time.
  const WINDOW=180,HARMONY_WAIT=560;
  function create({columns,tempo=72,bar=0,guided=true,played=[],now=0}){
    let beatMs=60000/tempo,start=now+4*beatMs,finished=false,retrying=false;
    const states=columns.map((_,i)=>i<bar*4&&played[i]==='played'?'played':'waiting');
    const bars=columns.length/4;
    function restart(now,bpm=tempo){
      tempo=bpm;beatMs=60000/tempo;start=now+4*beatMs;finished=false;retrying=false;
      for(let i=bar*4;i<columns.length;i++)states[i]='waiting';
    }
    function targetAt(at){
      if(finished)return -1;
      const beat=Math.round((at-start)/beatMs),index=bar*4+beat;
      return beat>=0&&beat<4&&Math.abs(at-(start+beat*beatMs))<=WINDOW&&states[index]==='waiting'?index:-1;
    }
    function hit(at,now){
      const index=targetAt(at);
      if(!guided||index<0||now<at||now-at>HARMONY_WAIT)return false;
      states[index]='played';return true;
    }
    function tick(now){
      if(finished)return null;
      if(guided)for(let beat=0;beat<4;beat++){
        const i=bar*4+beat;
        if(states[i]==='waiting'&&now>start+beat*beatMs+WINDOW+HARMONY_WAIT)states[i]='missed';
      }
      if(now<start+4*beatMs)return null;
      if(guided&&states.slice(bar*4,bar*4+4).some(state=>state!=='played')){
        start+=8*beatMs;retrying=true;
        states.fill('waiting',bar*4,bar*4+4);
        return 'retry';
      }
      if(bar===bars-1){finished=true;return 'complete'}
      bar++;start+=4*beatMs;retrying=false;return 'bar';
    }
    function skip(now){
      if(bar===bars-1){finished=true;return 'complete'}
      bar++;restart(now);return 'bar';
    }
    return {restart,targetAt,hit,tick,skip,
      snapshot(now){return {bar,beat:(now-start)/beatMs,states:states.slice(),finished,retrying,guided}}
    };
  }
  const api={create};
  if(typeof module==='object')module.exports=api;else root.RoutineRhythm=Object.freeze(api);
})(typeof window==='object'?window:globalThis);
