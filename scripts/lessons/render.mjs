import {renderTab} from './tablature.mjs';
import {renderTabOrientation} from './tab-orientation.mjs';
import {createRequire} from 'node:module';
import {escape as e} from '../pages/components.mjs';
const require=createRequire(import.meta.url);
const diagrams=require('../../web/core/lesson-diagrams.js');
export function illustration(topic,instrument,text){
 const {ui,notation}=text;
 if(topic==='tabs')return renderTabOrientation(instrument,text);
 if(topic==='chords')return chordExplorer(instrument,text);
 if(topic==='routine')return diagrams.rhythm(instrument==='bass-4'?{...ui,rhythmTip:text.bass[2]}:ui);
 if(topic==='triads'){
  const positions={guitar:[[-1,-1,-1,2,1,0],[-1,-1,-1,5,5,5],[-1,-1,-1,9,10,8]],'bass-4':[[-1,12,10,9],[-1,3,2,2],[-1,7,7,5]],ukulele:[[-1,9,8,7],[-1,0,0,0],[-1,4,5,3]]};
  return `<div class="diagram-grid triad-grid">${positions[instrument].map(frets=>diagrams.chord({instrument,root:9,quality:'minor',voicing:{frets,fingers:frets.map(()=>0),kind:'compact'},ui,notation,showNotes:true})).join('')}</div><p class="diagram-key">${e(ui.legend)}</p>`;
 }
 if(topic==='penta')return diagrams.fretboard({instrument,root:9,intervals:[0,3,5,7,10],from:instrument==='ukulele'?0:5,to:instrument==='ukulele'?3:8,ui,notation,title:text.nav[2]+' · '+['A','C','D','E','G'].map(note=>notation[note]).join(' ')});
 return `<div class="note-map">${[[0,5],[6,12]].map(([from,to])=>diagrams.fretboard({instrument,root:9,from,to,ui,notation,title:text.nav[1]+' · '+notation.A+' · '+ui.fret+' '+from+'–'+to})).join('')}</div>`;
}
function chordExplorer(instrument,text){
 const {ui,notation}=text;
 const spellings={1:['C♯','D♭'],3:['D♯','E♭'],6:['F♯','G♭'],8:['G♯','A♭'],10:['A♯','B♭']};
 const rootLabel=root=>spellings[root]?.map(note=>notation[note]).join(' / ')||diagrams.rootName(root,notation);
 return `<section class="chord-explorer" aria-label="${e(text.nav[4])}">
 <fieldset class="root-picker"><legend>${e(ui.root)}</legend><div class="root-options">${[9,10,11,0,1,2,3,4,5,6,7,8].map(root=>`<button type="button" data-chord-root="${root}" aria-pressed="${root===7}">${e(rootLabel(root))}</button>`).join('')}</div></fieldset>
 <p id="chord-summary" class="chord-summary" role="status" aria-live="polite" aria-atomic="true">${e(ui.root)}: ${e(diagrams.rootName(7,notation))}</p>
 <p>${e(instrument==='bass-4'?ui.oneAtATime:ui.fingers)}</p>
 <div id="chord-positions">${diagrams.chordFamilies({instrument,root:7,ui,notation})}</div>
 <noscript><p>${e(ui.noScript)}</p></noscript>
 </section>`;
}
export function lessonBody(topic,instrument,text){
 const lesson=text[topic],ui=text.ui,more=text.course[topic],pedagogy=text.pedagogy,index=['guitar','bass-4','ukulele'].indexOf(instrument);
 let explanation=lesson[2],exercise=lesson[3],tip=lesson[4];
 if(topic==='chords'&&instrument==='bass-4'){explanation+=' '+text.bass[0];exercise=text.bass[1];tip=text.bass[2];}
 if(topic==='chords'&&instrument==='ukulele')exercise=text.uke;
 if(topic==='routine'&&instrument==='bass-4'){explanation=text.bass[2];tip+=' '+text.bass[1];}
 const section=(heading,body,extra='')=>`<section class="content-section"><h2>${e(heading)}</h2><p>${e(body)}</p>${extra}</section>`;
 return `<article class="lesson-body">
 ${section(ui.understand,explanation,`<p class="tuning-note">${e(text.tuning[index])}</p>`)}
 ${illustration(topic,instrument,text)}
 ${section(pedagogy.deeper,more[0])}
 ${section(ui.play,exercise,`<p>${e(more[1])}</p><p class="tuning-note">${e(text.coach[index])}</p><h3>${e(pedagogy.example)}</h3>${renderTab(topic,instrument,{...ui,...pedagogy},text.notation)}`)}
 ${topic==='tabs'?`<section class="content-section"><h2>${e(pedagogy.symbols)}</h2><table class="symbol-table"><thead><tr><th scope="col">${e(pedagogy.symbol)}</th><th scope="col">${e(pedagogy.action)}</th></tr></thead><tbody>${text.symbols.map(([symbol,action])=>`<tr><th scope="row"><code>${e(symbol)}</code></th><td>${e(action)}</td></tr>`).join('')}</tbody></table></section>`:''}
 ${section(pedagogy.avoid,more[2])}
 ${section(ui.listen,tip)}
 ${section(pedagogy.checkpoint,more[3])}
 </article>`.replace(/^[ \t]+$/gm,'');
}
