(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const el=(tag,attrs={},text='')=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;return n};
  function render(svg,exercise,engine){
    svg.replaceChildren();const row=44,top=48,left=46,step=78,width=left+exercise.notes.length*step+24,height=top+(engine.stringCount-1)*row+100;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.style.minWidth=`${Math.max(360,width*.8)}px`;
    const title=el('title',{},`${exercise.root} minor tablature: ${exercise.notes.map(n=>`${engine.tuning[n.string].name} string fret ${n.fret}${n.technique?' '+PlayExercises.techniques[n.technique]:''}`).join(', ')}`);svg.append(title);
    engine.tuning.forEach((course,i)=>{const y=top+(engine.stringCount-1-i)*row;svg.append(el('text',{x:12,y:y+5,fill:'#c6d3e6','font-size':18},engine.stringCount===6&&i===5?'e':course.name),el('line',{x1:left,y1:y,x2:width-12,y2:y,stroke:'#b8c7dc','stroke-width':1.4}))});
    let beat=0;
    exercise.notes.forEach((n,i)=>{const x=left+32+i*step,y=top+(engine.stringCount-1-n.string)*row,last=i===exercise.notes.length-1;
      svg.append(el('rect',{x:x-15,y:y-16,width:30,height:32,rx:8,fill:'#0a1425'}),el('text',{x,y:y+1,'text-anchor':'middle','dominant-baseline':'central',fill:last?'#70f7ff':'#fff','font-size':26,'font-weight':800},String(n.fret)));
      if(n.technique){if(['h','p','/','\\'].includes(n.technique)){svg.append(el('text',{x:x-step/2,y:y-10,'text-anchor':'middle',fill:'#ffc6f5','font-size':18},n.technique));}else svg.append(el('text',{x,y:y-23,'text-anchor':'middle',fill:'#ffc6f5','font-size':13},n.technique==='b'?'bend ↑ 1 tone':'~'))}
      const rhythmY=height-46;svg.append(el('text',{x,y:rhythmY,'text-anchor':'middle',fill:'#aebed6','font-size':13},`${1+Math.floor(beat/4)}:${1+Math.floor(beat%4)}${['','e','&','a'][Math.round((beat%1)*4)]}`));
      svg.append(el('text',{x,y:rhythmY+22,'text-anchor':'middle',fill:'#d8e4f4','font-size':12},`${n.duration} beat${n.duration===1?'':'s'}`));beat+=n.duration;
    });
  }
  window.PlayRenderer=Object.freeze({render});
})();
