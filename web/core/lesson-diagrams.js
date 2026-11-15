(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./chord-library.js'):root.FretboardChords);if(typeof module==='object'&&module.exports)module.exports=api;else root.FretboardLessonDiagrams=api;})(typeof window==='undefined'?globalThis:window,(chords)=>{
 'use strict';
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pitch=midi=>['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][midi%12];
 const txt=(x,y,value,size=17)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="#e6e9ff" font-size="${size}">${esc(value)}</text>`;
 function fretboard({instrument,root=9,intervals=[0],from=0,to=12,ui,title,noteNames}){
   const tuning=chords.tunings[instrument],count=to-from+1,w=68+count*52,h=72+tuning.length*42;
   const allowed=new Set(intervals.map(n=>(root+n)%12)),points=[];
   let drawing='';
   for(let f=from;f<=to;f++){const x=68+(f-from)*52;drawing+=txt(x,25,f)+`<path d="M${x+26} 40V${h-32}" stroke="#62657b" stroke-width="2"/>`;}
   for(let s=0;s<tuning.length;s++){
    const y=58+(tuning.length-1-s)*42;drawing+=txt(24,y+6,pitch(tuning[s]))+`<path d="M42 ${y}H${w-12}" stroke="#a9b2c5" stroke-width="${1+(tuning.length-1-s)*.35}"/>`;
    for(let f=from;f<=to;f++)if(allowed.has((tuning[s]+f)%12)){
     const x=68+(f-from)*52,note=noteNames?.[intervals.findIndex(i=>(root+i)%12===(tuning[s]+f)%12)]||pitch(tuning[s]+f),isRoot=(tuning[s]+f)%12===root;
     drawing+=`<circle cx="${x}" cy="${y}" r="18" fill="${isRoot?'#ff64cd':'#e6e9ff'}"/><text x="${x}" y="${y+6}" text-anchor="middle" fill="#10101c" font-size="16" font-weight="800">${esc(note)}</text>`;
     points.push(`${pitch(tuning[s])} (${tuning.length-s}): ${f} = ${note}`);
    }
   }
   return `<figure class="diagram neck-diagram"><div class="diagram-scroll" tabindex="0" role="group" aria-label="${esc(title)}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><desc>${esc(ui.legend+' '+points.join('; '))}</desc><rect x="40" y="38" width="${w-42}" height="${h-66}" rx="10" fill="#191827"/>${drawing}</svg></div><figcaption>${esc(ui.legend)}</figcaption></figure>`;
 }
 function chord({instrument,root,quality,voicing,ui,showNotes=false}){
   const tuning=chords.tunings[instrument],{frets,fingers,barres=[]}=voicing;
   const positive=frets.filter(f=>f>0),min=Math.min(...positive),max=Math.max(1,...positive),start=max<=5?1:min;
   const rows=Math.max(4,max-start+1),h=112+rows*38,n=tuning.length,dx=n===6?30:42,x0=(240-dx*(n-1))/2;
   const name=chords.roots[root]+chords.qualities[quality].suffix,notes=chords.notes(root,quality);
   const noteFor=pc=>notes[chords.qualities[quality].intervals.findIndex(i=>(root+i)%12===pc)]||pitch(pc);
   const summary=frets.map((f,i)=>`${ui.string} ${n-i} (${pitch(tuning[i])}): ${f<0?'×':f===0?'O':ui.fret+' '+f} ${f<0?'':noteFor((tuning[i]+f)%12)}`).join('; ');
   let drawing='';
   for(let row=0;row<=rows;row++)drawing+=`<path d="M${x0} ${60+row*38}H${x0+dx*(n-1)}" stroke="#939bb2" stroke-width="${row===0&&start===1?5:1.5}"/>`;
   for(let i=0;i<n;i++){const x=x0+i*dx;drawing+=`<path d="M${x} 60V${60+rows*38}" stroke="#939bb2" stroke-width="1.5"/>`+txt(x,h-22,pitch(tuning[i]));}
   for(let row=0;row<rows;row++)drawing+=txt(12,84+row*38,start+row,12);
   for(const b of barres)drawing+=`<path d="M${x0+b.from*dx} ${79+(b.fret-start)*38}H${x0+b.to*dx}" stroke="#77e4fa" stroke-width="22" stroke-linecap="round"/>`;
   frets.forEach((f,i)=>{
    const x=x0+i*dx;
    if(f<=0){
     if(f===0&&showNotes){const color=tuning[i]%12===root?'#ff64cd':'#e6e9ff';drawing+=`<circle cx="${x}" cy="38" r="12" fill="${color}"/><text x="${x}" y="43" text-anchor="middle" fill="#10101c" font-size="12" font-weight="800">${esc(noteFor(tuning[i]%12))}</text>`;}
     else drawing+=txt(x,43,f===0?'O':'×');
     return;
    }
    const y=79+(f-start)*38,isRoot=(tuning[i]+f)%12===root;
    drawing+=`<circle cx="${x}" cy="${y}" r="12" fill="${isRoot?'#ff64cd':'#e6e9ff'}"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="#10101c" font-size="${showNotes?12:14}" font-weight="800">${esc(showNotes?noteFor((tuning[i]+f)%12):fingers[i])}</text>`;
   });
   const omitsFifth=chords.qualities[quality].intervals.includes(7)&&!frets.some((f,i)=>f>=0&&(tuning[i]+f-root+120)%12===7);
   const label=ui[voicing.kind||'compact']+(voicing.shape?' · '+ui.shape+' '+voicing.shape:'');
   return `<figure class="diagram chord-diagram"><h3>${esc(name)}</h3><p class="chord-kind">${esc(label)}</p><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 ${h}" role="img" aria-label="${esc(name+' · '+label+' · '+summary)}"><title>${esc(name+' · '+label)}</title><desc>${esc(summary)}</desc>${drawing}</svg><figcaption><span class="fret-code">${frets.map(f=>f<0?'×':f).join(' · ')}</span><br>${frets.map((f,i)=>f<0?'×':esc(noteFor((tuning[i]+f)%12))).join(' · ')}${omitsFifth?'<br><small>'+esc(ui.omittedFifth)+'</small>':''}</figcaption></figure>`;
 }
 function chordCards({instrument,root,quality,ui}){
   if(instrument==='bass-4')return [0,5].map((from,i)=>fretboard({instrument,root,intervals:chords.qualities[quality].intervals,from,to:from+4,ui,noteNames:chords.notes(root,quality),title:ui.arpeggio+' '+(i+1)+' · '+chords.roots[root]+chords.qualities[quality].suffix})).join('');
   return chords.voicings(instrument,root,quality).map(voicing=>chord({instrument,root,quality,voicing,ui})).join('');
 }
 function chordFamilies({instrument,root,ui}){
   return ['major','minor','7','m7','maj7','6','m6','sus2','sus4','dim','aug','add9'].map(quality=>{
    const name=chords.roots[root]+chords.qualities[quality].suffix;
    return `<section class="chord-family" data-chord-family="${quality}" aria-labelledby="chord-${quality}"><h2 id="chord-${quality}">${esc(name+' · '+ui[quality])}</h2><p class="chord-tones">${esc(ui.tones+': '+chords.notes(root,quality).join(' · '))}</p><div class="diagram-grid${instrument==='bass-4'?' bass-arpeggios':''}">${chordCards({instrument,root,quality,ui})}</div></section>`;
   }).join('');
 }
 function rhythm(ui){
   const strokes=['↓','—','↓','↑','—','↑','↓','↑'],labels=['1','&','2','&','3','&','4','&'];
   return `<figure class="diagram rhythm-diagram"><div class="rhythm-grid">${strokes.map((s,i)=>`<div><span>${labels[i]}</span><strong aria-label="${esc(s==='↓'?ui.down:s==='↑'?ui.up:ui.rest)}">${s}</strong></div>`).join('')}</div><figcaption>${esc(ui.rhythmTip)}</figcaption></figure>`;
 }
 return Object.freeze({fretboard,chord,chordCards,chordFamilies,rhythm});
});
