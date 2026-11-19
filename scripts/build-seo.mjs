import fs from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {languages as legacy} from './seo/content.mjs';
import {copy,lessonCopy} from './lessons/translations.mjs';
import {lessonBody} from './lessons/render.mjs';
import {escape,renderPage,renderSection,renderRelated} from './pages/components.mjs';
import {appRoutes} from '../web/core/routes.js';
import {appAlternates,ogLocales} from '../web/core/route-seo.js';
import {tunings} from './lessons/tablature.mjs';
import {renderPrivacy} from './pages/privacy.mjs';
import {documentStyles,documentScripts,renderDocumentFooter} from './pages/document-shell.mjs';
const require=createRequire(import.meta.url),routes=require('../web/core/guide-routes.js');
const root=fileURLToPath(new URL('../',import.meta.url)),origin='https://fretboard-hero.com',publicPagesModified='2026-11-19';
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const productContext={window:{}};
for(const key of ['guitar','bass','ukulele'])vm.runInNewContext(readFileSync(new URL(`../web/products/${key}-fretboard-hero.js`,import.meta.url),'utf8'),productContext);
const products=productContext.window.FRETBOARD_PRODUCTS;
const family=instrument=>instrument==='bass-4'?'bass':instrument;
const exercise=(locale,instrument,topic)=>{
 const destination={notes:{screen:'fretmap'},penta:{screen:'learn',mode:'penta'},triads:{screen:'learn',mode:'triad'},chords:{screen:'learn',mode:instrument==='bass-4'?'arpeggio':'chord'},routine:{screen:'routine'}}[topic]||{};
 return '/?'+new URLSearchParams({instrument,lang:locale,...destination});
};
function documentAlternates(locales,routeFor){
 const links=locales.map(lang=>({lang,href:origin+routeFor(lang)}));
 return [...links,{lang:'x-default',href:origin+routeFor('en')}];
}
function render(locale,instrument,topic,aboutPage){
 const text=lessonCopy(locale),isAbout=!!aboutPage,index=routes.instruments.indexOf(instrument),name=text.instruments[index];
 const route=isAbout?legacy[locale].about:routes.route(locale,instrument,topic),url=origin+route;
 const title=isAbout?aboutPage.title:`${text.nav[routes.topics.indexOf(topic)]} · ${name}`;
 const heading=isAbout?aboutPage.heading:text[topic][0],intro=isAbout?aboutPage.intro:text[topic][1];
 const tuning=tunings[instrument].labels.slice().reverse().map(note=>text.notation[note]).join('–');
 let summary=intro;
 if(topic==='chords'&&instrument==='bass-4')summary=text.bass[0];
 if(topic==='chords'&&instrument==='ukulele')summary=text.uke;
 if(topic==='routine'&&instrument==='bass-4')summary=text.bass[2];
 const description=isAbout?intro:`${name} (${tuning}) · ${summary}`;
 const pageLanguages=(isAbout?Object.keys(legacy):routes.languages).map(lang=>({locale:lang,label:copy[lang].label,href:isAbout?legacy[lang].about:routes.route(lang,instrument,topic)}));
 const product=products[family(instrument)],brand={name:product.branding.name,viewport:product.assets.heroLogoViewport};
 const appURL=exercise(locale,instrument,topic),home={href:exercise(locale,instrument,'home'),label:text.ui.back};
 const image=origin+`/assets/instruments/${family(instrument)}/og.jpg`;
 const graph={'@context':'https://schema.org','@graph':[
  {'@type':isAbout?'AboutPage':topic==='home'?'WebPage':'LearningResource','@id':url+'#page',url,name:title,headline:heading,description,inLanguage:locale,dateModified:publicPagesModified,image,...(!isAbout&&topic!=='home'?{learningResourceType:'lesson'}:{}),isAccessibleForFree:true},
  {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Fretboard Hero',item:origin+'/'},{'@type':'ListItem',position:2,name:isAbout?aboutPage.label:text.nav[0]+' · '+name,item:isAbout?url:origin+routes.route(locale,instrument)},...(!isAbout&&topic!=='home'?[{'@type':'ListItem',position:3,name:title,item:url}]:[])]}
 ]};
 const head=`<title>${escape(title)} | Fretboard Hero</title>
<meta name="description" content="${escape(description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${url}">
${pageLanguages.map(lang=>`<link rel="alternate" hreflang="${lang.locale}" href="${origin+lang.href}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${origin+pageLanguages.find(l=>l.locale==='en').href}">
<meta property="og:type" content="${topic==='home'?'website':'article'}">
<meta property="og:site_name" content="${escape(brand.name)}">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${ogLocales[locale]}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1024"><meta property="og:image:height" content="500">
<meta property="og:image:alt" content="${escape(brand.name)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${image}">
<link rel="icon" href="/assets/instruments/${family(instrument)}/favicon.ico">
<script type="application/ld+json">${json(graph)}</script>`;
 const related=renderRelated(text.ui.choose,routes.topics.filter(t=>t!=='home'&&t!==topic).map(t=>({label:text.nav[routes.topics.indexOf(t)],description:text[t][1],href:routes.route(locale,instrument,t)})));
 const body=`<section class="page-hero"><p class="eyebrow">${escape(isAbout?aboutPage.label:text.nav[routes.topics.indexOf(topic)])}</p><h1>${escape(heading)}</h1><p class="page-intro">${escape(intro)}</p><div class="actions"><a class="button ui-primary" data-exercise-link href="${escape(appURL)}">${escape(text.ui.try)} <span aria-hidden="true">↗</span></a></div></section>
${topic==='home'&&!isAbout?related:''}
${isAbout?`<article class="lesson-body">${aboutPage.sections.map(renderSection).join('\n')}</article>`:lessonBody(topic,instrument,text)}
${topic!=='home'&&!isAbout?related:''}`;
 const nav=`<nav class="page-nav" aria-label="${escape(text.nav[0])}">${routes.topics.map((t,i)=>`<a href="${routes.route(locale,instrument,t)}"${!isAbout&&t===topic?' aria-current="page"':''}>${escape(text.nav[i])}</a>`).join('')}</nav>`;
 return renderPage({locale,head,body,skipLabel:text.ui.skip,header:{home,branding:brand},navigation:nav,
  styles:documentStyles,
  scripts:[...documentScripts,'/core/chord-library.js?v=10.53.0','/core/lesson-diagrams.js?v=10.57.0','/guide.js?v=10.57.0'],
  footerHTML:renderDocumentFooter({locale,instrument,languages:pageLanguages,ui:text.ui,configId:'guideConfig',notation:topic==='chords'?text.notation:undefined})
 });
}
export function generatedFiles(){
 const files=new Map([['web/privacy.html',renderPrivacy()]]);
 const summaries = {
  home: ['Learn the fretboard','Learn notes, scales, triads and chords. Build a daily routine and test your fretboard knowledge.'],
  tuner: ['Tuner','Tune your instrument'], routine: ['Daily Routine','One key · Five guided exercises'],
  learn: ['Learn','Practice on the interactive fretboard'], quiz: ['Quiz','Test your knowledge'],
  fretmap: ['Fretboard Map','Explore the neck'], circle: ['Circle of Fifths','Visualize & practice']
 };
 const metadata = {};
 for(const locale of routes.languages){
  const catalog=require(`../web/locales/${locale}.json`);
  metadata[locale]=Object.fromEntries(Object.entries(summaries).map(([screen,keys])=>[screen,keys.map(key=>catalog[key])]));
 }
 files.set('web/core/route-locales.js','// Generated by scripts/build-seo.mjs from the application catalogs.\nexport const routeLocales = '+JSON.stringify(metadata,null,2)+';\n');
 const entries=[{url:origin+'/privacy'}];
 for(const screen of Object.keys(appRoutes))for(const instrument of routes.instruments){
  const alternates=appAlternates(screen,instrument);
  for(const {href} of alternates)entries.push({url:href,alternates});
 }
 for(const locale of routes.languages)for(const instrument of routes.instruments)for(const topic of routes.topics){
  const route=routes.route(locale,instrument,topic);
  files.set('web'+route+'index.html',render(locale,instrument,topic));
  entries.push({url:origin+route,lastmod:publicPagesModified,alternates:documentAlternates(routes.languages,lang=>routes.route(lang,instrument,topic))});
 }
 for(const locale of Object.keys(legacy)){
  files.set('web'+legacy[locale].about+'index.html',render(locale,'guitar','home',legacy[locale].pages.find(p=>p.id==='about')));
  entries.push({url:origin+legacy[locale].about,lastmod:publicPagesModified,alternates:documentAlternates(Object.keys(legacy),lang=>legacy[lang].about)});
 }
 files.set('web/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(({url,lastmod,alternates=[]})=>{
  const links=alternates.map(a=>`<xhtml:link rel="alternate" hreflang="${a.lang}" href="${escape(a.href)}"/>`).join('');
  return `  <url><loc>${escape(url)}</loc>${lastmod?`<lastmod>${lastmod}</lastmod>`:''}${links}</url>`;
 }).join('\n')}
</urlset>\n`);
 return files;
}
async function main(){
 const check=process.argv.includes('--check'),files=generatedFiles(),stale=[];
 for(const [relative,content] of files){const filename=path.join(root,relative);
  if(check){if(await fs.readFile(filename,'utf8').catch(()=>null)!==content)stale.push(relative);}
  else{await fs.mkdir(path.dirname(filename),{recursive:true});await fs.writeFile(filename,content);}
 }
 if(stale.length)throw new Error('Generated files are stale. Run node scripts/build-seo.mjs:\n'+stale.join('\n'));
 console.log(`${check?'Checked':'Generated'} ${files.size} public files.`);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
