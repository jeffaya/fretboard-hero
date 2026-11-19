(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FretboardGuideRoutes=api;})(typeof window==='undefined'?globalThis:window,()=>{
  'use strict';
  const languages=['en','fr','es','de','it','pt-BR','hi','id','ja','ko','zh-CN','ar','bn'];
  const instruments=['guitar','bass-4','ukulele'];
  const topics=['home','notes','penta','triads','chords','routine','tabs'];
  function route(locale,instrument='guitar',topic='home'){
    if(!languages.includes(locale))locale='en';
    if(!instruments.includes(instrument))instrument='guitar';
    if(!topics.includes(topic))topic='home';
    const family=instrument==='bass-4'?'bass':instrument;
    const name=locale==='fr'?({guitar:'guitare',bass:'basse',ukulele:'ukulele'}[family]):family;
    const slugs=locale==='fr'?{notes:'notes-du-manche',penta:'pentatonique',triads:'triades',chords:'accords',routine:'routine',tabs:'lire-les-tablatures'}:{notes:'fretboard-notes',penta:'pentatonic-scales',triads:'triads',chords:'chords',routine:'daily-routine',tabs:'reading-tablature'};
    return `/${locale}/${name}/${topic==='home'?'':slugs[topic]+'/'}`;
  }
  return Object.freeze({languages,instruments,topics,route});
});
