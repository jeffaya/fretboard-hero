(() => {
  'use strict';
  function visiblePairs({profile,anchor,maxFret,selected='all'}){const geom=profile.pentatonic?.stringPairs;if(!geom)return[];const out=[];for(let id=1;id<=5;id++){if(selected!=='all'&&String(id)!==String(selected))continue;for(const shift of [-24,-12,0,12,24,36]){const base=anchor+shift,pairs=geom[id].map(([a,b])=>[base+a,base+b]);if(pairs.some(([a,b])=>b>=0&&a<=maxFret))out.push({id,pairs})}}return out}
  function renderSegments({svg,windows,colors,stringCount,isPortrait,fretPos,stringPos,maxFret,fretCenter,svgEl}){windows.forEach(w=>{const color=colors[w.id-1];for(let s=0;s<stringCount;s++){let[from,to]=w.pairs[s];if(to<=0||from>maxFret)continue;const a=from<=0?fretPos(0):fretCenter(from,fretPos),b=to>maxFret?fretPos(maxFret):fretCenter(to,fretPos),p=stringPos(s),attrs=isPortrait?{x1:p,y1:a,x2:p,y2:b}:{x1:a,y1:p,x2:b,y2:p},width=isPortrait?40:26;svg.append(svgEl('line',{...attrs,stroke:'#02060a','stroke-width':width+3,'stroke-linecap':'round',opacity:.68}));svg.append(svgEl('line',{...attrs,stroke:color,'stroke-width':width,'stroke-linecap':'round',opacity:.94}));svg.append(svgEl('line',{...attrs,stroke:'#fff','stroke-width':2.4,'stroke-linecap':'round',opacity:.12}))}})}
  // A position spans the full fret range of its string pairs, including open
  // strings and the visible part of a box continued beyond either neck edge.
  function positionSpans(windows,maxFret){
    const spans=windows.map(w=>{
      const frets=w.pairs.flat();
      return {id:w.id,from:Math.max(0,Math.min(...frets)),to:Math.min(maxFret,Math.max(...frets))};
    }).filter(w=>w.to>0&&w.from<=w.to).sort((a,b)=>a.from-b.from||a.to-b.to||a.id-b.id);
    const laneEnds=[];
    for(const span of spans){
      // Adjacent boxes share frets: keep their brackets on separate tracks.
      let lane=laneEnds.findIndex(end=>end<span.from-1);
      if(lane<0)lane=laneEnds.length;
      span.lane=lane;laneEnds[lane]=span.to;
    }
    return spans;
  }

  const guides=new WeakMap();
  function renderGuides({svg,windows,colors,layout,svgEl}){
    const spans=positionSpans(windows,layout.maxFret);
    if(!spans.length)return;
    const layer=svgEl('g',{class:'penta-position-guides'});
    svg.append(layer);
    guides.set(svg,{layer,spans,colors,layout,svgEl});
    resizeGuides(svg);
  }

  function resizeGuides(svg){
    const guide=guides.get(svg);
    if(!guide||!svg.contains(guide.layer))return;
    const {layer,spans,colors,layout,svgEl}=guide,{isP,W,H,fretPos}=layout;
    const stage=svg.parentElement.getBoundingClientRect();
    if(!stage.width||!stage.height)return;
    const maxWidth=parseFloat(getComputedStyle(svg).maxWidth)||stage.width;
    const width=Math.min(stage.width,maxWidth),height=stage.height;
    const fontSize=width>=1000?16:14,badgeWidth=width>=1000?36:32,badgeHeight=24;
    const lanes=Math.max(...spans.map(s=>s.lane))+1;
    // Reserve screen pixels outside the existing neck. Labels and dashes stay
    // readable when the SVG scales down, without changing any note geometry.
    const pitch=isP?38:32,margin=lanes*pitch+12;
    const scale=isP?Math.min((width-margin)/W,height/H):Math.min(width/W,(height-margin)/H);
    if(scale<=0)return;
    svg.setAttribute('viewBox',`0 0 ${isP?W+margin/scale:W} ${isP?H:H+margin/scale}`);
    layer.replaceChildren();
    for(const span of spans){
      const a=span.from===0?8:fretPos(span.from-1),b=fretPos(span.to);
      const cross=(isP?W:H)+(20+span.lane*pitch)/scale,mid=(a+b)/2;
      const x=isP?cross:mid,y=isP?mid:cross,cap=6/scale;
      const group=svgEl('g',{class:'penta-position-guide',style:`color:${colors[span.id-1]}`,'data-position':span.id,'data-start-fret':span.from,'data-end-fret':span.to,'data-lane':span.lane});
      group.append(svgEl('title',{},`P${span.id} · ${span.from}–${span.to}`));
      group.append(svgEl('path',{class:'penta-position-span',d:isP?`M ${cross} ${a} V ${b}`:`M ${a} ${cross} H ${b}`}));
      group.append(svgEl('path',{class:'penta-position-cap',d:isP?`M ${cross-cap} ${a} H ${cross} M ${cross-cap} ${b} H ${cross}`:`M ${a} ${cross-cap} V ${cross} M ${b} ${cross-cap} V ${cross}`}));
      group.append(svgEl('rect',{class:'penta-position-badge',x:x-badgeWidth/2/scale,y:y-badgeHeight/2/scale,width:badgeWidth/scale,height:badgeHeight/scale,rx:6/scale}));
      group.append(svgEl('text',{x,y,'font-size':fontSize/scale,'data-no-i18n':''},`P${span.id}`));
      layer.append(group);
    }
  }
  window.PentatonicRenderer={visiblePairs,renderSegments,positionSpans,renderGuides,resizeGuides};
})();
