const {test}=require('node:test'),assert=require('node:assert/strict');
const routes=require('../core/guide-routes.js');
test('Every translated lesson has substantive teaching, three references and complete notation guidance',async()=>{
 const {curriculum}=await import('../../scripts/lessons/curriculum.mjs'),{sources}=await import('../../scripts/lessons/sources.mjs');
 assert.deepEqual(Object.keys(curriculum).sort(),[...routes.languages].sort());
 const {orientationCopy}=await import('../../scripts/lessons/tab-orientation.mjs');
 assert.deepEqual(Object.keys(orientationCopy).sort(),[...routes.languages].sort());
 for(const locale of routes.languages){const c=curriculum[locale];
  const orientation=orientationCopy[locale];assert.equal(orientation.steps.length,3);assert.equal(orientation.captions.length,3);
  for(const value of Object.values(orientation).flat())assert.ok(value.length>0);
  if(locale!=='en')for(const [key,value]of Object.entries(orientation))assert.notDeepEqual(value,orientationCopy.en[key]);
  assert.deepEqual(Object.keys(c.ui).sort(),Object.keys(curriculum.en.ui).sort());assert.equal(c.coach.length,3);assert.equal(c.tabs.length,5);assert.equal(c.symbols.length,10);
  for(const topic of routes.topics){assert.equal(c.course[topic].length,4);for(const [i,p] of c.course[topic].entries()){assert.ok(p.length>25);if(locale!=='en')assert.notEqual(p,curriculum.en.course[topic][i]);}}
  if(locale!=='en'){c.tabs.forEach((p,i)=>assert.notEqual(p,curriculum.en.tabs[i]));c.coach.forEach((p,i)=>assert.notEqual(p,curriculum.en.coach[i]));c.symbols.forEach((p,i)=>assert.notEqual(p[1],curriculum.en.symbols[i][1]));}
 }
 for(const instrument of routes.instruments)for(const topic of routes.topics){const refs=sources[instrument+'.'+topic];assert.equal(refs.length,3);assert.equal(new Set(refs.map(s=>s.url)).size,3);refs.forEach(s=>{assert.equal(new URL(s.url).protocol,'https:');assert.ok(s.title.length>5)})}
});
test('Original tablatures have playable strings, valid fret numbers and exactly four beats per bar',async()=>{
 const {examples,tunings}=await import('../../scripts/lessons/tablature.mjs');
 for(const instrument of routes.instruments)for(const topic of routes.topics){const bars=examples(topic,instrument);assert.equal(bars.length,2);
  for(const bar of bars){assert.equal(bar.reduce((n,event)=>n+event.beats,0),4);
   for(const event of bar){assert.ok([.5,1,2].includes(event.beats));assert.equal(new Set(event.notes.map(([s])=>s)).size,event.notes.length);
    for(const [string,fret]of event.notes){assert.ok(Number.isInteger(string)&&string>=1&&string<=tunings[instrument].midi.length);assert.ok(Number.isInteger(fret)&&fret>=0&&fret<=12);}
   }
  }
 }
});
test('Pentatonic phrases play the advertised pitches and high-G is not treated as the lowest string',async()=>{
 const {examples,tunings}=await import('../../scripts/lessons/tablature.mjs');
 for(const instrument of routes.instruments){const pitches=examples('penta',instrument).flat().flatMap(event=>event.notes.map(([s,f])=>(tunings[instrument].midi[s-1]+f)%12));assert.deepEqual(pitches,[9,0,2,4,7,4,2,9]);}
 assert.ok(tunings.ukulele.midi[3]>tunings.ukulele.midi[2]);
});
test('Worked triads change only the third and G voicings contain only chord tones',async()=>{
 const {examples,tunings}=await import('../../scripts/lessons/tablature.mjs');
 for(const instrument of routes.instruments){const pitch=events=>[...new Set(events.flatMap(e=>e.notes.map(([s,f])=>(tunings[instrument].midi[s-1]+f)%12)))].sort((a,b)=>a-b);
  const triads=examples('triads',instrument);assert.deepEqual(instrument==='bass-4'?pitch(triads[0]):pitch([triads[0][0]]),[0,4,9]);assert.deepEqual(instrument==='bass-4'?pitch(triads[1]):pitch([triads[0][1]]),[1,4,9]);
  const chords=examples('chords',instrument);assert.deepEqual(pitch(chords[0]),[2,7,11]);if(instrument!=='bass-4')assert.deepEqual(pitch(chords[1]),[2,7,11]);else assert.deepEqual(pitch(chords[1]),[2,5,7]);
 }
});

test('Printed diagrams, tabs and accessible descriptions use the route’s note names',async()=>{
 const {lessonCopy}=await import('../../scripts/lessons/translations.mjs');
 const {illustration}=await import('../../scripts/lessons/render.mjs');
 const {renderTab,tunings}=await import('../../scripts/lessons/tablature.mjs');
 for(const locale of routes.languages){
  const text=lessonCopy(locale),catalog=require(`../locales/${locale}.json`);
  const note=letter=>catalog['Note name '+letter.toUpperCase()];
  for(const instrument of routes.instruments){
   const chords=illustration('chords',instrument,text);
   assert.ok(chords.includes('id="chord-major">'+note('G')+' · '+text.ui.major));
   assert.ok(chords.includes(text.ui.tones+': '+['G','B','D'].map(note).join(' · ')));
   const triads=illustration('triads',instrument,text);
   assert.ok(triads.includes('<title>'+note('A')+'m · '));
   assert.ok(triads.includes('<desc>'+text.ui.string+' '));
   const scale=illustration('penta',instrument,text);
   assert.ok(scale.includes('<title>'+text.nav[2]+' · '+['A','C','D','E','G'].map(note).join(' ')+'</title>'));
   const orientation=illustration('tabs',instrument,text);
   const tab=renderTab('triads',instrument,{...text.ui,...text.pedagogy},text.notation);
   for(const label of tunings[instrument].labels){
    const localized=label===label.toLowerCase()?note(label).toLocaleLowerCase(locale):note(label);
    assert.ok(tab.includes('class="tab-string">'+localized+'</text>'));
    for(const drawing of orientation.matchAll(/<svg\b[^>]*>([\s\S]*?)<\/svg>/g))assert.ok(drawing[1].includes('>'+localized+'</text>'));
   }
   if(instrument!=='bass-4')assert.ok(tab.includes('class="tab-chord">'+note('A')+'m</text>'));
  }
 }
});
