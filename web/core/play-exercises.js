(() => {
  'use strict';
  // Authored A-minor phrases. [course index, fret]; courses run low to high.
  // Transposition moves the entire phrase, preserving fingering and techniques.
  const PHRASES={
    guitar:[
      {title:'Back to the root',notes:[[5,8],[5,5],[4,8],[4,5],[3,7],[3,5],[2,7]],tip:'Finish on A. Keep each note clear.'},
      {title:'Ask and answer',notes:[[2,7],[3,5],[3,7],[4,5],[3,7],[3,5],[2,7]],tip:'Leave space after the first phrase. Let the final root ring.'},
      {title:'Climb and resolve',notes:[[2,7],[3,5],[3,7],[4,5],[4,8],[5,5]],tip:'Build the phrase gently and settle on the high root.'},
      {title:'Low-string answer',notes:[[0,5],[0,8],[1,5],[1,7],[2,5],[2,7]],tip:'Keep the low strings clean. End with a relaxed root.'}
    ],
    bass:[
      {title:'Pocket to the root',notes:[[1,0],[1,3],[2,0],[2,2],[2,5],[2,2],[1,3],[1,0]],tip:'Keep the pulse steady. Mute the string you just left.'},
      {title:'A small blues fill',notes:[[1,0],[2,2],[2,0],[1,3],[1,0],[0,3],[0,5]],tip:'Play the fill evenly and land firmly on the root.'},
      {title:'Climb out of the pocket',notes:[[0,5],[0,8],[1,5],[1,7],[2,5],[2,7]],tip:'Move evenly across the strings and resolve on the root.'},
      {title:'Root and fifth groove',notes:[[1,0],[2,2],[1,0],[2,5],[2,2],[1,3],[1,0]],tip:'Give the root a strong pulse and keep the fill lighter.'}
    ],
    ukulele:[
      {title:'Back to the root',notes:[[3,3],[3,0],[2,3],[2,0],[1,2],[1,0],[2,5]],tip:'Keep your fingers close to the strings. Let the final root ring.'},
      {title:'A melodic answer',notes:[[2,5],[3,0],[3,3],[3,0],[2,3],[2,0],[2,5]],tip:'Make the phrase sing. Finish gently on the root.'},
      {title:'Climb and resolve',notes:[[1,0],[1,2],[2,0],[2,3],[3,0]],tip:'Let the melody rise naturally and settle on the root.'},
      {title:'High-string answer',notes:[[3,0],[3,3],[2,3],[2,0],[2,3],[3,0]],tip:'Keep the answer light and make the final root clear.'}
    ]
  };
  // A-major phrases are authored separately: changing the label alone would
  // leave minor thirds/sevenths in the tab, especially on open strings.
  const MAJOR_PHRASES={
    guitar:[
      {title:'Back to the root',notes:[[5,7],[5,5],[4,7],[4,5],[3,6],[3,4],[2,7]],tip:'Finish on the root. Keep each note clear.'},
      {title:'Ask and answer',notes:[[2,7],[3,4],[3,6],[4,5],[3,6],[3,4],[2,7]],tip:'Leave space after the first phrase. Let the final root ring.'},
      {title:'Climb and resolve',notes:[[2,7],[3,4],[3,6],[4,5],[4,7],[5,5]],tip:'Build the phrase gently and settle on the high root.'},
      {title:'Low-string answer',notes:[[0,5],[0,7],[1,4],[1,7],[2,4],[2,7]],tip:'Keep the low strings clean. End with a relaxed root.'}
    ],
    bass:[
      {title:'Pocket to the root',notes:[[1,0],[1,2],[1,4],[2,2],[2,4],[2,2],[1,2],[1,0]],tip:'Keep the pulse steady. Mute the string you just left.'},
      {title:'A small blues fill',notes:[[1,0],[2,2],[1,4],[1,2],[1,0],[0,2],[0,5]],tip:'Play the fill evenly and land firmly on the root.'},
      {title:'Climb out of the pocket',notes:[[0,5],[0,7],[1,4],[1,7],[2,4],[2,7]],tip:'Move evenly across the strings and resolve on the root.'},
      {title:'Root and fifth groove',notes:[[1,0],[2,2],[1,0],[2,4],[2,2],[1,2],[1,0]],tip:'Give the root a strong pulse and keep the fill lighter.'}
    ],
    ukulele:[
      {title:'Back to the root',notes:[[3,2],[3,0],[2,2],[2,0],[1,1],[2,0],[2,5]],tip:'Keep your fingers close to the strings. Let the final root ring.'},
      {title:'A melodic answer',notes:[[2,5],[3,0],[3,2],[3,0],[2,2],[2,0],[2,5]],tip:'Make the phrase sing. Finish gently on the root.'},
      {title:'Climb and resolve',notes:[[1,1],[2,0],[2,2],[3,2],[3,0]],tip:'Let the melody rise naturally and settle on the root.'},
      {title:'High-string answer',notes:[[3,0],[3,2],[2,2],[2,0],[2,2],[3,0]],tip:'Keep the answer light and make the final root clear.'}
    ]
  };
  const styles=['Blues','Rock','Melodic'],levels=['Beginner','Intermediate','Advanced','Expert'];
  const TECHNIQUES={h:'Hammer-on',p:'Pull-off','/':'Slide up','\\':'Slide down',b:'Bend a whole tone',v:'Vibrato'};
  function list(family,style,level,quality='minor'){
    const catalog=quality==='major'?MAJOR_PHRASES:PHRASES;
    const phrases=catalog[family]||catalog.guitar;
    return phrases.map((phrase,variant)=>{
      let notes=phrase.notes.map(([string,fret])=>({string,fret,duration:1,technique:null}));
      if(style==='Rock')notes=[...notes.slice(0,2),{...notes[0]},...notes.slice(2)];
      if(style==='Melodic')notes=[...notes.slice(0,2),...notes.slice(2).reverse()];
      // Always resolve on the authored root, even after a contour variation.
      if(style==='Melodic')notes.push({string:phrase.notes.at(-1)[0],fret:phrase.notes.at(-1)[1],duration:1,technique:null});
      notes=notes.map(n=>({string:n.string,fret:n.fret,duration:level==='Beginner'?1:.5,technique:null}));
      if(level!=='Beginner'){
        for(let i=1;i<notes.length;i++)if(notes[i].string===notes[i-1].string&&notes[i].fret!==notes[i-1].fret){notes[i].technique=notes[i].fret>notes[i-1].fret?'h':'p';break}
      }
      if(level==='Advanced'||level==='Expert'){
        for(let i=notes.length-2;i>0;i--)if(notes[i].string===notes[i-1].string&&notes[i].fret!==notes[i-1].fret){notes[i].technique=notes[i].fret>notes[i-1].fret?'/':'\\';break}
        notes.at(-1).technique='v';
      }
      if(level==='Expert'){
        notes.forEach((n,i)=>n.duration=i%3===0?.5:.25);
        // Minor: D to E; major: B to C-sharp. Both bend targets belong to the pentatonic.
        if(family==='guitar'&&style==='Blues'){const bend=notes.find(n=>n.string===3&&n.fret===(quality==='major'?4:7));if(bend){bend.technique='b';bend.bend=2}}
      }
      notes.at(-1).duration=2;
      return {id:`${family}-${style}-${level}-${variant}${quality==='major'?'-major':''}`,quality,title:style==='Rock'?'Driving '+(variant+1)+' · Pentatonic':style==='Melodic'?'Melodic '+(variant+1)+' · Resolution':phrase.title,tip:phrase.tip.replace(' on A',' on the root'),notes};
    });
  }
  function transpose(exercise,root,engine){
    const shift=MusicTheory.PC[root];
    const notes=exercise.notes.map(n=>({...n,fret:n.fret+shift}));
    if(notes.some(n=>n.fret>engine.maxFret))throw new Error('Exercise exceeds this instrument’s fret range');
    return {...exercise,root,notes,techniques:[...new Set(notes.map(n=>n.technique).filter(Boolean))]};
  }
  function dailyIndex(date=new Date()){return Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000)%4}
  window.PlayExercises=Object.freeze({styles,levels,techniques:TECHNIQUES,list,transpose,dailyIndex});
})();
