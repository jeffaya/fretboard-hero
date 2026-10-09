(() => {
  'use strict';
  const t=s=>FretboardI18n.text(s), profile=FRETBOARD_ACTIVE_INSTRUMENT, courses=profile.courses;
  const note=c=>FretboardI18n.note(c.name);
  const button=document.createElement('button');button.className='tuner-launch ui-secondary';
  // Reuse the existing tonality control icon, including future theme changes.
  const icon=document.createElement('span');icon.className='tuner-launch-icon';icon.setAttribute('aria-hidden','true');icon.dataset.controlGroup='root';
  const label=document.createElement('span');label.textContent=t('Tuner');button.append(icon,label);
  document.querySelector('.home-footer').append(button);
  const dialog=document.createElement('dialog');dialog.className='tuner-dialog ui-panel ui-modal';dialog.dataset.noI18n='';dialog.setAttribute('aria-labelledby','tuner-title');
  dialog.innerHTML=`<div class="tuner-heading"><h2 id="tuner-title"></h2><button class="tuner-close ui-back" type="button">×</button></div>
    <p class="tuner-intro"></p>
    <div class="tuner-reading"><strong class="tuner-note">—</strong><span class="tuner-frequency">440 Hz</span></div>
    <div class="tuner-meter" aria-hidden="true"><span class="tuner-center"></span><span class="tuner-needle"></span></div>
    <div class="tuner-scale"><span>−50</span><span>0</span><span>+50</span></div>
    <p class="tuner-status" role="status" aria-live="polite"></p><div class="tuner-instrument"><div class="tuner-strings"></div></div><button class="tuner-mic ui-primary" type="button"></button><p class="tuner-privacy"></p>`;
  document.querySelector('#app').append(dialog);
  const $=s=>dialog.querySelector(s), status=$('.tuner-status'), mic=$('.tuner-mic');
  $('#tuner-title').textContent=t('Tuner')+' · '+t(profile.label);
  $('.tuner-close').setAttribute('aria-label',t('Close'));
  $('.tuner-intro').textContent=t('Play one open string at a time.');
  $('.tuner-privacy').textContent=t('Audio stays on your device. Nothing is recorded.');
  let selected=-1,lastDetected=0,stream,context,source,analyser,frame,generation=0,history=[],lastPitch=0,lastFrame=0;
  const setStatus=s=>{const value=t(s);if(status.textContent!==value)status.textContent=value;};
  function reset(){highlight(selected);[...$('.tuner-strings').children].forEach(el=>el.classList.remove('detected'));history=[];lastPitch=0;$('.tuner-note').textContent='—';$('.tuner-frequency').textContent='440 Hz';$('.tuner-needle').style.left='50%';dialog.classList.remove('in-tune');}
  const half=courses.length/2;
  // From the nut upwards: low strings on the left, high strings on the right.
  // Guitar top-to-bottom labels are D/A/E and G/B/E, matching a 3+3 headstock.
  const position=index=>({left:index<half, y:62+(index<half?half-1-index:index-half)*(half===3?53:80)});
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 320 260');svg.setAttribute('aria-hidden','true');svg.classList.add('tuner-headstock');
  svg.innerHTML=`<defs>
    <linearGradient id="tuner-wood" x1="0" x2="1"><stop stop-color="#352022"/><stop offset=".45" stop-color="#8b5939"/><stop offset=".65" stop-color="#65412d"/><stop offset="1" stop-color="#281b21"/></linearGradient>
    <linearGradient id="tuner-metal"><stop stop-color="#57657a"/><stop offset=".45" stop-color="#edf4f6"/><stop offset=".7" stop-color="#91a4b0"/><stop offset="1" stop-color="#3c4a5c"/></linearGradient>
  </defs><path class="tuner-wood" d="M126 254L125 208Q124 192 111 170L103 41Q125 37 138 22Q160 8 182 22Q195 37 217 41L209 170Q196 192 195 208L194 254Z" fill="url(#tuner-wood)" stroke="#c4a683" stroke-width="2"/>
  <path d="M133 51Q146 35 156 34M141 55L143 181M151 44L152 191M172 43L170 189M187 54L178 181" fill="none" stroke="#eab983" opacity=".14"/>
  <path d="M126 213H194V260H126Z" fill="#211d22" stroke="#8e827b"/>
  <path d="M127 239H193M127 257H193" stroke="#9b9fa7" stroke-width="2"/>
  <circle cx="160" cy="246" r="3" fill="#cdc1a4"/>`;
  courses.forEach((course,index)=>{
    const {left,y}=position(index),x=left?121:199,edge=left?94:210;
    const group=document.createElementNS(ns,'g');group.dataset.course=String(index);
    group.innerHTML=`<rect x="${edge}" y="${y-4}" width="16" height="8" rx="3" fill="url(#tuner-metal)"/>
      <rect x="${left?80:226}" y="${y-10}" width="14" height="20" rx="6" fill="url(#tuner-metal)" stroke="#a5afb9"/>
      <circle cx="${x}" cy="${y}" r="7" fill="url(#tuner-metal)" stroke="#c4c6ca"/>
      <path class="tuner-wire" d="M${133+index*(54/(courses.length-1))} 260V211L${x} ${y}" fill="none" stroke="#ccd3dd" stroke-width="${2.4-index*.25}"/>
      <circle class="tuner-peg-glow" cx="${x}" cy="${y}" r="9" fill="none" stroke="transparent" stroke-width="2"/>`;
    svg.append(group);
  });
  const nut=document.createElementNS(ns,'path');nut.setAttribute('d','M125 207H195');nut.setAttribute('stroke','#e1d8c5');nut.setAttribute('stroke-width','5');svg.append(nut);
  $('.tuner-instrument').prepend(svg);
  const choices=[t('Automatic'),...courses.map(note)];
  function highlight(index){
    svg.querySelectorAll('[data-course]').forEach(el=>el.classList.toggle('highlighted',Number(el.dataset.course)===index));
  }
  choices.forEach((label,index)=>{
    const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed',String(index===0));
    if(index===0){b.className='tuner-auto ui-back';b.setAttribute('role','switch');b.setAttribute('aria-checked','true');b.removeAttribute('aria-pressed');}
    else {
      const {left,y}=position(index-1);b.className='tuner-string';b.style.left=(left?12:88)+'%';b.style.top=(y/260*100)+'%';
      b.setAttribute('aria-label',t('String {n}').replace('{n}',String(courses.length-index+1))+' · '+label);
    }
    b.onclick=()=>{selected=index===0?(selected<0?lastDetected:-1):index-1;reset();highlight(selected);[...$('.tuner-strings').children].forEach((el,i)=>{if(i===0)el.setAttribute('aria-checked',String(selected<0));else el.setAttribute('aria-pressed',String(i===selected+1));});};$('.tuner-strings').append(b);
  });
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
    lastDetected=index;highlight(index);
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
