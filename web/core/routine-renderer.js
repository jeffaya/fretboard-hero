(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const el=(tag,attrs={},text='')=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;return n};
  function render(svg,exercise,engine){
    svg.replaceChildren();
    const width=Math.max(240,Math.round(svg.parentElement.clientWidth)),compact=width<600;
    const labelled=exercise.columns.some(c=>c.label),left=24,right=10,row=compact?25:32;
    const minimum=labelled?102:30,capacity=Math.max(1,Math.floor((width-left-right)/minimum));
    const lines=Math.ceil(exercise.columns.length/capacity),count=Math.ceil(exercise.columns.length/lines);
    const top=labelled?34:20,lineHeight=top+(engine.stringCount-1)*row+26,height=lines*lineHeight;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.style.minWidth='0';
    const description=exercise.columns.map(c=>`${c.label?c.label+': ':''}${c.notes.map(n=>`${engine.tuning[n.string].name} string ${engine.stringCount-n.string}, fret ${n.fret}`).join(', ')}`).join('; ');
    svg.append(el('title',{},`${exercise.title}. ${exercise.detail}. ${description}`));
    for(let line=0;line<lines;line++){
      const columns=exercise.columns.slice(line*count,(line+1)*count),step=(width-left-right)/columns.length,offset=line*lineHeight;
      engine.tuning.forEach((course,string)=>{const y=offset+top+(engine.stringCount-1-string)*row;
        svg.append(el('text',{x:8,y:y+5,fill:'#c6d3e6','font-size':14},engine.stringCount===6&&string===5?'e':course.name),el('line',{x1:left,y1:y,x2:width-right,y2:y,stroke:'#899bb3','stroke-width':1}));
      });
      columns.forEach((column,i)=>{
        const x=left+(i+.5)*step;
        if(column.label)svg.append(el('text',{x,y:offset+13,'text-anchor':'middle',fill:'#d8e4f4','font-size':13},column.label));
        const notes=[...column.notes];
        if(column.muteMissing)engine.courses.forEach((_,string)=>{if(!notes.some(n=>n.string===string))notes.push({string,fret:'×'})});
        notes.forEach(n=>{
          const y=offset+top+(engine.stringCount-1-n.string)*row,isRoot=n.fret!=='×'&&engine.noteAt(n.string,n.fret)===exercise.rootPC;
          svg.append(el('rect',{x:x-14,y:y-11,width:28,height:22,rx:5,fill:'#0a1425'}),el('text',{x,y:y+1,'text-anchor':'middle','dominant-baseline':'central',fill:isRoot?'#70f7ff':'#fff','font-size':compact?18:21,'font-weight':800},String(n.fret)));
        });
      });
    }
  }
  window.RoutineRenderer=Object.freeze({render});
})();
