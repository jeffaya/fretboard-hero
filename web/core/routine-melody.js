(() => {
  'use strict';
  const {mod,PC}=MusicTheory;
  const degrees={0:'1',2:'2',3:'♭3',4:'3',5:'4',7:'5',8:'♭6',9:'6',10:'♭7',11:'7'};
  const letters=['C','D','E','F','G','A','B'];
  function describe(note,engine,root,rootPC){
    const interval=mod(engine.noteAt(note.string,note.fret)-rootPC),degree=degrees[interval];
    const letter=letters[(letters.indexOf(root[0])+Number(degree.replace('♭',''))-1)%7];
    const accidental=mod(rootPC+interval-PC[letter]);
    const name=letter+(accidental>6?'♭'.repeat(12-accidental):'#'.repeat(accidental));
    return {notes:[note],noteName:name,degree};
  }
  function journey(up){
    const back=up.slice(0,-1).reverse().map((column,i)=>{
      const previous=up[up.length-1-i];
      return {...column,slideFrom:previous.slideFrom?previous.notes[0]:undefined,fromPosition:previous.slideFrom?previous.position:undefined};
    });
    return {melody:true,columns:up.concat(back),sections:[
      {start:0,end:up.length,label:'Ascending'},
      {start:up.length,end:up.length+back.length,label:'Returning'}
    ]};
  }
  function scale(notes,engine,root,rootPC){
    return journey(notes.slice(0,8).map(note=>describe(note,engine,root,rootPC)));
  }
  function diagonal(engine,root,rootPC,quality,diagonalNumber){
    // Preserve the two reference fingerings when transposing: in A minor,
    // G–A–C–D–E starts at fret 3 and C–D–E–G–A starts at fret 8.
    const minorRoot=mod(rootPC-(quality==='major'?3:0));
    const scale=[0,3,5,7,10],lowerCount=diagonalNumber===2?3:2,rotation=diagonalNumber===2?1:4;
    const offsets=scale.map((_,i)=>scale[(rotation+i)%5]+12*Math.floor((rotation+i)/5));
    const firstFret=mod(minorRoot+offsets[0]-engine.courses[0].pc);
    const firstMidi=engine.midiAt(0,firstFret),anchor=mod(minorRoot-engine.courses[0].pc);
    const boxes=PentatonicRenderer.visiblePairs({profile:engine.profile,anchor,maxFret:engine.maxFret});
    const up=[];
    for(let block=0;block<3;block++){
      const notes=offsets.map((offset,i)=>{
        const string=block*2+(i<lowerCount?0:1);
        return {string,fret:firstMidi+block*12+offset-offsets[0]-engine.courses[string].midi};
      });
      if(notes.some(n=>n.fret<0||n.fret>engine.maxFret))throw new Error('No complete diagonal for this fretboard');
      const shift=lowerCount===3?2:4,slidingString=notes[shift].string;
      const before=boxes.find(box=>notes.slice(0,2).every(n=>box.pairs[n.string].includes(n.fret)));
      const after=boxes.find(box=>[notes[shift-1].fret,notes[shift].fret].every(fret=>box.pairs[slidingString].includes(fret)));
      if(!before||!after||notes.some((note,i)=>!(i<shift?before:after).pairs[note.string].includes(note.fret)))throw new Error('No matching pentatonic boxes');
      notes.forEach((note,i)=>up.push({...describe(note,engine,root,rootPC),block:block+1,
        holdMs:engine.noteAt(note.string,note.fret)===rootPC?380:undefined,
        position:i<shift?before.id:after.id,slideFrom:i===shift?notes[i-1]:undefined,fromPosition:i===shift?before.id:undefined}));
    }
    return journey(up);
  }
  window.RoutineMelody=Object.freeze({scale,diagonal});
})();
