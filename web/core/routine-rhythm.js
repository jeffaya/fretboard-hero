(function(root){
  'use strict';
  const DEFAULT_TEMPO=48,COUNT_IN=3,HARMONY_WAIT=560;
  // At 48 BPM: excellent ±120 ms, good ±260 ms, early/late ±450 ms.
  // Scale with the beat at faster tempos, keeping adjacent beats unambiguous.
  function timing(offset,beatMs){
    const distance=Math.abs(offset),scale=Math.min(1,beatMs/1250);
    if(distance<=120*scale)return 'Excellent';
    if(distance<=260*scale)return 'Good';
    if(distance<=450*scale)return offset<0?'Early':'Late';
    return offset<0?'Too early':'Too late';
  }
  function create({columns,tempo=DEFAULT_TEMPO,index=0,guided=true,played=[],now=0}){
    let beatMs=60000/tempo,anchor=index,origin=now+COUNT_IN*beatMs,pausedAt=null,validFrom=now,finished=false;
    const first=index,states=columns.map((_,i)=>played[i]==='played'?'played':'waiting'),attacks=new Map();
    const position=now=>anchor+((pausedAt??now)-origin)/beatMs;
    function locate(at){
      if(!guided||finished||pausedAt!==null||at<validFrom)return null;
      const beat=position(at),index=Math.round(beat)||0;
      if(index<first||index>=columns.length)return null;
      const offset=(beat-index)*beatMs,grade=timing(offset,beatMs);
      return {at,index,offset,grade,inTime:grade!=='Too early'&&grade!=='Too late'};
    }
    function attack(at){
      const target=locate(at);if(!target)return null;
      // Keep the target assigned at the attack, even if confirmation crosses
      // a chord/bar boundary. Timing feedback need not wait for the FFT.
      for(const [key] of attacks)if(at-key>1000)attacks.delete(key);
      attacks.set(at,target);return target;
    }
    function confirm(at,match,now){
      const target=attacks.get(at);if(!target||finished||pausedAt!==null)return null;
      attacks.delete(at);
      const recognized=Boolean(match&&now>=at&&now-at<=HARMONY_WAIT);
      const accepted=recognized&&target.inTime;
      if(accepted)states[target.index]='played';
      return {...target,match:recognized,accepted};
    }
    function snapshot(now){
      const p=position(now),next=Math.max(first,Math.min(columns.length,Math.ceil(p-1e-8)));
      return {position:p,next,bar:Math.max(Math.floor(first/4),Math.min(columns.length/4-1,Math.floor(p/4))),countIn:Math.max(0,Math.ceil(first-p-1e-8)),states:states.slice(),finished,paused:pausedAt!==null};
    }
    return {attack,confirm,snapshot,
      targetAt(at){return attacks.get(at)?.index??-1},
      tick(now){
        if(finished||pausedAt!==null)return false;
        // Let a late final attack finish recognition; never repeat a measure.
        const tail=Math.max(0,HARMONY_WAIT/beatMs-.5);
        if(position(now)<columns.length+tail)return false;
        finished=true;return true;
      },
      pause(now){if(pausedAt===null){pausedAt=now;attacks.clear()}},
      resume(now){if(pausedAt!==null){origin+=now-pausedAt;pausedAt=null;validFrom=now}},
      shift(duration){origin+=duration;validFrom+=duration;attacks.clear()},
      setTempo(value,now){
        const time=pausedAt??now;anchor=position(time);origin=time;beatMs=60000/value;validFrom=now;attacks.clear();
      },
      setGuided(value,now){guided=value;validFrom=now;attacks.clear()},
      skip(now){
        anchor=Math.min(columns.length,(snapshot(now).bar+1)*4);origin=now;validFrom=now;attacks.clear();
        if(pausedAt!==null)pausedAt=now;
        if(anchor===columns.length){finished=true;return true}return false;
      }
    };
  }
  const api={create,DEFAULT_TEMPO,HARMONY_WAIT};
  if(typeof module==='object')module.exports=api;else root.RoutineRhythm=Object.freeze(api);
})(typeof window==='object'?window:globalThis);
