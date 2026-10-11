(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const el=(tag,attrs={},text='')=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;return n};
  function render(svg,exercise,engine,guide=null){
    const t=value=>window.FretboardI18n?.text(value)||value;
    exercise={...exercise,title:t(exercise.title),detail:t(exercise.detail),columns:exercise.columns.map(column=>({...column,label:column.label?t(column.label):'',subLabel:column.subLabel?t(column.subLabel):''}))};
    svg.replaceChildren();
    const width=Math.max(240,Math.round(svg.parentElement.clientWidth)),compact=width<600;
    const strings=exercise.strings||engine.courses.map((_,i)=>i),journey=Boolean(exercise.strings);
    const labelled=exercise.columns.some(c=>c.label),left=journey?52:42,right=10,font=compact?18:21,labelFont=journey?12:Math.min(22,font*.65);
    const widths=labelled?exercise.columns.map(c=>{
      if(!journey)return c.label.length*8;
      return Math.max(...[c.label,c.subLabel].map(label=>{
        const probe=el('text',{'font-size':labelFont},label);svg.append(probe);
        return probe.getComputedTextLength?.()||label.length*7;
      }));
    }):[];
    svg.replaceChildren();
    const minimum=labelled?Math.max(102,...widths.map(w=>w+20)):30,capacity=Math.max(1,Math.floor((width-left-right)/minimum));
    const lines=Math.ceil(exercise.columns.length/capacity),count=Math.ceil(exercise.columns.length/lines);
    const top=journey?52:labelled?34:20;
    const row=exercise.strumming?23:compact?25:window.innerWidth>=1001&&window.innerHeight<=580?26:32;
    const lineHeight=top+(strings.length-1)*row+26,height=lines*lineHeight;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.style.minWidth='0';
    const description=exercise.columns.map(c=>`${c.label?c.label+': ':''}${c.subLabel?c.subLabel+'. ':''}${c.notes.map(n=>t(`${engine.tuning[n.string].name} string ${engine.stringCount-n.string}, fret ${n.fret}`)).join(', ')}`).join('; ');
    svg.append(el('title',{},`${exercise.title}. ${exercise.detail}. ${description}`));
    const paths=el('g',{'class':'routine-paths','aria-hidden':'true'}),points=[];
    if(guide)svg.append(paths);
    for(let line=0;line<lines;line++){
      const columns=exercise.columns.slice(line*count,(line+1)*count),used=Math.min(width-left-right,columns.length*(labelled?Math.max(120,minimum):76)),step=used/columns.length,start=left+(width-left-right-used)/2,offset=line*lineHeight;
      strings.forEach((string,i)=>{const course=engine.tuning[string],y=offset+top+(strings.length-1-i)*row;
        const name=window.FretboardI18n?.note(course.name)||course.name;
        svg.append(el('text',{x:4,y:y+5,fill:'#c6d3e6','font-size':Math.min(22,font*.65),'data-no-i18n':''},journey?`${name} ${engine.stringCount-string}`:name),el('line',{x1:left,y1:y,x2:width-right,y2:y,stroke:'#899bb3','stroke-width':1}));
      });
      columns.forEach((column,i)=>{
        const x=start+(i+.5)*step,index=line*count+i;
        const group=el('g',{'data-column':index,'data-kind':column.kind||'','class':'routine-tab-column'+(guide&&index<guide.index?' is-played':'')+(guide&&guide.index===index?' is-target':'')});
        if(column.label)svg.append(el('text',{x,y:offset+13,'text-anchor':'middle',fill:column.kind==='third'?'#ffe38a':'#d8e4f4','font-size':labelFont,'data-no-i18n':''},column.label));
        if(column.subLabel)svg.append(el('text',{x,y:offset+30,'text-anchor':'middle',fill:'#b7c9df','font-size':labelFont,'data-no-i18n':''},column.subLabel));
        const ys=column.notes.map(n=>offset+top+(strings.length-1-strings.indexOf(n.string))*row),y=ys.reduce((a,b)=>a+b,0)/ys.length;
        points[index]={x,y,line,offset};
        if(guide&&column.notes.length>1)group.append(el('line',{x1:x,y1:Math.min(...ys),x2:x,y2:Math.max(...ys),'class':'routine-chord-link'}));
        const notes=[...column.notes];
        if(column.muteMissing)engine.courses.forEach((_,string)=>{if(!notes.some(n=>n.string===string))notes.push({string,fret:'×'})});
        notes.forEach(n=>{
          const y=offset+top+(strings.length-1-strings.indexOf(n.string))*row,isRoot=n.fret!=='×'&&engine.noteAt(n.string,n.fret)===exercise.rootPC;
          group.append(el('rect',{x:x-font*.7,y:y-font*.6,width:font*1.4,height:font*1.2,rx:5,fill:'#0a1425','class':n.fret!=='×'?'routine-note-face':''}),el('text',{x,y:y+1,'text-anchor':'middle','dominant-baseline':'central',fill:isRoot?'#70f7ff':'#fff','font-size':font,'font-weight':800,'class':n.fret!=='×'?'routine-note-number':''},String(n.fret)));
        });
        svg.append(group);
      });
    }
    if(guide)for(let i=1;i<=Math.min(guide.index,exercise.columns.length-1);i++){
      const a=points[i-1],b=points[i],edge=width-right+4,entry=left-8;
      // Wrap through the gap between staves so the path stays continuous without
      // cutting diagonally across unrelated notes.
      const d=a.line===b.line?`M${a.x} ${a.y} C${(a.x+b.x)/2} ${a.y} ${(a.x+b.x)/2} ${b.y} ${b.x} ${b.y}`:
        `M${a.x} ${a.y} H${edge} V${Math.min(a.offset,b.offset)+lineHeight-10} H${entry} V${b.y} H${b.x}`;
      paths.append(el('path',{d,pathLength:1,'class':'routine-path'+(i===guide.index&&guide.animate?' is-arriving':'')}));
    }
  }
  window.RoutineRenderer=Object.freeze({render});
})();
