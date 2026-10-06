(() => {
  'use strict';
  // One visual language for the neck, note badges and their HTML legends.
  const DEGREE_COLORS=Object.freeze({root:'#27d7ff',third:'#ff3ec9',fourth:'#ff8b3d',fifth:'#ffd14f',seventh:'#5cffb2',second:'#9b6cff',sixth:'#35d1b0'});
  const SCALE_COLORS=Object.freeze(['#27d7ff','#5cffb2','#ff3ec9','#ff9d3f','#ffd14f','#9b6cff','#35d1b0']);
  function create({svgEl,stringCount,instrument}){
    function gradient(defs,id,stops,radial=false,isP=false){
      const node=svgEl(radial?'radialGradient':'linearGradient',radial?{id,cx:'32%',cy:'22%',r:'85%'}:{id,x1:'0%',y1:'0%',x2:isP?'100%':'0%',y2:isP?'0%':'100%'});
      stops.forEach(([offset,color])=>node.append(svgEl('stop',{offset,'stop-color':color})));defs.append(node);
    }
    function defs(svg,prefix,isP){
      const node=svgEl('defs');
      gradient(node,prefix+'Wood',[['0%','#25262e'],['15%','#12151e'],['48%','#080b12'],['85%','#161922'],['100%','#30303b']],false,isP);
      gradient(node,prefix+'StringMetal',[['0%','#3d4653'],['18%','#899ca9'],['38%','#f5ffff'],['49%','#ffffff'],['65%','#bacbd2'],['82%','#637582'],['100%','#242c36']],false,isP);
      gradient(node,prefix+'Steel',[['0%','#303846'],['18%','#b9cad6'],['35%','#fff'],['51%','#8495a6'],['75%','#dbe9ef'],['100%','#384253']],false,!isP);
      gradient(node,prefix+'Inlay',[['0%','#fff'],['25%','#e0d7ff'],['55%','#b4a4e0'],['80%','#736891'],['100%','#352f49']],true);
      gradient(node,prefix+'NoteGlass',[['0%','#334655'],['30%','#172331'],['70%','#080e19'],['100%','#03070e']],true);
      const wound=svgEl('pattern',{id:prefix+'Wound',width:4,height:4,patternUnits:'userSpaceOnUse',patternTransform:isP?'rotate(75)':'rotate(-15)'});
      wound.append(svgEl('rect',{width:4,height:4,fill:'#78838b'}),svgEl('path',{d:'M 0 0 V 4',stroke:'#ebf4f8','stroke-width':1.2}),svgEl('path',{d:'M 2.5 0 V 4',stroke:'#424b52','stroke-width':.7}));node.append(wound);
      svg.append(node);svg.dataset.neckPrefix=prefix;
    }
    function surface(svg,isP,W,H,prefix){
      defs(svg,prefix,isP);
      const neck=isP?{x:48,y:150,width:W-96,height:H-190,rx:5}:{x:150,y:60,width:W-188,height:H-92,rx:5};
      svg.append(svgEl('rect',{...neck,x:neck.x+4,y:neck.y+9,fill:'#000',opacity:.7}));
      svg.append(svgEl('rect',{...neck,fill:`url(#${prefix}Wood)`,stroke:'#3e3a4e','stroke-width':7}));
      const texture=svgEl('image',{href:'./assets/fretboard/ebony.webp',x:0,y:0,width:isP?neck.height:neck.width,height:isP?neck.width:neck.height,preserveAspectRatio:'none',opacity:.72,transform:isP?`translate(${neck.x+neck.width} ${neck.y}) rotate(90)`:`translate(${neck.x} ${neck.y})`,'data-neck-texture':'ebony'});
      svg.append(texture);
      svg.append(svgEl('rect',{...neck,fill:`url(#${prefix}Wood)`,opacity:.22}));
      svg.append(svgEl('rect',{...neck,fill:'none',stroke:'#9b93b7','stroke-width':1,opacity:.42}));
    }
    function fret(svg,isP,p,W,H,isNut,prefix){
      const thickness=isNut?16:10;
      const body=isP?{x:50,y:p-thickness/2,width:W-100,height:thickness}:{x:p-thickness/2,y:62,width:thickness,height:H-96};
      svg.append(svgEl('rect',{...body,x:body.x+3,y:body.y+5,rx:2,fill:'#000',opacity:.8}));
      svg.append(svgEl('rect',{...body,rx:2,fill:isNut?'#e4d8bf':`url(#${prefix}Steel)`,stroke:isNut?'#9a8b71':'#46515e','stroke-width':.8}));
      const crown=isP?{x1:52,x2:W-52,y1:p-2,y2:p-2}:{x1:p-2,x2:p-2,y1:64,y2:H-36};
      svg.append(svgEl('line',{...crown,stroke:isNut?'#fff9e8':'#fff','stroke-width':1.5,opacity:.95}));
    }
    function string(svg,isP,p,start,end,s,prefix){
      const gauge=8-6*s/Math.max(1,stringCount-1),wound=s<(instrument.woundStrings||0);
      const body=isP?{x:p-gauge/2,y:start-12,width:gauge,height:end-start+12}:{x:start-12,y:p-gauge/2,width:end-start+12,height:gauge};
      // Broad penumbra, tight contact shadow, then a cylindrical metal body ABOVE the frets.
      svg.append(svgEl('rect',{...body,x:body.x+4,y:body.y+6,rx:gauge/2,fill:'#000',opacity:.3}));
      svg.append(svgEl('rect',{...body,x:body.x+2,y:body.y+3,rx:gauge/2,fill:'#000',opacity:.8}));
      svg.append(svgEl('rect',{...body,rx:gauge/2,fill:`url(#${prefix}StringMetal)`,stroke:'#57616d','stroke-width':.5,'data-string-gauge':gauge}));
      if(wound)svg.append(svgEl('rect',{...body,rx:gauge/2,fill:`url(#${prefix}Wound)`,opacity:.52}));
      const highlight=isP?{x1:p-gauge*.16,x2:p-gauge*.16,y1:start-12,y2:end}:{x1:start-12,x2:end,y1:p-gauge*.16,y2:p-gauge*.16};
      svg.append(svgEl('line',{...highlight,stroke:'#fff','stroke-width':wound?1:.85,opacity:.9}));
    }
    function inlay(svg,{x,y,fret}){
      const w=9,h=17;
      const points=`${x},${y-h} ${x+w},${y} ${x},${y+h} ${x-w},${y}`;
      const group=svgEl('g',{'data-inlay-fret':fret,'pointer-events':'none'});
      group.append(svgEl('polygon',{points,fill:'#c559ff',stroke:'#b454ff','stroke-width':7,opacity:.12}));
      group.append(svgEl('polygon',{points,fill:'#9250f5',stroke:'#e1acff','stroke-width':1.1}));
      group.append(svgEl('path',{d:`M ${x} ${y-h} L ${x} ${y} L ${x-w} ${y} Z`,fill:'#f0c4ff'}));
      group.append(svgEl('path',{d:`M ${x} ${y-h} L ${x+w} ${y} L ${x} ${y} Z`,fill:'#b36bff'}));
      group.append(svgEl('path',{d:`M ${x-w} ${y} L ${x} ${y} L ${x} ${y+h} Z`,fill:'#6a24cd'}));
      group.append(svgEl('path',{d:`M ${x} ${y} L ${x+w} ${y} L ${x} ${y+h} Z`,fill:'#d581ff'}));svg.append(group);
    }

    function note(svg,{x,y,isP,color,label,target=false,attrs={}}){
      const r=isP?26:24,prefix=svg.dataset.neckPrefix;
      const group=svgEl('g',{class:'neck-note','data-note-color':color,...attrs});
      group.append(svgEl('circle',{cx:x+1,cy:y+3,r:r+1,fill:'#000',opacity:.65}));
      group.append(svgEl('circle',{cx:x,cy:y,r:r+4,fill:'none',stroke:color,'stroke-width':5,opacity:target?.22:.12}));
      group.append(svgEl('circle',{cx:x,cy:y,r,fill:`url(#${prefix}NoteGlass)`,stroke:color,'stroke-width':target?3.4:2.8}));
      group.append(svgEl('path',{d:`M ${x-r*.68} ${y-r*.45} Q ${x} ${y-r*.98} ${x+r*.68} ${y-r*.45}`,fill:'none',stroke:'#fff','stroke-width':.9,opacity:.32,'pointer-events':'none'}));
      group.append(svgEl('text',{x,y,fill:'#f4f3ff','font-size':isP?(label.length>1?21:26):(label.length>1?18:24),'font-weight':800,'text-anchor':'middle','dominant-baseline':'central','pointer-events':'none'},label));svg.append(group);
    }
    function tuning(svg,{x,y,label}){
      const group=svgEl('g',{class:'neck-tuning','pointer-events':'none'});
      group.append(svgEl('circle',{cx:x,cy:y,r:24,fill:`url(#${svg.dataset.neckPrefix}NoteGlass)`,stroke:'#b1a5c9','stroke-width':2}));
      group.append(svgEl('path',{d:`M ${x-11} ${y-8} Q ${x} ${y-16} ${x+11} ${y-8}`,fill:'none',stroke:'#fff','stroke-width':.8,opacity:.4}));
      group.append(svgEl('text',{x,y,fill:'#f4f3ff','font-size':26,'font-weight':800,'text-anchor':'middle','dominant-baseline':'central'},label));svg.append(group);
    }
    return {surface,fret,string,note,tuning,inlay};
  }
  window.FretboardAppearance={create,DEGREE_COLORS,SCALE_COLORS};
})();
