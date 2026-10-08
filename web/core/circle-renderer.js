(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg',instances=new WeakMap();
  const el=(tag,attrs={},text='')=>{const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text)n.textContent=text;return n};
  const note=value=>window.FretboardI18n?.note(value)||value;
  const point=(radius,angle)=>[300+radius*Math.sin(angle*Math.PI/180),300-radius*Math.cos(angle*Math.PI/180)];
  function sector(inner,outer,left,right){const a=point(outer,left),b=point(outer,right),c=point(inner,right),d=point(inner,left);return `M${a} A${outer},${outer} 0 0 1 ${b} L${c} A${inner},${inner} 0 0 0 ${d} Z`}
  function mount(svg){
    svg.setAttribute('viewBox','0 0 600 600');svg.replaceChildren();
    const labels=[],dial={angle:0,target:0,selected:0,frame:0,onSelect:null,drag:null};
    svg.append(el('circle',{cx:300,cy:300,r:286,fill:'#071021',stroke:'#ba65ff','stroke-width':2}));
    [270,210,150,92].forEach((r,i)=>svg.append(el('circle',{cx:300,cy:300,r,fill:'none',stroke:i%2?'#c458ee':'#376b91','stroke-width':1.5})));
    for(let i=0;i<12;i++){const a=point(92,i*30-15),b=point(270,i*30-15);svg.append(el('path',{d:`M${a}L${b}`,stroke:'#ffffff18'}))}
    // The material, windows and degrees never rotate; only note positions move.
    svg.append(el('path',{d:sector(150,270,-45,45),fill:'#70208055',stroke:'#ff74ef','stroke-width':2}));
    svg.append(el('path',{d:sector(92,150,-15,15),fill:'#136e8055',stroke:'#70f7ff','stroke-width':2}));
    [[-30,'IV','ii'],[0,'I','vi'],[30,'V','iii']].forEach(([a,major,minor])=>{
      [[260,major],[200,minor]].forEach(([r,text])=>{const [x,y]=point(r,a);svg.append(el('text',{x,y,fill:'#edb5fa','text-anchor':'middle','dominant-baseline':'central','font-size':14},text))});
    });
    const [dx,dy]=point(139,0);svg.append(el('text',{x:dx,y:dy,fill:'#70f7ff','text-anchor':'middle','font-size':13},'vii°'));
    for(let i=0;i<12;i++)for(let ring=0;ring<3;ring++){
      const text=el('text',{'data-no-i18n':'','text-anchor':'middle','dominant-baseline':'central',fill:'#7d8ca8','font-size':ring===0?26:ring===1?20:16,'font-weight':800,'pointer-events':'none'});svg.append(text);labels.push({i,ring,text});
    }
    svg.append(el('circle',{cx:300,cy:300,r:86,fill:'#090e21',stroke:'#ba65ff','stroke-width':2}));
    svg.append(el('text',{x:300,y:282,fill:'#aabbd4','text-anchor':'middle','font-size':13,'letter-spacing':2},'CIRCLE OF FIFTHS'));
    const title=el('text',{'data-no-i18n':'',x:300,y:322,fill:'#fff','text-anchor':'middle','font-size':34,'font-weight':800});svg.append(title);
    const subtitle=el('text',{'data-no-i18n':'',x:300,y:346,fill:'#70f7ff','text-anchor':'middle','font-size':15});svg.append(subtitle);
    function paint(){const selected=CircleOfFifths.getKey(dial.selected);title.textContent=note(selected.name);subtitle.textContent=note(selected.minor)+' · '+(window.FretboardI18n?.text('relative minor')||'relative minor');
      labels.forEach(({i,ring,text})=>{
        const a=i*30+dial.angle,wrapped=((a+180)%360+360)%360-180,[x,y]=point([231,173,113][ring],a);
        const active=ring<2?Math.abs(wrapped)<44:Math.abs(wrapped)<14;
        let name=ring===0?CircleOfFifths.keys[i].name:ring===1?CircleOfFifths.keys[i].minor:CircleOfFifths.getKey(i).chords[6].name;
        // Context spelling matters: F-sharp's IV is B, D-flat's IV is G-flat.
        if(active&&Math.abs(dial.angle-dial.target)<.001){const slot=Math.round(wrapped/30);const degree=ring===2?6:ring===0?({'-1':3,0:0,1:4}[slot]):({'-1':1,0:5,1:2}[slot]);if(degree!==undefined)name=selected.chords[degree].name;}
        text.textContent=note(name);text.setAttribute('x',x);text.setAttribute('y',y);text.setAttribute('fill',active?'#fff':'#8292b0');text.setAttribute('opacity',active?1:.52);
      });
    }
    dial.update=index=>{dial.selected=index;let target=-index*30;target+=Math.round((dial.angle-target)/360)*360;dial.target=target;cancelAnimationFrame(dial.frame);const start=dial.angle,time=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:320;
      function tick(now){const t=duration?Math.min(1,(now-time)/duration):1;dial.angle=start+(target-start)*(1-Math.pow(1-t,3));paint();if(t<1)dial.frame=requestAnimationFrame(tick)}dial.frame=requestAnimationFrame(tick);
    };
    const angle=e=>{const rect=svg.getBoundingClientRect();return Math.atan2(e.clientX-(rect.left+rect.width/2),-(e.clientY-(rect.top+rect.height/2)))*180/Math.PI};
    svg.addEventListener('pointerdown',e=>{if(e.button!==0||!dial.interactive)return;cancelAnimationFrame(dial.frame);dial.drag={id:e.pointerId,last:angle(e),start:dial.angle};svg.setPointerCapture(e.pointerId)});
    svg.addEventListener('pointermove',e=>{if(dial.drag?.id!==e.pointerId)return;const a=angle(e);let delta=a-dial.drag.last;if(delta>180)delta-=360;if(delta< -180)delta+=360;dial.angle+=delta;dial.drag.last=a;paint()});
    const finish=e=>{if(dial.drag?.id!==e.pointerId)return;dial.drag=null;const index=((Math.round(-dial.angle/30)%12)+12)%12;dial.onSelect(index)};
    svg.addEventListener('pointerup',finish);svg.addEventListener('pointercancel',finish);svg.addEventListener('lostpointercapture',finish);
    svg.addEventListener('keydown',e=>{if(dial.interactive&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){e.preventDefault();dial.onSelect((dial.selected+(e.key==='ArrowRight'?1:11))%12)}});
    paint();return dial;
  }
  function render({svg,selected=0,onSelect,interactive=true}){let dial=instances.get(svg);if(!dial){dial=mount(svg);instances.set(svg,dial)}dial.interactive=interactive;dial.onSelect=onSelect;dial.update(selected)}
  window.CircleRenderer=Object.freeze({render});
})();
