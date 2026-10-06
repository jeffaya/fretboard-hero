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
      gradient(node,prefix+'Steel',[['0%','#303846'],['18%','#b9cad6'],['35%','#fff'],['51%','#8495a6'],['75%','#dbe9ef'],['100%','#384253']],false,!isP);
      gradient(node,prefix+'Inlay',[['0%','#fff'],['25%','#e0d7ff'],['55%','#b4a4e0'],['80%','#736891'],['100%','#352f49']],true);
      gradient(node,prefix+'NoteGlass',[['0%','#334655'],['30%','#172331'],['70%','#080e19'],['100%','#03070e']],true);
      const wound=svgEl('pattern',{id:prefix+'Wound',width:4,height:4,patternUnits:'userSpaceOnUse',patternTransform:isP?'rotate(28)':'rotate(-62)'});
      wound.append(svgEl('rect',{width:4,height:4,fill:'#78838b'}),svgEl('path',{d:'M 0 0 V 4',stroke:'#ebf4f8','stroke-width':1.2}),svgEl('path',{d:'M 2.5 0 V 4',stroke:'#424b52','stroke-width':.7}));node.append(wound);
      // Tiled vector grain replaces full-board turbulence and per-string blur filters.
      const grain=svgEl('pattern',{id:prefix+'Grain',width:isP?34:180,height:isP?180:34,patternUnits:'userSpaceOnUse'});
      for(let i=0;i<7;i++){
        const p=i*5;
        grain.append(svgEl('path',{d:isP?`M ${p} 0 Q ${p+2} 70 ${p} 180`:`M 0 ${p} Q 70 ${p+2} 180 ${p}`,fill:'none',stroke:i%2?'#b9a4ad':'#000','stroke-width':i%2?.55:1,opacity:i%2?.09:.26}));
      }node.append(grain);svg.append(node);svg.dataset.neckPrefix=prefix;
    }
    function surface(svg,isP,W,H,prefix){
      defs(svg,prefix,isP);
      const neck=isP?{x:48,y:110,width:W-96,height:H-150,rx:9}:{x:90,y:34,width:W-128,height:H-70,rx:9};
      svg.append(svgEl('rect',{...neck,x:neck.x+3,y:neck.y+7,fill:'#000',opacity:.6}));
      svg.append(svgEl('rect',{...neck,fill:`url(#${prefix}Wood)`,stroke:'#697080','stroke-width':2}));
      svg.append(svgEl('rect',{...neck,fill:`url(#${prefix}Grain)`}));
      // The rails stay parallel in both orientations.
      const a=isP?{x1:neck.x,y1:neck.y,x2:neck.x,y2:neck.y+neck.height}:{x1:neck.x,y1:neck.y,x2:neck.x+neck.width,y2:neck.y};
      const b=isP?{x1:neck.x+neck.width,y1:neck.y,x2:neck.x+neck.width,y2:neck.y+neck.height}:{x1:neck.x,y1:neck.y+neck.height,x2:neck.x+neck.width,y2:neck.y+neck.height};
      [ [a,'#27d7ff'],[b,'#ff3ec9'] ].forEach(([edge,color])=>{
        svg.append(svgEl('line',{...edge,stroke:color,'stroke-width':7,opacity:.09}));
        svg.append(svgEl('line',{...edge,stroke:color,'stroke-width':1.7,opacity:.8}));
      });
    }
    function fret(svg,isP,p,W,H,isNut,prefix){
      const line=isP?{x1:50,x2:W-50,y1:p,y2:p}:{y1:36,y2:H-38,x1:p,x2:p};
      const shadow=isP?{...line,y1:p+3,y2:p+3}:{...line,x1:p+3,x2:p+3};
      svg.append(svgEl('line',{...shadow,stroke:'#000','stroke-width':isNut?13:9,opacity:.75}));
      svg.append(svgEl('line',{...line,stroke:isNut?'#807765':'#374350','stroke-width':isNut?12:7}));
      svg.append(svgEl('line',{...line,stroke:isNut?'#e9dfc9':`url(#${prefix}Steel)`,'stroke-width':isNut?9:5}));
      const crown=isP?{...line,y1:p-1,y2:p-1}:{...line,x1:p-1,x2:p-1};
      svg.append(svgEl('line',{...crown,stroke:isNut?'#fff7e7':'#f1faff','stroke-width':1.25,opacity:.92}));
    }
    function string(svg,isP,p,start,end,s,prefix){
      const gauge=4.8-3.3*s/Math.max(1,stringCount-1),wound=s<(instrument.woundStrings||0);
      const line=isP?{x1:p,x2:p,y1:start-9,y2:end}:{x1:start-9,x2:end,y1:p,y2:p};
      const shifted=offset=>isP?{...line,x1:p+offset,x2:p+offset}:{...line,y1:p+offset,y2:p+offset};
      svg.append(svgEl('line',{...shifted(3.2),stroke:'#000','stroke-width':gauge+3,opacity:.55}));
      svg.append(svgEl('line',{...line,stroke:'#35404b','stroke-width':gauge+1.2,'stroke-linecap':'round'}));
      svg.append(svgEl('line',{...line,stroke:wound?`url(#${prefix}Wound)`:'#c1d2dd','stroke-width':gauge,'stroke-linecap':'round'}));
      svg.append(svgEl('line',{...shifted(-.6),stroke:'#fff','stroke-width':wound?.65:.8,opacity:wound?.7:.95}));
    }
    function note(svg,{x,y,isP,color,label,target=false,attrs={}}){
      const r=isP?20:14,prefix=svg.dataset.neckPrefix;
      const group=svgEl('g',{class:'neck-note','data-note-color':color,...attrs});
      group.append(svgEl('circle',{cx:x+1,cy:y+3,r:r+1,fill:'#000',opacity:.65}));
      group.append(svgEl('circle',{cx:x,cy:y,r:r+4,fill:'none',stroke:color,'stroke-width':5,opacity:target?.16:.08}));
      group.append(svgEl('circle',{cx:x,cy:y,r,fill:`url(#${prefix}NoteGlass)`,stroke:color,'stroke-width':target?3:2.3}));
      group.append(svgEl('path',{d:`M ${x-r*.68} ${y-r*.45} Q ${x} ${y-r*.98} ${x+r*.68} ${y-r*.45}`,fill:'none',stroke:'#fff','stroke-width':.9,opacity:.32,'pointer-events':'none'}));
      group.append(svgEl('text',{x,y,fill:'#f4f3ff','font-size':isP?(label.length>1?17:20):(label.length>1?11:14),'font-weight':800,'text-anchor':'middle','dominant-baseline':'central','pointer-events':'none'},label));svg.append(group);
    }
    function tuning(svg,{x,y,label}){
      const group=svgEl('g',{class:'neck-tuning','pointer-events':'none'});
      group.append(svgEl('circle',{cx:x,cy:y,r:17,fill:'#0b1320',stroke:'#91a2bb','stroke-width':1.3}));
      group.append(svgEl('path',{d:`M ${x-11} ${y-8} Q ${x} ${y-16} ${x+11} ${y-8}`,fill:'none',stroke:'#fff','stroke-width':.8,opacity:.4}));
      group.append(svgEl('text',{x,y,fill:'#f4f3ff','font-size':19,'font-weight':800,'text-anchor':'middle','dominant-baseline':'central'},label));svg.append(group);
    }
    return {surface,fret,string,note,tuning};
  }
  window.FretboardAppearance={create,DEGREE_COLORS,SCALE_COLORS};
})();
