(function(root){
  'use strict';
  const DEFAULT_TEMPO=80,REQUIRED_REPEATS=3;
  function create({pattern,tempo=DEFAULT_TEMPO,guided=true,now=0,onRepeat=()=>{}}){
    let beatMs=60000/tempo,origin=now,anchor=0,pausedAt=null,validFrom=now,closed=0,successes=0,finished=false;
    const hits=new Set(),extras=new Map(),events=pattern.slots.flatMap((stroke,slot)=>stroke?[{slot,beat:slot/pattern.division}]:[]);
    const position=now=>anchor+((pausedAt??now)-origin)/beatMs;
    const gap=Math.min(...events.map((event,i)=>((events[(i+1)%events.length].beat-event.beat+pattern.beats)%pattern.beats||pattern.beats)));
    const windowBeats=Math.min(.2,gap*.45);
    function nearest(p){
      const cycle=Math.floor(p/pattern.beats),candidates=[];
      for(let c=Math.max(0,cycle-1);c<=cycle+1;c++)for(const event of events)candidates.push({...event,beat:c*pattern.beats+event.beat,id:c*pattern.slots.length+event.slot});
      return candidates.sort((a,b)=>Math.abs(a.beat-p)-Math.abs(b.beat-p))[0];
    }
    return {
      attack(at){
        if(!guided||finished||pausedAt!==null||at<validFrom)return null;
        const p=position(at),target=nearest(p);if(!target||p<-.2)return null;
        const offset=p-target.beat,distance=Math.abs(offset),repeat=Math.floor(target.beat/pattern.beats);
        if(repeat<closed)return null;
        const inTime=distance<=windowBeats,duplicate=hits.has(target.id);
        const grade=distance<=.05?'Excellent':distance<=.1?'Good':inTime?(offset<0?'Early':'Late'):(offset<0?'Too early':'Too late');
        if(inTime&&!duplicate)hits.add(target.id);
        else if(!inTime)extras.set(repeat,(extras.get(repeat)||0)+1);
        return {at,slot:target.slot,offset:offset*beatMs,grade,inTime,accepted:inTime&&!duplicate};
      },
      tick(now){
        if(finished||pausedAt!==null)return false;
        const p=position(now);
        // Allow the last microphone frame (20 ms cadence plus scheduling
        // jitter) to deliver attacks preceding the complete motif boundary.
        while(p>=(closed+1)*pattern.beats+100/beatMs){
          const count=events.filter(e=>hits.has(closed*pattern.slots.length+e.slot)).length;
          const success=guided&&count/(events.length+(extras.get(closed)||0))>=.75;
          if(guided){if(success)successes++;onRepeat(success)}
          for(const e of events)hits.delete(closed*pattern.slots.length+e.slot);extras.delete(closed);closed++;
          if(successes>=REQUIRED_REPEATS){finished=true;return true}
        }
        return false;
      },
      snapshot(now){
        const p=position(now),local=((p%pattern.beats)+pattern.beats)%pattern.beats;
        return {position:p,slot:p<0||finished?-1:Math.floor(local*pattern.division+1e-7)%pattern.slots.length,successes,finished,guided,paused:pausedAt!==null,beatMs};
      },
      pause(now){if(pausedAt===null)pausedAt=now},
      resume(now){if(pausedAt!==null){origin+=now-pausedAt;pausedAt=null;validFrom=now}},
      shift(duration){origin+=duration;validFrom+=duration},
      setTempo(value,now){const time=pausedAt??now;anchor=position(time);origin=time;beatMs=60000/value;validFrom=now},
      setGuided(value,now){
        // A partly unmonitored motif cannot count as a successful repeat.
        guided=value;validFrom=now;hits.clear();extras.clear();
        closed=Math.max(closed,Math.ceil(Math.max(0,position(now))/pattern.beats));
      },
      get refractory(){return Math.max(60,Math.min(150,gap*beatMs*.45))}
    };
  }
  const api={create,DEFAULT_TEMPO,REQUIRED_REPEATS};
  if(typeof module==='object')module.exports=api;else root.RoutineRhythm=Object.freeze(api);
})(typeof window==='object'?window:globalThis);
