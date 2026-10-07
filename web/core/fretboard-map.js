(() => {
  'use strict';
  const DEFAULT_COLORS={A:'#4f9dff','A#':'#9b6cff',B:'#c48b5b',C:'#35d1b0','C#':'#26b9d5',D:'#d15a91','D#':'#b864d8',E:'#82bd58',F:'#ff745e','F#':'#ff4f93',G:'#ff9d3f','G#':'#ffd14f'};
  function render({svg,engine,maxFret,appearance,selectedNote='all',allowedNotes=null,renderCore,svgEl,noteName=MusicTheory.noteName,colors=DEFAULT_COLORS}){
    const {isP,fretPos,visualStringPos}=renderCore(svg,{prefix:'map',maxFret});
    for(let s=0;s<engine.stringCount;s++)for(let f=0;f<=maxFret;f++){
      const pc=engine.noteAt(s,f),name=noteName(pc);if(allowedNotes&&!allowedNotes.includes(name))continue;if(selectedNote!=='all'&&name!==selectedNote)continue;
      const centerF=FretboardLayout.fretCenter(f,fretPos),centerS=visualStringPos(s),x=isP?centerS:centerF,y=isP?centerF:centerS,col=colors[name]||'#fff';
      appearance.note(svg,{x,y,isP,color:col,label:name,target:selectedNote!=='all',attrs:{'data-string':s,'data-fret':f,'data-note':name}});
    }
  }
  window.FretboardMap={render,DEFAULT_COLORS};
})();
