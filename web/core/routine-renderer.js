(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const el=(tag,attrs={},text='')=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;return n};
  function render(svg,exercise,engine){
    const t=value=>window.FretboardI18n?.text(value)||value;
    exercise={...exercise,title:t(exercise.title),detail:t(exercise.detail),columns:exercise.columns.map(column=>({...column,label:column.label?t(column.label):''}))};
    svg.replaceChildren();
    const width=Math.max(240,Math.round(svg.parentElement.clientWidth)),compact=width<600;
    const labelled=exercise.columns.some(c=>c.label),left=42,right=10;
    const minimum=labelled?Math.max(102,...exercise.columns.map(c=>(c.label||'').length*8+20)):30,capacity=Math.max(1,Math.floor((width-left-right)/minimum));
    const lines=Math.ceil(exercise.columns.length/capacity),count=Math.ceil(exercise.columns.length/lines);
    const top=labelled?34:20;
    const row=compact?25:window.innerWidth>=1001&&window.innerHeight<=580?26:32;
    const font=compact?18:21;
    const lineHeight=top+(engine.stringCount-1)*row+26,height=lines*lineHeight;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.style.minWidth='0';
    const description=exercise.columns.map(c=>`${c.label?c.label+': ':''}${c.notes.map(n=>t(`${engine.tuning[n.string].name} string ${engine.stringCount-n.string}, fret ${n.fret}`)).join(', ')}`).join('; ');
    svg.append(el('title',{},`${exercise.title}. ${exercise.detail}. ${description}`));
    for(let line=0;line<lines;line++){
      const columns=exercise.columns.slice(line*count,(line+1)*count),used=Math.min(width-left-right,columns.length*(labelled?Math.max(120,minimum):76)),step=used/columns.length,start=left+(width-left-right-used)/2,offset=line*lineHeight;
      engine.tuning.forEach((course,string)=>{const y=offset+top+(engine.stringCount-1-string)*row;
        svg.append(el('text',{x:4,y:y+5,fill:'#c6d3e6','font-size':Math.min(22,font*.65),'data-no-i18n':''},window.FretboardI18n?.note(course.name)||course.name),el('line',{x1:left,y1:y,x2:width-right,y2:y,stroke:'#899bb3','stroke-width':1}));
      });
      columns.forEach((column,i)=>{
        const x=start+(i+.5)*step;
        if(column.label)svg.append(el('text',{x,y:offset+13,'text-anchor':'middle',fill:'#d8e4f4','font-size':Math.min(22,font*.65)},column.label));
        const notes=[...column.notes];
        if(column.muteMissing)engine.courses.forEach((_,string)=>{if(!notes.some(n=>n.string===string))notes.push({string,fret:'×'})});
        notes.forEach(n=>{
          const y=offset+top+(engine.stringCount-1-n.string)*row,isRoot=n.fret!=='×'&&engine.noteAt(n.string,n.fret)===exercise.rootPC;
          svg.append(el('rect',{x:x-font*.7,y:y-font*.6,width:font*1.4,height:font*1.2,rx:5,fill:'#0a1425'}),el('text',{x,y:y+1,'text-anchor':'middle','dominant-baseline':'central',fill:isRoot?'#70f7ff':'#fff','font-size':font,'font-weight':800},String(n.fret)));
        });
      });
    }
  }
  window.RoutineRenderer=Object.freeze({render});
})();
