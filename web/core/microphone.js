/* One local-only microphone owner across the tuner and guided practice. */
(() => {
  'use strict';
  let owner=null;
  function release(){owner?.stop()}
  function preference(name){
    const key=`fretboard-${name}-microphone`;
    let enabled=true;
    try{enabled=localStorage.getItem(key)!=='off'}catch{}
    return {
      get enabled(){return enabled},
      setEnabled(value){enabled=Boolean(value);try{localStorage.setItem(key,enabled?'on':'off')}catch{}}
    };
  }
  function create({fftSize=8192,interval=90,onFrame,onState=()=>{}}){
    let stream,context,source,analyser,frame=0,generation=0,state='off';
    const report=(value,error)=>{state=value;onState(value,error)};
    function stop(){
      generation++;cancelAnimationFrame(frame);
      stream?.getTracks().forEach(track=>track.stop());stream=null;
      source?.disconnect();source=null;analyser=null;
      const old=context;context=null;if(old&&old.state!=='closed')old.close().catch(()=>{});
      if(owner===api)owner=null;
      report('off');
    }
    async function start(){
      if(state!=='off')return;
      release();owner=api;const token=++generation;report('pending');
      try{
        const Audio=window.AudioContext||window.webkitAudioContext;
        if(!navigator.mediaDevices?.getUserMedia||!Audio)throw {name:'Unsupported'};
        const pendingContext=new Audio();context=pendingContext;await pendingContext.resume();
        if(token!==generation)return;
        const captured=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
        if(token!==generation){captured.getTracks().forEach(track=>track.stop());return}
        stream=captured;analyser=context.createAnalyser();analyser.fftSize=fftSize;analyser.smoothingTimeConstant=0;
        source=context.createMediaStreamSource(stream);source.connect(analyser);
        // No connection to the speakers, MediaRecorder, storage or upload.
        stream.getAudioTracks().forEach(track=>track.addEventListener('ended',()=>{if(token===generation)stop()}));
        context.addEventListener('statechange',()=>{if(token===generation&&context?.state!=='running')stop()});
        const samples=new Float32Array(fftSize),spectrum=new Float32Array(fftSize/2);
        let last=-Infinity;
        function tick(now){
          if(token!==generation)return;
          frame=requestAnimationFrame(tick);if(now-last<interval)return;last=now;
          analyser.getFloatTimeDomainData(samples);analyser.getFloatFrequencyData(spectrum);
          onFrame({samples,spectrum,sampleRate:context.sampleRate,fftSize,now});
        }
        report('on');frame=requestAnimationFrame(tick);
      }catch(error){if(token!==generation)return;stop();onState('off',error)}
    }
    const api={start,stop,get state(){return state}};
    return api;
  }
  function errorMessage(error){
    return error.name==='NotAllowedError'?'Microphone denied. Allow access in device or browser settings.':error.name==='Unsupported'?'Microphone unavailable. Use a supported browser over HTTPS.':'Microphone unavailable. Check your microphone and try again.';
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)release()});
  window.addEventListener('pagehide',release);
  window.Capacitor?.Plugins?.App?.addListener('appStateChange',({isActive})=>{if(!isActive)release()});
  window.FretboardMicrophone=Object.freeze({create,release,errorMessage,preference});
})();
