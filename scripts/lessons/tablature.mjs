import {escape as e} from '../pages/components.mjs';
export const tunings={guitar:{labels:['e','B','G','D','A','E'],midi:[64,59,55,50,45,40]},'bass-4':{labels:['G','D','A','E'],midi:[43,38,33,28]},ukulele:{labels:['A','E','C','g'],midi:[69,64,60,67]}};
const note=(string,fret,beats=1)=>({notes:[[string,fret]],beats});
const stack=(notes,beats=2,chord)=>({notes,beats,chord});
const rest=(beats=1)=>({notes:[],beats});
const phrase=positions=>positions.map(([s,f])=>note(s,f));
const am={guitar:[[3,2],[2,1],[1,0]],'bass-4':[[3,0]],ukulele:[[3,0],[2,0],[1,0]]};
export function examples(topic,instrument){
 const uke=instrument==='ukulele',bass=instrument==='bass-4';
 const arpeggio=phrase(uke?[[1,0],[3,0],[2,0],[1,0]]:bass?[[3,0],[3,3],[2,2],[1,2]]:[[5,0],[5,3],[4,2],[3,2]]);
 if(topic==='home')return [arpeggio,[...arpeggio].reverse()];
 if(topic==='notes')return uke?[phrase([[3,0],[3,2],[3,4],[3,5]]),phrase([[2,0],[2,1],[2,3],[2,5]])]:[phrase([[bass?4:6,0],[bass?4:6,1],[bass?4:6,3],[bass?4:6,5]]),phrase([[bass?3:5,0],[bass?3:5,2],[bass?3:5,3],[bass?3:5,5]])];
 if(topic==='penta')return uke?[phrase([[1,0],[3,0],[3,2],[2,0]]),phrase([[2,3],[2,0],[3,2],[1,0]])]:[phrase([[bass?4:6,5],[bass?4:6,8],[bass?3:5,5],[bass?3:5,7]]),phrase([[bass?2:4,5],[bass?3:5,7],[bass?3:5,5],[bass?4:6,5]])];
 if(topic==='triads'){
  if(bass)return [arpeggio,phrase([[3,0],[3,4],[2,2],[1,2]])];
  const major=uke?[[3,1],[2,0],[1,0]]:[[3,2],[2,2],[1,0]];
  return [[stack(am[instrument],2,'Am'),stack(major,2,'A')],arpeggio];
 }
 if(topic==='chords'){
  if(bass)return [phrase([[4,3],[3,2],[3,5],[2,5]]),phrase([[4,3],[2,3],[3,5],[4,3]])];
  const open=uke?[[4,0],[3,2],[2,3],[1,2]]:[[6,3],[5,2],[4,0],[3,0],[2,0],[1,3]];
  const closed=uke?[[4,4],[3,2],[2,3],[1,2]]:[[6,3],[5,5],[4,5],[3,4],[2,3],[1,3]];
  return [[stack(open,2,'G'),stack(open)],[stack(closed,2,'G'),stack(closed)]];
 }
 if(topic==='routine')return [[stack(am[instrument],1),rest(),stack(am[instrument],1),rest()],[stack(am[instrument],.5),stack(am[instrument],.5),rest(),stack(am[instrument],1),rest()]];
 if(topic==='tabs')return [[note(1,0),note(1,2),note(1,3),rest()],[note(1,0,.5),note(1,2,.5),note(1,3),note(1,0,2)]];
 throw Error('Unknown tablature topic: '+topic);
}
export function renderTab(topic,instrument,ui){
 const tuning=tunings[instrument],bars=examples(topic,instrument),pitchNames=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
 const pitch=([s,f])=>pitchNames[(tuning.midi[s-1]+f)%12];
 const top=68,gap=24,bottom=top+(tuning.labels.length-1)*gap,height=bottom+48;
 const renderBar=(bar,index)=>{
  let cursor=0;
  const events=bar.map(event=>{
   const x=72+cursor*64,onset=cursor;cursor+=event.beats;
   const y=event.notes.length?top+(event.notes[0][0]-1)*gap:top+gap;
   const notation=event.notes.length?event.notes.map(([s,f])=>`<rect x="${x-12}" y="${top+(s-1)*gap-10}" width="24" height="20" rx="4" fill="#071629"/><text x="${x}" y="${top+(s-1)*gap+6}" class="tab-fret">${f}</text>`).join(''):`<text x="${x}" y="${y+5}" class="tab-rest">R</text>`;
   return `<g data-tab-beat="${onset}" data-duration="${event.beats}">${event.chord?`<text x="${x}" y="47" class="tab-chord">${e(event.chord)}</text>`:''}${notation}<text x="${x}" y="${bottom+28}" class="tab-duration">${event.beats===.5?'½':event.beats}</text></g>`;
  }).join('');
  return `<figure class="tab-bar"><figcaption>${e(ui.bar)} ${index+1} · 4/4</figcaption><svg class="tab-diagram" viewBox="0 0 330 ${height}" role="img" aria-label="${e(ui.example+' · '+ui.bar+' '+(index+1))}" xmlns="http://www.w3.org/2000/svg"><title>${e(ui.example+' · '+ui.bar+' '+(index+1))}</title>${tuning.labels.map((label,i)=>`<text x="15" y="${top+i*gap+5}" class="tab-string">${label}</text><line x1="38" x2="318" y1="${top+i*gap}" y2="${top+i*gap}" class="tab-line"/>`).join('')}<line x1="38" x2="38" y1="${top}" y2="${bottom}" class="tab-line"/><line x1="318" x2="318" y1="${top}" y2="${bottom}" class="tab-line"/>${[1,2,3,4].map((b,i)=>`<text x="${72+i*64}" y="28" class="tab-beat">${b}</text>`).join('')}${events}</svg></figure>`;
 };
 const transcript=bars.map((bar,i)=>`<li>${e(ui.bar)} ${i+1}<ol>${bar.map(event=>`<li>${event.notes.length?event.notes.map(([s,f])=>`${e(ui.string)} ${s} (${tuning.labels[s-1]}), ${e(ui.fret)} ${f}, ${e(pitch([s,f]))}`).join(' + '):e(ui.rest)} · ${event.beats===.5?'½':event.beats} ${e(ui.beats)}</li>`).join('')}</ol></li>`).join('');
 return `<div class="tab-example"><p class="tab-reading">${e(ui.tabKey)}</p><div class="tab-grid">${bars.map(renderBar).join('')}</div><details class="tab-transcript"><summary>${e(ui.textVersion)}</summary><ol>${transcript}</ol></details></div>`;
}
