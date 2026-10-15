(() => {
  'use strict';
  // The exact synthesized PCM is also the reference used to identify speaker
  // echo. Only our generated sound is retained; microphone audio is never saved.
  function create(){
    let context=null,next=0;const sources=new Map(),buffers=new Map();let history=[];
    function outputTime(at){
      const stamp=context.getOutputTimestamp?.();
      return stamp?.performanceTime>0?stamp.performanceTime+(at-stamp.contextTime)*1000:performance.now()+(at-context.currentTime+(context.outputLatency||0))*1000;
    }
    function stop(){
      const now=performance.now();
      for(const [node,event] of sources){
        event.end=Math.min(event.end,now);try{node.stop()}catch{}
      }
      sources.clear();next=0;
    }
    function close(){stop();const old=context;context=null;buffers.clear();if(old&&old.state!=='closed')old.close().catch(()=>{})}
    return {
      async open(){
        const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;
        let pending;
        try{
          if(!context)context=new Audio();
          pending=context;await pending.resume();return context===pending&&pending.state==='running';
        }catch{if(context===pending)close();return false}
      },
      schedule(pattern,snapshot){
        if(!context||context.state!=='running')return;
        const step=snapshot.beatMs/pattern.division,p=snapshot.position*pattern.division;
        next=Math.max(next,Math.ceil(p-1e-7));
        while((next-p)*step<=150){
          const stroke=pattern.slots[next%pattern.slots.length];
          if(stroke&&next>=0){
            const key=`${stroke.mute}:${Boolean(stroke.accent)}`;
            if(!buffers.has(key)){
              const pcm=RoutineEcho.render(stroke,context.sampleRate),buffer=context.createBuffer(1,pcm.length,context.sampleRate);
              buffer.getChannelData(0).set(pcm);buffers.set(key,buffer);
            }
            const at=context.currentTime+Math.max(0,(next-p)*step/1000),source=context.createBufferSource(),buffer=buffers.get(key),start=outputTime(at);
            const event={start,end:start+buffer.length/buffer.sampleRate*1000,rate:buffer.sampleRate,data:buffer.getChannelData(0)};
            history.push(event);source.buffer=buffer;source.connect(context.destination);sources.set(source,event);
            source.onended=()=>{sources.delete(source);source.disconnect()};source.start(at);
          }
          next++;
        }
        history=history.filter(event=>event.end>performance.now()-2000);
      },
      reference(now){
        const rate=RoutineEcho.RATE,length=Math.round((RoutineEcho.WINDOW_MS+RoutineEcho.DELAY_MS)*rate/1000),start=now-length/rate*1000;
        const events=history.filter(event=>event.end>start&&event.start<now&&event.end>event.start);
        if(!events.length)return null;
        const data=new Float64Array(length);
        for(const event of events){
          for(let i=Math.max(0,Math.floor((event.start-start)*rate/1000));i<length;i++){
            const time=start+i/rate*1000;if(time>=event.end)break;
            data[i]+=RoutineEcho.average(event.data,(time-event.start)*event.rate/1000,(time+1000/rate-event.start)*event.rate/1000);
          }
        }
        return data;
      },
      stop,close
    };
  }
  window.RoutineRhythmAudio=Object.freeze({create});
})();
