(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FretboardChords=api;})(typeof window==='undefined'?globalThis:window,()=>{
  'use strict';
  const mod=n=>(n%12+12)%12;
  const roots=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
  const qualities={major:{suffix:'',intervals:[0,4,7],degrees:[0,2,4]},minor:{suffix:'m',intervals:[0,3,7],degrees:[0,2,4]},'7':{suffix:'7',intervals:[0,4,7,10],degrees:[0,2,4,6]},m7:{suffix:'m7',intervals:[0,3,7,10],degrees:[0,2,4,6]},maj7:{suffix:'maj7',intervals:[0,4,7,11],degrees:[0,2,4,6]},'6':{suffix:'6',intervals:[0,4,7,9],degrees:[0,2,4,5]},m6:{suffix:'m6',intervals:[0,3,7,9],degrees:[0,2,4,5]},sus2:{suffix:'sus2',intervals:[0,2,7],degrees:[0,1,4]},sus4:{suffix:'sus4',intervals:[0,5,7],degrees:[0,3,4]},dim:{suffix:'dim',intervals:[0,3,6],degrees:[0,2,4]},aug:{suffix:'aug',intervals:[0,4,8],degrees:[0,2,4]},add9:{suffix:'add9',intervals:[0,4,7,2],degrees:[0,2,4,1]}};
  const tunings={guitar:[40,45,50,55,59,64],'bass-4':[28,33,38,43],ukulele:[67,60,64,69]};
  // Curated movable grips. Arrays always follow the instrument's string order.
  // A negative fret is muted; fingers 1–4 are index through little finger.
  const guitarE={
    major:[[0,2,2,1,0,0],[1,3,4,2,1,1]],minor:[[0,2,2,0,0,0],[1,3,4,1,1,1]],
    '7':[[0,2,0,1,0,0],[1,3,1,2,1,1]],m7:[[0,2,0,0,0,0],[1,3,1,1,1,1]],maj7:[[0,2,1,1,-1,-1],[1,4,2,3,0,0]],
    '6':[[0,2,2,1,2,0],[1,3,3,2,4,1]],m6:[[0,2,2,0,2,0],[1,3,3,1,4,1]],
    sus2:[[0,2,4,4,-1,-1],[1,2,3,4,0,0]],sus4:[[0,2,2,2,0,0],[1,3,3,3,1,1]],
    dim:[[0,1,2,0,-1,-1],[1,2,3,1,0,0]],aug:[[0,3,2,1,-1,-1],[1,4,3,2,0,0]],add9:[[0,2,2,1,0,2],[1,3,3,2,1,4]]
  };
  const guitarA={
    major:[[-1,0,2,2,2,0],[0,1,3,3,3,1]],minor:[[-1,0,2,2,1,0],[0,1,3,4,2,1]],
    '7':[[-1,0,2,0,2,0],[0,1,3,1,4,1]],m7:[[-1,0,2,0,1,0],[0,1,3,1,2,1]],maj7:[[-1,0,2,1,2,0],[0,1,3,2,4,1]],
    '6':[[-1,0,2,2,2,2],[0,1,3,3,3,3]],m6:[[-1,0,2,2,1,2],[0,1,3,3,2,4]],
    sus2:[[-1,0,2,2,0,0],[0,1,3,4,1,1]],sus4:[[-1,0,2,2,3,0],[0,1,2,3,4,1]],
    dim:[[-1,0,1,2,1,-1],[0,1,2,4,3,0]],aug:[[-1,0,3,2,2,1],[0,1,4,3,3,2]],add9:[[-1,0,2,4,2,0],[0,1,2,4,3,1]]
  };
  const ukeC={major:[[0,0,0,3],[1,1,1,4]],minor:[[0,3,3,3],[1,4,4,4]],'7':[[0,0,0,1],[1,1,1,2]],m7:[[3,3,3,3],[1,1,1,1]],maj7:[[0,0,0,2],[1,1,1,3]],'6':[[0,0,0,0],[1,1,1,1]],m6:[[2,3,3,3],[1,3,3,3]],sus2:[[0,2,3,3],[1,2,3,4]],sus4:[[0,0,1,3],[1,1,2,4]],dim:[[-1,3,2,3],[0,2,1,3]],aug:[[1,0,0,3],[2,1,1,4]],add9:[[0,2,0,3],[1,3,1,4]]};
  const ukeA={major:[[2,1,0,0],[3,2,1,1]],minor:[[2,0,0,0],[3,1,1,1]],'7':[[0,1,0,0],[1,2,1,1]],m7:[[2,4,3,3],[1,4,2,3]],maj7:[[1,1,0,0],[2,2,1,1]],'6':[[2,4,2,4],[1,3,1,4]],m6:[[2,4,2,3],[1,3,1,2]],sus2:[[2,4,0,2],[2,4,1,3]],sus4:[[2,2,0,0],[3,4,1,1]],dim:[[2,3,-1,3],[1,2,0,3]],aug:[[2,1,1,0],[3,2,2,1]],add9:[[2,1,0,2],[3,2,1,4]]};
  const openGuitar={
    '0:major':[[[-1,3,2,0,1,0],[0,3,2,0,1,0]]],
    '2:major':[[[-1,-1,0,2,3,2],[0,0,0,1,3,2]]],
    '2:minor':[[[-1,-1,0,2,3,1],[0,0,0,2,3,1]]],
    '2:7':[[[-1,-1,0,2,1,2],[0,0,0,2,1,3]]],
    '7:major':[[[3,2,0,0,0,3],[2,1,0,0,0,3]],[[3,2,0,0,3,3],[2,1,0,0,3,4]]],
    '7:7':[[[3,2,0,0,0,1],[3,2,0,0,0,1]]],
    '7:maj7':[[[3,-1,0,0,0,2],[3,0,0,0,0,2]]],
    '0:7':[[[-1,3,2,3,1,0],[0,3,2,4,1,0]]],
    '0:maj7':[[[-1,3,2,0,0,0],[0,3,2,0,0,0]]],
    '0:add9':[[[-1,3,2,0,3,3],[0,2,1,0,3,4]]]
  };
  function notes(root,quality){
    const q=qualities[quality],letters='CDEFGAB',naturals=[0,2,4,5,7,9,11],start=letters.indexOf(roots[root][0]);
    return q.intervals.map((offset,i)=>{const letter=(start+q.degrees[i])%7;let delta=mod(root+offset-naturals[letter]);if(delta>6)delta-=12;return letters[letter]+(delta<0?'♭'.repeat(-delta):'♯'.repeat(delta));});
  }
  function grip(template,shift,shape){
    const frets=template[0].map(f=>f<0?-1:f+shift),fingers=template[1].map((f,i)=>frets[i]>0?f:0);
    const barres=[];
    for(let finger=1;finger<=4;finger++){
      const strings=fingers.flatMap((f,i)=>f===finger?[i]:[]);
      if(strings.length<2)continue;
      const from=strings[0],to=strings.at(-1),fret=frets[from];
      if(strings.every(i=>frets[i]===fret)&&frets.slice(from,to+1).every(f=>f>=fret))barres.push({from,to,fret,finger});
    }
    return {frets,fingers,barres,shape,kind:barres.length?'barre':frets.includes(0)?'open':'compact'};
  }
  function voicings(instrument,root,quality){
    if(!qualities[quality]||!Number.isInteger(root)||root<0||root>11)return [];
    if(instrument==='bass-4')return [];
    const entries=instrument==='guitar'?[
      ...(openGuitar[`${root}:${quality}`]||[]).map(t=>grip(t,0,'')),
      grip(guitarE[quality],mod(root-4),'E'),grip(guitarA[quality],mod(root-9),'A')
    ]:[grip(ukeC[quality],root,'C'),grip(ukeA[quality],mod(root-9),'A')];
    return entries.filter((v,i,all)=>all.findIndex(x=>x.frets.join()===v.frets.join())===i);
  }
  return Object.freeze({roots,qualities,tunings,notes,voicings});
});
