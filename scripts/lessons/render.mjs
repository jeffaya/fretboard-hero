import {createRequire} from 'node:module';
import {escape as e} from '../pages/components.mjs';
const require=createRequire(import.meta.url);
const diagrams=require('../../web/core/lesson-diagrams.js'),chords=require('../../web/core/chord-library.js');
export function illustration(topic,instrument,text){
 const {ui}=text;
 if(topic==='chords')return chordExplorer(instrument,text);
 if(topic==='routine')return diagrams.rhythm(instrument==='bass-4'?{...ui,rhythmTip:text.bass[2]}:ui);
 if(topic==='triads'){
  const positions={guitar:[[-1,-1,-1,2,1,0],[-1,-1,-1,5,5,5],[-1,-1,-1,9,10,8]],'bass-4':[[-1,12,10,9],[-1,3,2,2],[-1,7,7,5]],ukulele:[[-1,9,8,7],[-1,0,0,0],[-1,4,5,3]]};
  return `<div class="diagram-grid triad-grid">${positions[instrument].map(frets=>diagrams.chord({instrument,root:9,quality:'minor',voicing:{frets,fingers:frets.map(()=>0),kind:'compact'},ui,showNotes:true})).join('')}</div><p class="diagram-key">${e(ui.legend)}</p>`;
 }
 if(topic==='penta')return diagrams.fretboard({instrument,root:9,intervals:[0,3,5,7,10],from:instrument==='ukulele'?0:5,to:instrument==='ukulele'?3:8,ui,title:text.nav[2]+' · A C D E G'});
 return `<div class="note-map">${[[0,5],[6,12]].map(([from,to])=>diagrams.fretboard({instrument,root:9,from,to,ui,title:text.nav[1]+' · A · '+ui.fret+' '+from+'–'+to})).join('')}</div>`;
}
function chordExplorer(instrument,text){
 const {ui}=text,qualityNames=['major','minor','7','m7','maj7','6','m6','sus2','sus4','dim','aug','add9'];
 return `<section class="chord-explorer" aria-label="${e(text.nav[4])}">
 <fieldset class="root-picker"><legend>${e(ui.root)}</legend><div class="root-options">${[9,10,11,0,1,2,3,4,5,6,7,8].map(root=>`<button type="button" data-chord-root="${root}" aria-pressed="${root===7}">${e(({1:'C♯ / D♭',3:'D♯ / E♭',6:'F♯ / G♭',8:'G♯ / A♭',10:'A♯ / B♭'})[root]||chords.roots[root])}</button>`).join('')}</div></fieldset>
 <label class="quality-picker" for="chord-quality">${e(ui.quality)}<select id="chord-quality">${qualityNames.map(q=>`<option value="${q}"${q==='major'?' selected':''}>${e(ui[q])}${chords.qualities[q].suffix?' · '+chords.qualities[q].suffix:''}</option>`).join('')}</select></label>
 <p id="chord-summary" class="chord-summary" role="status" aria-live="polite" aria-atomic="true">G · ${e(ui.major)} — ${e(ui.tones)}: G · B · D</p>
 <p>${e(instrument==='bass-4'?ui.oneAtATime:ui.fingers)}</p>
 <div id="chord-positions" class="diagram-grid${instrument==='bass-4'?' bass-arpeggios':''}">${diagrams.chordCards({instrument,root:7,quality:'major',ui})}</div>
 <noscript><p>${e(ui.noScript)}</p></noscript>
 </section>`;
}
export function lessonBody(topic,instrument,text){
 const lesson=text[topic],ui=text.ui,index=['guitar','bass-4','ukulele'].indexOf(instrument);
 let explanation=lesson[2],exercise=lesson[3],tip=lesson[4];
 if(topic==='chords'&&instrument==='bass-4'){explanation+=' '+text.bass[0];exercise=text.bass[1];tip=text.bass[2];}
 if(topic==='chords'&&instrument==='ukulele')exercise=text.uke;
 if(topic==='routine'&&instrument==='bass-4'){explanation=text.bass[2];tip+=' '+text.bass[1];}
 const section=(heading,body,extra='')=>`<section class="content-section"><h2>${e(heading)}</h2><p>${e(body)}</p>${extra}</section>`;
 return `<article class="lesson-body">
 ${section(ui.understand,explanation,`<p class="tuning-note">${e(text.tuning[index])}</p>`)}
 ${illustration(topic,instrument,text)}
 ${section(ui.play,exercise,topic==='chords'?diagrams.rhythm(instrument==='bass-4'?{...ui,rhythmTip:text.bass[2]}:ui):'')}
 ${section(ui.listen,tip)}
 </article>`;
}
