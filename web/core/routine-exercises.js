(() => {
  'use strict';
  const pick=(items,random)=>items[Math.floor(random()*items.length)];
  const single=notes=>notes.map(note=>({notes:[note]}));
  const range=notes=>`Frets ${Math.min(...notes.map(n=>n.fret))}–${Math.max(...notes.map(n=>n.fret))}`;

  // Work in MIDI for melodic order: a high-G ukulele is not tuned low to high.
  function sequences(engine,rootPC,intervals,maxFret){
    const candidates=[];
    for(let low=0;low<=maxFret-4;low++){
      const byMidi=new Map();
      engine.courses.forEach((_,string)=>{
        for(let fret=low;fret<=low+4;fret++){
          const pc=engine.noteAt(string,fret),midi=engine.midiAt(string,fret);
          if(intervals.includes(MusicTheory.mod(pc-rootPC))&&!byMidi.has(midi))byMidi.set(midi,{string,fret,pc,midi});
        }
      });
      for(const start of byMidi.values()){
        if(start.pc!==rootPC)continue;
        const notes=[];
        for(let octave=0;octave<2;octave++){
          const pitches=intervals.map(i=>start.midi+12*octave+i).concat(start.midi+12*(octave+1));
          if(!pitches.every(midi=>byMidi.has(midi)))break;
          if(octave)notes.pop();
          notes.push(...pitches.map(midi=>byMidi.get(midi)));
        }
        if(notes.length)candidates.push(notes);
      }
    }
    if(!candidates.length)throw new Error('No complete routine scale for this tuning');
    const seen=new Set();
    return candidates.filter(notes=>{const key=notes.map(n=>`${n.string}:${n.fret}`).join('|');if(seen.has(key))return false;seen.add(key);return true});
  }

  function create({engine,root,quality,random=Math.random}){
    const rootPC=MusicTheory.PC[root],maxFret=Math.min(15,engine.maxFret),key=`${root} ${quality}`;
    const shared={root,rootPC,quality};
    const make=(id,step,title,detail,instruction,columns)=>({...shared,id,step,title,detail,instruction,columns});
    const roots=[];
    engine.courses.forEach((_,string)=>{for(let fret=0;fret<=maxFret;fret++)if(engine.noteAt(string,fret)===rootPC)roots.push({string,fret})});
    const rootExercise=make('root','Root',`Find every ${root} on the fretboard`,`${key} · Frets 0–${maxFret}`,
      `Play each note and say “${root}” aloud.`,single(roots));

    const intervals=quality==='major'?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10];
    const scale=pick(sequences(engine,rootPC,intervals,maxFret),random);
    const scaleExercise=make('scale','Scale',`Play the ${key} scale`,`${quality==='minor'?'Natural minor':'Major'} · ${range(scale)}`,
      'Play up to the octave, then back to the root.',single(scale));

    const sets=Object.keys(engine.profile.triadSets),set=pick(sets,random);
    const shapes=TriadEngine.findShapes({engine,rootPC,quality,maxFret,set});
    // Choose one of each inversion, spread across the neck, on one string set.
    const combinations=[];
    for(const a of shapes)for(const b of shapes)for(const c of shapes){
      if(a.min>=b.min||b.min>=c.min||new Set([a.inversion,b.inversion,c.inversion]).size!==3)continue;
      combinations.push([a,b,c]);
    }
    const spread=combinations.filter(s=>s[2].min-s[0].min>=6);
    const triads=pick(spread.length?spread:combinations,random);
    if(!triads)throw new Error('No routine triad inversions for this tuning');
    const triadExercise=make('triads','Triads',`Connect the ${key} triads`,`${key} · Strings ${set} · Lower, middle & upper neck`,
      'Play each triad together, then one note at a time.',
      triads.map(s=>({notes:s.notes,label:s.inversion})));

    let chordExercise;
    if(engine.profile.family==='bass'){
      const arp=pick(sequences(engine,rootPC,[0,quality==='major'?4:3,7],maxFret),random);
      chordExercise=make('chords','Arpeggios',`Outline the ${key} arpeggio`,`${key} · Root, third & fifth · ${range(arp)}`,
        'Play each chord tone, then return through the same notes.',single(arp));
    }else{
      const system=engine.profile.caged||engine.profile.chords;
      const all=ChordEngine.templateShapes({engine,...system,rootPC,quality,maxFret});
      const unique=system.order.map(shape=>pick(all.filter(s=>s.shape===shape),random)).filter(Boolean).sort((a,b)=>a.min-b.min);
      chordExercise=make('chords','Chords',engine.profile.family==='guitar'?`Move through ${key} CAGED shapes`:`Move through ${key} chord shapes`,
        `${key} · ${engine.profile.family==='guitar'?'CAGED':'Ukulele'} voicings`,
        'Play each chord shape. Stacked notes sound together; × means mute.',
        unique.map(s=>({notes:s.notes,label:`${s.shape} shape`,muteMissing:true})));
    }

    const anchorCourse=engine.profile.pentatonic.anchorCourse;
    const anchor=MusicTheory.mod(rootPC-(quality==='major'?3:0)-engine.courses[anchorCourse].pc);
    const pcs=MusicTheory.pentatonicPCs(rootPC,quality);
    const boxes=PentatonicRenderer.visiblePairs({profile:engine.profile,anchor,maxFret}).filter(box=>box.pairs.every((pair,string)=>pair.every(fret=>fret>=0&&fret<=maxFret&&pcs.includes(engine.noteAt(string,fret)))));
    const box=pick(boxes,random);
    if(!box)throw new Error('No complete routine pentatonic position for this tuning');
    const penta=box.pairs.flatMap((pair,string)=>pair.map(fret=>({string,fret})));
    const pentaExercise=make('penta','Penta',`Play the ${key} pentatonic`,`${key} · Position ${box.id} · ${range(penta)}`,
      `Play two notes per string, then reverse. ${engine.profile.reentrant?'The high G string makes this a fingering pattern, not an ascending pitch sequence.':''}`,single(penta));
    return [rootExercise,scaleExercise,triadExercise,chordExercise,pentaExercise];
  }
  window.RoutineExercises=Object.freeze({create});
})();
