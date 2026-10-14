(function(root){
  'use strict';
  // A space separates beats; '-' moves the hand without striking. Lowercase
  // d/u are palm-muted strokes, x a percussive stroke, > an accent.
  function pattern(id,name,level,division,score){
    const beats=score.split(' '),slots=[];
    for(const beat of beats){
      let accent=false;
      for(const symbol of beat){
        if(symbol==='>'){accent=true;continue}
        slots.push(symbol==='-'?null:{direction:symbol.toLowerCase()==='u'?'up':'down',mute:symbol==='x'?'percussive':symbol===symbol.toLowerCase()?'palm':null,accent});accent=false;
      }
    }
    if(slots.length!==beats.length*division)throw Error('Invalid rhythm: '+id);
    return {id,name,level,division,beats:beats.length,slots};
  }
  const catalog=[
    pattern('pulse','Pulse',0,2,'D- D- D- D-'),
    pattern('rock-eighths','Rock eighths',0,2,'DD DD DD DD'),
    pattern('alternate','Down and up',0,2,'DU DU DU DU'),
    pattern('folk','Simple folk',1,2,'D- DU D- DU'),
    pattern('pop','Pop / folk',1,2,'D- DU -U DU'),
    pattern('offbeat','Offbeats',1,2,'-U -U -U -U'),
    pattern('percussive','Percussive',1,2,'DU xU DU xU'),
    pattern('palm','Palm mute',2,2,'du >DU du >DU du >DU -U >DU'),
    pattern('gallop','Sixteenth-note gallop',2,4,'D-DU D-DU D-DU D-DU'),
    // First measure is the user's D/U reference. The second rehearses muted
    // funk attacks and accents, with the same steady sixteenth-note hand.
    pattern('syncopated','Syncopated sixteenths',2,4,'D-DU DUD- D-D- D-DU xx>Dx D>UxU >DxDU Dx>DU')
  ];
  const defaults=()=>[catalog[0],catalog[3],catalog[7]];
  function practice(storage,key='fretboard-rhythm-practice-v1'){
    let data={round:0,stats:{}};
    try{
      const saved=JSON.parse(storage?.getItem(key)||'null');
      if(Number.isSafeInteger(saved?.round)&&saved.round>=0){
        data.round=saved.round;
        for(const p of catalog){const s=saved.stats?.[p.id];if(s&&[s.attempts,s.successes,s.last].every(Number.isFinite))data.stats[p.id]={attempts:Math.max(0,s.attempts),successes:Math.max(0,Math.min(s.attempts,s.successes)),last:s.last}}
      }
    }catch{}
    const save=()=>{try{storage?.setItem(key,JSON.stringify(data))}catch{}};
    return {
      choose(){
        const round=data.round++,selection=[0,1,2].map(level=>{
          const group=catalog.filter(p=>p.level===level);
          // Repeat a motif across two routines, then rotate. Occasional review
          // revisits difficulties without starving the rest of the catalogue.
          const review=round%4===3?group.filter(p=>{const s=data.stats[p.id];return s&&s.attempts>=3&&s.successes/s.attempts<.75&&round-s.last>=2}).sort((a,b)=>data.stats[a.id].last-data.stats[b.id].last)[0]:null;
          return review||group[Math.floor(round/2)%group.length];
        });save();return selection;
      },
      record(id,success){
        if(!catalog.some(p=>p.id===id))return;
        const s=data.stats[id]||(data.stats[id]={attempts:0,successes:0,last:0});
        s.attempts++;if(success)s.successes++;s.last=data.round-1;save();
      }
    };
  }
  const api={catalog,defaults,practice};
  if(typeof module==='object')module.exports=api;else root.RoutinePatterns=Object.freeze(api);
})(typeof window==='object'?window:globalThis);
