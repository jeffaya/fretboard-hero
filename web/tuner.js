(() => {
  'use strict';
  const t=s=>FretboardI18n.text(s), profile=FRETBOARD_ACTIVE_INSTRUMENT, courses=profile.courses;
  const note=c=>FretboardI18n.note(c.name)+String(Math.floor(c.midi/12)-1);
  const button=document.createElement('button');button.className='tuner-launch';button.textContent=t('Tuner');
  document.querySelector('.home-footer').append(button);
  const dialog=document.createElement('dialog');dialog.className='tuner-dialog';dialog.dataset.noI18n='';dialog.setAttribute('aria-labelledby','tuner-title');
  dialog.innerHTML=`<div class="tuner-heading"><h2 id="tuner-title"></h2><button class="tuner-close" type="button">×</button></div>
    <p class="tuner-intro"></p><div class="tuner-strings"></div>
    <div class="tuner-reading"><strong class="tuner-note">—</strong><span class="tuner-frequency">A4 = 440 Hz</span></div>
    <div class="tuner-meter" aria-hidden="true"><span class="tuner-center"></span><span class="tuner-needle"></span></div>
    <div class="tuner-scale"><span>−50</span><span>0</span><span>+50</span></div>
    <p class="tuner-status" role="status" aria-live="polite"></p><button class="tuner-mic" type="button"></button><p class="tuner-privacy"></p>`;
  document.body.append(dialog);
  const $=s=>dialog.querySelector(s), status=$('.tuner-status'), mic=$('.tuner-mic');
  $('#tuner-title').textContent=t('Tuner')+' · '+t(profile.label);
  $('.tuner-close').setAttribute('aria-label',t('Close'));
  $('.tuner-intro').textContent=t('Play one open string at a time.');
  $('.tuner-privacy').textContent=t('Audio stays on your device. Nothing is recorded.');
  let selected=-1,stream,context,source,analyser,frame,generation=0,history=[],lastPitch=0,lastFrame=0;
  const setStatus=s=>{const value=t(s);if(status.textContent!==value)status.textContent=value;};
  function reset(){[...$('.tuner-strings').children].forEach(el=>el.classList.remove('detected'));history=[];lastPitch=0;$('.tuner-note').textContent='—';$('.tuner-frequency').textContent='A4 = 440 Hz';$('.tuner-needle').style.left='50%';dialog.classList.remove('in-tune');}
  const choices=[t('Automatic'),...courses.map(note)];
  choices.forEach((label,index)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed',String(index===0));b.onclick=()=>{selected=index-1;reset();[...$('.tuner-strings').children].forEach((el,i)=>el.setAttribute('aria-pressed',String(i===index)));};$('.tuner-strings').append(b);});
  function stop(){generation++;cancelAnimationFrame(frame);stream?.getTracks().forEach(track=>track.stop());stream=null;source?.disconnect();source=null;const old=context;context=null;if(old)old.close().catch(()=>{});analyser=null;mic.disabled=false;mic.textContent=t('Enable microphone');reset();setStatus('Microphone off');}
  function tick(now){
    if(!stream||!dialog.open)return;
    frame=requestAnimationFrame(tick);if(now-lastFrame<90)return;lastFrame=now;
    const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);
    const hz=FretboardPitch.detect(data,context.sampleRate);
    if(!hz){if(now-lastPitch>650){reset();setStatus('Play one open string at a time.');}return;}
    lastPitch=now;history.push(hz);if(history.length>5)history.shift();if(history.length<3)return;
    const sorted=[...history].sort((a,b)=>a-b), pitch=sorted[Math.floor(sorted.length/2)];
    const index=selected<0?FretboardPitch.closest(pitch,courses):selected, target=courses[index];
    const delta=FretboardPitch.cents(pitch,target.midi), good=Math.abs(delta)<=5;
    $('.tuner-note').textContent=note(target);$('.tuner-frequency').textContent=pitch.toFixed(1)+' Hz · '+(delta>0?'+':'')+Math.round(delta)+' cents';
    $('.tuner-needle').style.left=(50+Math.max(-50,Math.min(50,delta))*0.9)+'%';dialog.classList.toggle('in-tune',good);
    [...$('.tuner-strings').children].forEach((el,i)=>el.classList.toggle('detected',i===index+1));
    setStatus(good?'In tune':delta<0?'Too low — tighten gently':'Too high — loosen gently');
  }
  async function start(){
    if(stream){stop();return;}
    const token=++generation;mic.disabled=true;setStatus('Allow microphone access');
    let pendingContext;
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw {name:'Unsupported'};
      const Audio=window.AudioContext||window.webkitAudioContext;
      pendingContext=new Audio();context=pendingContext;await pendingContext.resume();
      const captured=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
      if(token!==generation||!dialog.open){captured.getTracks().forEach(track=>track.stop());if(pendingContext.state!=='closed')await pendingContext.close();return;}
      stream=captured;analyser=context.createAnalyser();analyser.fftSize=8192;source=context.createMediaStreamSource(stream);source.connect(analyser);
      stream.getAudioTracks()[0].addEventListener('ended',()=>{if(token===generation)stop();});
      mic.disabled=false;mic.textContent=t('Stop microphone');setStatus('Play one open string at a time.');frame=requestAnimationFrame(tick);
    }catch(error){if(token!==generation)return;stop();setStatus(error.name==='NotAllowedError'?'Microphone denied. Allow access in device or browser settings.':error.name==='Unsupported'?'Microphone unavailable. Use a supported browser over HTTPS.':'Microphone unavailable. Check your microphone and try again.');}
  }
  button.onclick=()=>{stop();dialog.showModal();};mic.onclick=start;
  $('.tuner-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{stop();button.focus();});dialog.addEventListener('cancel',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
  // Capacitor lifecycle also covers native backgrounding where visibility events vary.
  window.Capacitor?.Plugins?.App?.addListener('appStateChange',({isActive})=>{if(!isActive)stop();});
  stop();
})();
