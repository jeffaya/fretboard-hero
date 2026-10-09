(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const el=(tag,attrs={},text='')=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;return n};
  function render(svg,exercise,engine,guide=null){
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
    const paths=el('g',{'class':'routine-paths','aria-hidden':'true'}),points=[];
    if(guide)svg.append(paths);
    const visited=new Set(guide?.route.slice(0,guide.index)||[]),target=guide?.route[guide.index];
    for(let line=0;line<lines;line++){
      const columns=exercise.columns.slice(line*count,(line+1)*count),used=Math.min(width-left-right,columns.length*(labelled?Math.max(120,minimum):76)),step=used/columns.length,start=left+(width-left-right-used)/2,offset=line*lineHeight;
      engine.tuning.forEach((course,string)=>{const y=offset+top+(engine.stringCount-1-string)*row;
        svg.append(el('text',{x:4,y:y+5,fill:'#c6d3e6','font-size':Math.min(22,font*.65),'data-no-i18n':''},window.FretboardI18n?.note(course.name)||course.name),el('line',{x1:left,y1:y,x2:width-right,y2:y,stroke:'#899bb3','stroke-width':1}));
      });
      columns.forEach((column,i)=>{
        const x=start+(i+.5)*step,index=line*count+i;
        const group=el('g',{'data-column':index,'class':'routine-tab-column'+(guide&&visited.has(index)?' is-played':'')+(guide&&target===index?' is-target':'')});
        if(column.label)svg.append(el('text',{x,y:offset+13,'text-anchor':'middle',fill:'#d8e4f4','font-size':Math.min(22,font*.65)},column.label));
        const ys=column.notes.map(n=>offset+top+(engine.stringCount-1-n.string)*row),y=ys.reduce((a,b)=>a+b,0)/ys.length;
        points[index]={x,y,line,offset};
        if(guide&&column.notes.length>1)group.append(el('line',{x1:x,y1:Math.min(...ys),x2:x,y2:Math.max(...ys),'class':'routine-chord-link'}));
        const notes=[...column.notes];
        if(column.muteMissing)engine.courses.forEach((_,string)=>{if(!notes.some(n=>n.string===string))notes.push({string,fret:'×'})});
        notes.forEach(n=>{
          const y=offset+top+(engine.stringCount-1-n.string)*row,isRoot=n.fret!=='×'&&engine.noteAt(n.string,n.fret)===exercise.rootPC;
          if(guide&&n.fret!=='×')group.append(el('ellipse',{cx:x,cy:y,rx:font*.96,ry:font*.77,'class':'routine-note-halo'}));
          group.append(el('rect',{x:x-font*.7,y:y-font*.6,width:font*1.4,height:font*1.2,rx:5,fill:'#0a1425','class':n.fret!=='×'?'routine-note-face':''}),el('text',{x,y:y+1,'text-anchor':'middle','dominant-baseline':'central',fill:isRoot?'#70f7ff':'#fff','font-size':font,'font-weight':800,'class':n.fret!=='×'?'routine-note-number':''},String(n.fret)));
        });
        svg.append(group);
      });
    }
    if(guide)for(let i=1;i<=Math.min(guide.index,guide.route.length-1);i++){
      const a=points[guide.route[i-1]],b=points[guide.route[i]],reverse=guide.route[i]<guide.route[i-1],edge=reverse?left-8:width-right+4,entry=reverse?width-right+4:left-8;
      // Wrap through the gap between staves so the path stays continuous without
      // cutting diagonally across unrelated notes.
      const d=a.line===b.line?`M${a.x} ${a.y} C${(a.x+b.x)/2} ${a.y} ${(a.x+b.x)/2} ${b.y} ${b.x} ${b.y}`:
        `M${a.x} ${a.y} H${edge} V${Math.min(a.offset,b.offset)+lineHeight-10} H${entry} V${b.y} H${b.x}`;
      paths.append(el('path',{d,pathLength:1,'class':'routine-path'+(i===guide.index&&guide.animate?' is-arriving':'')}));
    }
  }
  window.RoutineRenderer=Object.freeze({render});
})();
