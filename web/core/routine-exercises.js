(() => {
  'use strict';
  const pick=(items,random)=>items[Math.floor(random()*items.length)];
  const single=notes=>notes.map(note=>({notes:[note]}));
  // Write the descending passage after the ascent, as a normal tablature.
  // The turning note is played once; the final note returns to the beginning.
  const roundTrip=notes=>single(notes.concat(notes.slice(0,-1).reverse()));
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

  function guitarTriads(engine,root,rootPC,quality,maxFret){
    const columns=[],sections=[],system=engine.profile.caged;
    // Spell a third as a third, including E# in C# major and C## in A# major.
    const letters=['C','D','E','F','G','A','B'],letter=letters[(letters.indexOf(root[0])+2)%7];
    const alteration=MusicTheory.mod(rootPC+(quality==='major'?4:3)-MusicTheory.PC[letter]);
    const third=letter+(alteration<=6?'#'.repeat(alteration):'♭'.repeat(12-alteration));
    function cagedForms(shape){
      return system.order.filter(id=>{
        const offsets=shape.notes.map(note=>{
          const part=system.templates[id].find(([string])=>string===note.string);
          return part&&part[2]===note.degree?note.fret-part[1]+(quality==='minor'&&part[2]==='third'?1:0):null;
        });
        // A label describes an exact three-string fragment of the template,
        // not a claim that its entire parent chord is playable at this fret.
        return offsets.every(offset=>offset!==null&&offset===offsets[0]);
      });
    }
    for(const set of ['GBE','DGB','ADG']){
      const strings=engine.profile.triadSets[set],start=columns.length;
      const shapes=TriadEngine.findShapes({engine,rootPC,quality,maxFret,set});
      if(!shapes.length)throw new Error('No routine triads for '+set);
      shapes.forEach((shape,index)=>{
        if(index){
          const note=shape.notes.find(n=>n.degree==='third');
          const from=shapes[index-1].notes.find(n=>n.string===note.string);
          columns.push({kind:'third',notes:[note],from,label:`${quality==='major'?'Major':'Minor'} third — ${third}`,subLabel:`${from.fret} → ${note.fret}`});
        }
        const forms=cagedForms(shape);
        columns.push({kind:'triad',notes:shape.notes,label:shape.inversion,forms,subLabel:forms.length?`CAGED forms: ${forms.join(' / ')}`:''});
      });
      sections.push({set,strings,start,end:columns.length});
    }
    return {columns,sections};
  }

  function create({engine,root,quality,random=Math.random,diagonal=0,patterns=RoutinePatterns.defaults()}){
    const rootPC=MusicTheory.PC[root],maxFret=Math.min(15,engine.maxFret),key=`${root} ${quality}`;
    const shared={root,rootPC,quality};
    const make=(id,step,title,detail,instruction,columns)=>({...shared,id,step,title,detail,instruction,columns});
    const roots=[];
    engine.courses.forEach((_,string)=>{for(let fret=0;fret<=maxFret;fret++)if(engine.noteAt(string,fret)===rootPC)roots.push({string,fret})});
    const rootExercise=make('root','Root',`Find every ${root} on the fretboard`,`${key} · Frets 0–${maxFret}`,
      `Play each note and say “${root}” aloud.`,single(roots));

    const intervals=quality==='major'?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10];
    // A stable, compact octave starting on the lowest available root string.
    const scale=sequences(engine,rootPC,intervals,maxFret).map(notes=>notes.slice(0,8)).sort((a,b)=>
      engine.midiAt(a[0].string,a[0].fret)-engine.midiAt(b[0].string,b[0].fret)||a[0].string-b[0].string||
      (Math.max(...a.map(n=>n.fret))-Math.min(...a.map(n=>n.fret)))-(Math.max(...b.map(n=>n.fret))-Math.min(...b.map(n=>n.fret)))||
      (a[0].fret-Math.min(...a.map(n=>n.fret)))-(b[0].fret-Math.min(...b.map(n=>n.fret)))||
      Math.max(...a.map(n=>n.fret))-Math.max(...b.map(n=>n.fret)))[0];
    const scaleExercise={...make('scale','Scale',`Play the ${key} scale`,`One octave · ${range(scale)}`,
      `Start on ${root}. Play up to the octave, then return to the root.`,[]),...RoutineMelody.scale(scale,engine,root,rootPC)};

    let triadExercise;
    if(engine.profile.family==='guitar'){
      const journey=guitarTriads(engine,root,rootPC,quality,maxFret);
      triadExercise={...make('triads','Triads',`Connect the ${key} triads`,`${key} · Frets 0–${maxFret}`,
        'Triad → third alone → next triad. Sliding is optional.',journey.columns),sections:journey.sections};
    }else{
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
      triadExercise=make('triads','Triads',`Connect the ${key} triads`,`${key} · Strings ${set} · Lower, middle & upper neck`,
        'Play each triad together, then one note at a time.',
        triads.map(s=>({notes:s.notes,label:s.inversion})));
    }

    let chordExercise;
    if(engine.profile.family==='bass'){
      const arp=pick(sequences(engine,rootPC,[0,quality==='major'?4:3,7],maxFret),random);
      chordExercise=make('chords','Arpeggios',`Outline the ${key} arpeggio`,`${key} · Root, third & fifth · ${range(arp)}`,
        'Play each chord tone, then return through the same notes.',roundTrip(arp));
    }else if(engine.profile.family==='guitar'){
      chordExercise={...make('chords','Rhythm','Right-hand warm-up','',
        'Use any chord, or mute the strings.',[]),strumming:true,patterns};
    }else{
      const system=engine.profile.caged||engine.profile.chords;
      const all=ChordEngine.templateShapes({engine,...system,rootPC,quality,maxFret});
      const unique=system.order.map(shape=>pick(all.filter(s=>s.shape===shape),random)).filter(Boolean).sort((a,b)=>a.min-b.min);
      chordExercise=make('chords','Chords',`Move through ${key} chord shapes`,
        `${key} · Ukulele voicings`,
        'Play each chord shape. Stacked notes sound together; × means mute.',
        unique.map(s=>({notes:s.notes,label:`${s.shape} shape`,muteMissing:true})));
    }

    let pentaExercise;
    if(engine.profile.family==='guitar'){
      const journey=RoutineMelody.diagonal(engine,root,rootPC,quality,diagonal);
      const notes=journey.columns.flatMap(column=>column.notes);
      pentaExercise={...make('penta','Penta',`Connect the ${key} pentatonic boxes`,`Diagonal ${journey.diagonal} · ${range(notes)}`,
        'Repeat the same five notes one octave higher in each block. Sliding is optional.',[]),...journey};
    }else{
      const anchorCourse=engine.profile.pentatonic.anchorCourse;
      const anchor=MusicTheory.mod(rootPC-(quality==='major'?3:0)-engine.courses[anchorCourse].pc);
      const pcs=MusicTheory.pentatonicPCs(rootPC,quality);
      const boxes=PentatonicRenderer.visiblePairs({profile:engine.profile,anchor,maxFret}).filter(box=>box.pairs.every((pair,string)=>pair.every(fret=>fret>=0&&fret<=maxFret&&pcs.includes(engine.noteAt(string,fret)))));
      // Start nearest the nut; never randomly choose the octave at fret 12+.
      const box=boxes.sort((a,b)=>Math.max(...a.pairs.flat())-Math.max(...b.pairs.flat())||Math.min(...a.pairs.flat())-Math.min(...b.pairs.flat())||a.id-b.id)[0];
      if(!box)throw new Error('No complete routine pentatonic position for this tuning');
      const penta=box.pairs.flatMap((pair,string)=>pair.map(fret=>({string,fret})));
      pentaExercise=make('penta','Penta',`Play the ${key} pentatonic`,`${key} · Position ${box.id} · ${range(penta)}`,
        `Play two notes per string, then reverse. ${engine.profile.reentrant?'The high G string makes this a fingering pattern, not an ascending pitch sequence.':''}`,roundTrip(penta));
    }
    return [rootExercise,scaleExercise,triadExercise,chordExercise,pentaExercise];
  }
  window.RoutineExercises=Object.freeze({create});
})();
