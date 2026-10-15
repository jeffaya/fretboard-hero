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
    let stream,context,source,analyser,silentOutput,frame=0,generation=0,state='off',echoCancellation=false,recovering=false;
    let configuring=Promise.resolve();
    const report=(value,error)=>{state=value;onState(value,error)};
    function configure(captured){
      // Serialize live changes so leaving Rhythm always restores raw input,
      // even when a previous browser constraint request is still pending.
      const value=echoCancellation;
      configuring=configuring.then(async()=>{
        if(stream!==captured)return;
        await Promise.all(captured.getAudioTracks().map(async track=>{
          try{
            const cancellation=value&&track.getCapabilities?.().echoCancellation?.includes('all')?'all':value;
            await track.applyConstraints?.({echoCancellation:cancellation,noiseSuppression:false,autoGainControl:false});
          }catch{}
        }));
      });
      return configuring;
    }
    function stop(){
      generation++;cancelAnimationFrame(frame);
      configuring=Promise.resolve();
      stream?.getTracks().forEach(track=>track.stop());stream=null;
      source?.disconnect();analyser?.disconnect();silentOutput?.disconnect();source=null;analyser=null;silentOutput=null;recovering=false;
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
        const pendingContext=new Audio();context=pendingContext;
        // Start both requests in the user gesture. An autoplay-suspended context
        // can leave resume() pending until mic consent; do not block that prompt.
        pendingContext.resume().catch(()=>{});
        const requestedEcho=echoCancellation;
        const captured=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:requestedEcho,noiseSuppression:false,autoGainControl:false},video:false});
        if(token!==generation){captured.getTracks().forEach(track=>track.stop());return}
        stream=captured;
        if(echoCancellation||requestedEcho!==echoCancellation)await configure(captured);
        if(token!==generation)return;
        analyser=context.createAnalyser();analyser.fftSize=fftSize;analyser.smoothingTimeConstant=0;
        source=context.createMediaStreamSource(stream);source.connect(analyser);
        // Keep the graph rendering on mobile WebViews without monitoring the mic.
        silentOutput=context.createGain();silentOutput.gain.value=0;
        analyser.connect(silentOutput);silentOutput.connect(context.destination);
        // The permission sheet / audio route can suspend the context after the
        // first resume. Resume again after acquiring the stream and wiring it.
        await pendingContext.resume();if(token!==generation)return;
        if(pendingContext.state!=='running')throw {name:'AudioSuspended'};
        stream.getAudioTracks().forEach(track=>track.addEventListener('ended',()=>{if(token===generation)stop()}));
        context.addEventListener('statechange',async()=>{
          if(token!==generation||pendingContext.state==='running'||recovering)return;
          if(document.hidden||pendingContext.state==='closed'){stop();return}
          // A foreground interruption is recoverable. Actual navigation or
          // backgrounding still releases capture via the lifecycle handlers.
          recovering=true;report('pending');
          try{
            await pendingContext.resume();if(token!==generation)return;
            if(pendingContext.state!=='running')throw {name:'AudioSuspended'};
            report('on');
          }catch(error){if(token===generation){stop();onState('off',error)}}
          finally{if(token===generation)recovering=false}
        });
        const samples=new Float32Array(fftSize),spectrum=new Float32Array(fftSize/2);
        let last=-Infinity;
        function tick(now){
          if(token!==generation)return;
          frame=requestAnimationFrame(tick);if(now-last<interval)return;last=now;
          if(pendingContext.state!=='running'||state!=='on')return;
          analyser.getFloatTimeDomainData(samples);analyser.getFloatFrequencyData(spectrum);
          onFrame({samples,spectrum,sampleRate:context.sampleRate,fftSize,now});
        }
        report('on');frame=requestAnimationFrame(tick);
      }catch(error){if(token!==generation)return;stop();onState('off',error)}
    }
    const api={start,stop,setInterval(value){interval=value},setEchoCancellation(value){
      value=Boolean(value);if(value===echoCancellation)return configuring;
      echoCancellation=value;return stream?configure(stream):Promise.resolve();
    },get state(){return state}};
    return api;
  }
  function errorMessage(error){
    return error.name==='NotAllowedError'?'Microphone access denied.':error.name==='Unsupported'?'Microphone not supported.':'Microphone unavailable.';
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)release()});
  window.addEventListener('pagehide',release);
  window.Capacitor?.Plugins?.App?.addListener('appStateChange',({isActive})=>{if(!isActive)release()});
  window.FretboardMicrophone=Object.freeze({create,release,errorMessage,preference});
})();
