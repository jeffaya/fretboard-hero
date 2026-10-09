(() => {
  'use strict';
  const t=s=>FretboardI18n.text(s), profile=FRETBOARD_ACTIVE_INSTRUMENT, courses=profile.courses;
  const note=c=>FretboardI18n.note(c.name);
  const button=document.createElement('button');button.className='tuner-launch ui-secondary';
  // Keep the tuning fork dedicated to instrument tuning.
  const icon=document.createElement('span');icon.className='tuner-launch-icon';icon.setAttribute('aria-hidden','true');icon.dataset.controlGroup='tuner';
  const label=document.createElement('span');label.textContent=t('Tuner');button.append(icon,label);
  document.querySelector('.home-footer').append(button);
  const dialog=document.createElement('dialog');dialog.className='tuner-dialog ui-panel ui-modal';dialog.dataset.noI18n='';dialog.setAttribute('aria-labelledby','tuner-title');
  dialog.innerHTML=`<div class="tuner-heading"><h2 id="tuner-title"></h2></div>
    <div class="tuner-reading"><strong class="tuner-note">—</strong><span class="tuner-frequency">440 Hz</span></div>
    <div class="tuner-meter" aria-hidden="true"><span class="tuner-center"></span><span class="tuner-needle"></span></div>
    <div class="tuner-scale"><span>−50</span><span>0</span><span>+50</span></div>
    <p class="tuner-status" role="status" aria-live="polite"></p><div class="tuner-instrument"><div class="tuner-strings"></div></div><button class="tuner-mic ui-primary" type="button"></button><p class="tuner-privacy"></p>`;
  document.querySelector('#app').append(dialog);
  const $=s=>dialog.querySelector(s), status=$('.tuner-status'), mic=$('.tuner-mic');
  $('#tuner-title').textContent=t('Tuner')+' · '+t(profile.label);
  $('.tuner-privacy').textContent=t('Audio stays on your device. Nothing is recorded.');
  const controls=[];
  let selected=-1,lastDetected=0,stream,context,source,analyser,frame,generation=0,history=[],lastPitch=0,lastFrame=0;
  const setStatus=s=>{const value=t(s);if(status.textContent!==value)status.textContent=value;};
  function reset(){highlight(selected);controls.forEach(el=>el.classList.remove('detected'));history=[];lastPitch=0;$('.tuner-note').textContent='—';$('.tuner-frequency').textContent='440 Hz';$('.tuner-needle').style.left='50%';dialog.classList.remove('in-tune');}
  const half=courses.length/2;
  // From the nut upwards: low strings on the left, high strings on the right.
  // Guitar top-to-bottom labels are D/A/E and G/B/E, matching a 3+3 headstock.
  const position=index=>({left:index<half, y:52+(index<half?half-1-index:index-half)*(half===3?60:80)});
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 320 260');svg.setAttribute('aria-hidden','true');svg.classList.add('tuner-headstock');
  const outline='M126 254L125 208Q124 192 111 170L103 41Q125 37 138 22Q160 8 182 22Q195 37 217 41L209 170Q196 192 195 208L194 254Z';
  svg.innerHTML=`<defs>
    <linearGradient id="tuner-wood" x1="0" y1="0" x2="1" y2=".25"><stop stop-color="#1e1014"/><stop offset=".15" stop-color="#5a261e"/><stop offset=".4" stop-color="#ba7844"/><stop offset=".57" stop-color="#85472c"/><stop offset=".83" stop-color="#50241e"/><stop offset="1" stop-color="#200f16"/></linearGradient>
    <linearGradient id="tuner-metal" x1="0" y1="0" x2="1" y2=".2"><stop stop-color="#17202d"/><stop offset=".16" stop-color="#667c90"/><stop offset=".3" stop-color="#f4fbff"/><stop offset=".43" stop-color="#a0b9ca"/><stop offset=".5" stop-color="#34495e"/><stop offset=".64" stop-color="#7b91a1"/><stop offset=".81" stop-color="#ffffff"/><stop offset="1" stop-color="#304154"/></linearGradient>
    <linearGradient id="tuner-lacquer" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#ffffff" stop-opacity=".6"/><stop offset=".26" stop-color="#fff2d5" stop-opacity=".2"/><stop offset=".29" stop-color="#ffffff" stop-opacity=".04"/><stop offset=".68" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#92dfff" stop-opacity=".17"/></linearGradient>
    <linearGradient id="tuner-edge" x1="0" x2="1" y2=".6"><stop stop-color="#fff0cc"/><stop offset=".32" stop-color="#c8a16b"/><stop offset=".6" stop-color="#5e413c"/><stop offset="1" stop-color="#d9c7a2"/></linearGradient>
    <radialGradient id="tuner-post" cx=".3" cy=".2"><stop stop-color="#ffffff"/><stop offset=".25" stop-color="#e3ecf0"/><stop offset=".6" stop-color="#8798a7"/><stop offset=".85" stop-color="#334454"/><stop offset="1" stop-color="#b7c3cb"/></radialGradient>
    <clipPath id="tuner-body-clip"><path d="${outline}"/></clipPath>
  </defs>
  <path d="${outline}" transform="translate(3 4)" fill="#100b10" stroke="#060509" stroke-width="5"/>
  <path d="${outline}" fill="url(#tuner-wood)" stroke="url(#tuner-edge)" stroke-width="4"/>
  <g clip-path="url(#tuner-body-clip)">
    ${Array.from({length:32},(_,i)=>{const x=105+i*3.7;return `<path d="M${x} 12C${x-12} 55 ${x+10} 83 ${x+2} 124S${x-7} 189 ${x+4} 258" fill="none" stroke="${i%3?'#f2bc72':'#1d0a13'}" stroke-width="${i%3?.45:1.1}" opacity="${i%3?.18:.24}"/>`}).join('')}
    <path d="M97 37Q146 52 215 12L209 88Q154 126 104 121Z" fill="url(#tuner-lacquer)"/>
    <path d="M106 42Q127 37 140 25Q158 13 178 24" fill="none" stroke="#fff8da" stroke-width="1.6" opacity=".8"/>
    <path d="M109 48L116 165Q130 190 132 206" fill="none" stroke="#ffdeae" stroke-width="2" opacity=".32"/>
    <path d="M214 46L206 167Q192 193 192 210" fill="none" stroke="#030512" stroke-width="4" opacity=".55"/>
    <path d="M179 25Q188 88 172 203" fill="none" stroke="#ffedd3" stroke-width="13" opacity=".04"/>
  </g>
  <path d="M126 213H194V260H126Z" fill="#16151d" stroke="url(#tuner-edge)" stroke-width="2"/>
  <path d="M136 216L135 260M146 216L148 260M173 216L174 260M187 216L185 260" stroke="#7e6051" opacity=".3"/>
  <path d="M127 239H193M127 257H193" stroke="#333340" stroke-width="5"/>
  <path d="M127 238H193M127 256H193" stroke="url(#tuner-metal)" stroke-width="3"/>
  <path d="M128 237H192M128 255H192" stroke="#fff" stroke-width=".6" opacity=".65"/>
  <circle cx="160" cy="246" r="3.3" fill="#d7ccb8"/><circle cx="159" cy="245" r="1.1" fill="#fff9e9"/>`;
  courses.forEach((course,index)=>{
    const {left,y}=position(index),x=left?121:199,edge=left?94:210;
    const group=document.createElementNS(ns,'g');group.dataset.course=String(index);
    group.innerHTML=`<rect x="${edge}" y="${y-4}" width="16" height="8" rx="3" fill="url(#tuner-metal)"/>
      <rect x="${left?80:226}" y="${y-10}" width="14" height="20" rx="6" fill="url(#tuner-metal)" stroke="#a5afb9"/>
      <ellipse cx="${x+1}" cy="${y+2}" rx="9" ry="8" fill="#090d18" opacity=".7"/>
      <circle cx="${x}" cy="${y}" r="8" fill="url(#tuner-post)" stroke="#3f4e5f"/>
      <circle cx="${x}" cy="${y}" r="4" fill="url(#tuner-metal)" stroke="#e2e9ed" stroke-width=".5"/>
      <path d="M${x-2} ${y}H${x+2}" stroke="#334052" stroke-width="1"/>
      <path class="tuner-wire-halo" d="M${133+index*(54/(courses.length-1))} 260V211L${x} ${y}" fill="none" stroke="transparent"/>
      <path class="tuner-wire" d="M${133+index*(54/(courses.length-1))} 260V211L${x} ${y}" fill="none" stroke="#ccd3dd" stroke-width="${2.4-index*.25}"/>
      <circle class="tuner-peg-glow" cx="${x}" cy="${y}" r="11" fill="none" stroke="transparent" stroke-width="3"/>`;
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
    b.onclick=()=>{selected=index===0?(selected<0?lastDetected:-1):index-1;reset();highlight(selected);controls.forEach((el,i)=>{if(i===0)el.setAttribute('aria-checked',String(selected<0));else el.setAttribute('aria-pressed',String(i===selected+1));});};controls.push(b);(index===0?$('.tuner-heading'):$('.tuner-strings')).append(b);
  });
  function stop(){generation++;cancelAnimationFrame(frame);stream?.getTracks().forEach(track=>track.stop());stream=null;source?.disconnect();source=null;const old=context;context=null;if(old)old.close().catch(()=>{});analyser=null;mic.disabled=false;mic.textContent=t('Enable microphone');reset();setStatus('Microphone off');}
  function tick(now){
    if(!stream||!dialog.open)return;
    frame=requestAnimationFrame(tick);if(now-lastFrame<90)return;lastFrame=now;
    const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);
    const hz=FretboardPitch.detect(data,context.sampleRate);
    // Hold the last reading through silence, including its string and needle.
    // Discard old samples so the next pluck starts a fresh smoothing window.
    if(now-lastPitch>650)history=[];
    if(!hz)return;
    lastPitch=now;history.push(hz);if(history.length>5)history.shift();if(history.length<3)return;
    const sorted=[...history].sort((a,b)=>a-b), pitch=sorted[Math.floor(sorted.length/2)];
    const index=selected<0?FretboardPitch.closest(pitch,courses):selected, target=courses[index];
    lastDetected=index;highlight(index);
    const delta=FretboardPitch.cents(pitch,target.midi), good=Math.abs(delta)<=5;
    $('.tuner-note').textContent=note(target);$('.tuner-frequency').textContent=pitch.toFixed(1)+' Hz · '+(delta>0?'+':'')+Math.round(delta)+' cents';
    $('.tuner-needle').style.left=(50+Math.max(-50,Math.min(50,delta))*0.9)+'%';dialog.classList.toggle('in-tune',good);
    controls.forEach((el,i)=>el.classList.toggle('detected',i===index+1));
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
      mic.disabled=false;mic.textContent=t('Stop microphone');setStatus('');frame=requestAnimationFrame(tick);
    }catch(error){if(token!==generation)return;stop();setStatus(error.name==='NotAllowedError'?'Microphone denied. Allow access in device or browser settings.':error.name==='Unsupported'?'Microphone unavailable. Use a supported browser over HTTPS.':'Microphone unavailable. Check your microphone and try again.');}
  }
  let opener=button;
  function open(trigger){opener=trigger;stop();dialog.showModal()}
  button.onclick=()=>open(button);
  document.querySelectorAll('[data-open-tuner]').forEach(trigger=>trigger.addEventListener('click',()=>open(trigger)));
  mic.onclick=start;
  FretboardModal.bindDismiss(dialog,()=>dialog.close());dialog.addEventListener('close',()=>{stop();opener.focus();});dialog.addEventListener('cancel',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
  // Capacitor lifecycle also covers native backgrounding where visibility events vary.
  window.Capacitor?.Plugins?.App?.addListener('appStateChange',({isActive})=>{if(!isActive)stop();});
  stop();
})();
