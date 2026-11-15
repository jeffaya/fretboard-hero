import fs from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {languages as legacy,reviewed as legacyReviewed} from './seo/content.mjs';
import {copy,lessonCopy} from './lessons/translations.mjs';
import {lessonBody} from './lessons/render.mjs';
import {escape,renderPage,renderSection,renderRelated} from './pages/components.mjs';
import {appRoutes} from '../web/core/routes.js';
import {renderPrivacy} from './pages/privacy.mjs';
import {documentStyles,documentScripts,renderDocumentFooter} from './pages/document-shell.mjs';
const require=createRequire(import.meta.url),routes=require('../web/core/guide-routes.js');
const root=fileURLToPath(new URL('../',import.meta.url)),origin='https://fretboard-hero.com',reviewed='2026-11-15';
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const productContext={window:{}};
for(const key of ['guitar','bass','ukulele'])vm.runInNewContext(readFileSync(new URL(`../web/products/${key}-fretboard-hero.js`,import.meta.url),'utf8'),productContext);
const products=productContext.window.FRETBOARD_PRODUCTS;
const family=instrument=>instrument==='bass-4'?'bass':instrument;
const exercise=(locale,instrument,topic)=>{
 const destination={notes:{screen:'fretmap'},penta:{screen:'learn',mode:'penta'},triads:{screen:'learn',mode:'triad'},chords:{screen:'learn',mode:instrument==='bass-4'?'arpeggio':'chord'},routine:{screen:'routine'}}[topic]||{};
 return '/?'+new URLSearchParams({instrument,lang:locale,...destination});
};
function render(locale,instrument,topic,aboutPage){
 const text=lessonCopy(locale),isAbout=!!aboutPage,index=routes.instruments.indexOf(instrument),name=text.instruments[index];
 const route=isAbout?legacy[locale].about:routes.route(locale,instrument,topic),url=origin+route;
 const title=isAbout?aboutPage.title:`${text.nav[routes.topics.indexOf(topic)]} · ${name}`;
 const heading=isAbout?aboutPage.heading:text[topic][0],intro=isAbout?aboutPage.intro:text[topic][1];
 const pageLanguages=(isAbout?['en','fr']:routes.languages).map(lang=>({locale:lang,label:copy[lang].label,href:isAbout?legacy[lang].about:routes.route(lang,instrument,topic)}));
 const product=products[family(instrument)],brand={name:product.branding.name,viewport:product.assets.heroLogoViewport};
 const appURL=exercise(locale,instrument,topic),home={href:exercise(locale,instrument,'home'),label:text.ui.back};
 const image=origin+`/assets/instruments/${family(instrument)}/og.jpg`;
 const graph={'@context':'https://schema.org','@graph':[
  {'@type':isAbout?'AboutPage':topic==='home'?'WebPage':'LearningResource','@id':url+'#page',url,name:title,headline:heading,description:intro,inLanguage:locale,dateModified:isAbout?legacyReviewed:reviewed,image,learningResourceType:'lesson',isAccessibleForFree:true},
  {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Fretboard Hero',item:origin+'/'},{'@type':'ListItem',position:2,name:text.nav[0]+' · '+name,item:origin+routes.route(locale,instrument)},...(!isAbout&&topic!=='home'?[{'@type':'ListItem',position:3,name:title,item:url}]:[])]}
 ]};
 const head=`<title>${escape(title)} | Fretboard Hero</title>
<meta name="description" content="${escape(intro)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${url}">
${pageLanguages.map(lang=>`<link rel="alternate" hreflang="${lang.locale}" href="${origin+lang.href}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${origin+pageLanguages.find(l=>l.locale==='en').href}">
<meta property="og:type" content="${topic==='home'?'website':'article'}">
<meta property="og:site_name" content="${escape(brand.name)}">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(intro)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${({en:'en_US',fr:'fr_FR',es:'es_ES',de:'de_DE',it:'it_IT','pt-BR':'pt_BR',hi:'hi_IN',id:'id_ID',ja:'ja_JP',ko:'ko_KR','zh-CN':'zh_CN'})[locale]}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1024"><meta property="og:image:height" content="500">
<meta property="og:image:alt" content="${escape(brand.name)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(intro)}"><meta name="twitter:image" content="${image}">
<link rel="icon" href="/assets/instruments/${family(instrument)}/favicon.ico">
<script type="application/ld+json">${json(graph)}</script>`;
 const related=renderRelated(text.ui.choose,routes.topics.filter(t=>t!=='home'&&t!==topic).map(t=>({label:text.nav[routes.topics.indexOf(t)],description:text[t][1],href:routes.route(locale,instrument,t)})));
 const body=`<section class="page-hero"><p class="eyebrow">${escape(name)} / ${escape(isAbout?aboutPage.label:text.nav[routes.topics.indexOf(topic)])}</p><h1>${escape(heading)}</h1><p class="page-intro">${escape(intro)}</p><div class="actions"><a class="button ui-primary" data-exercise-link href="${escape(appURL)}">${escape(text.ui.try)} <span aria-hidden="true">↗</span></a></div></section>
${topic==='home'&&!isAbout?related:''}
${isAbout?`<article class="lesson-body">${aboutPage.sections.map(renderSection).join('\n')}</article>`:lessonBody(topic,instrument,text)}
${topic!=='home'&&!isAbout?related:''}`;
 const nav=`<nav class="instrument-nav" aria-label="${escape(text.ui.instrument)}">${routes.instruments.map((inst,i)=>`<a data-guide-route href="${routes.route(locale,inst,topic)}"${inst===instrument?' aria-current="true"':''}>${escape(text.instruments[i])}</a>`).join('')}</nav>
<nav class="page-nav" aria-label="${escape(text.nav[0])}">${routes.topics.map((t,i)=>`<a href="${routes.route(locale,instrument,t)}"${!isAbout&&t===topic?' aria-current="page"':''}>${escape(text.nav[i])}</a>`).join('')}</nav>`;
 return renderPage({locale,head,body,skipLabel:text.ui.skip,header:{home,branding:brand},navigation:nav,
  styles:documentStyles,
  scripts:[...documentScripts,'/core/chord-library.js?v=10.53.0','/core/lesson-diagrams.js?v=10.53.0','/guide.js?v=10.54.0'],
  footerHTML:renderDocumentFooter({locale,instrument,languages:pageLanguages,ui:text.ui,configId:'guideConfig'})
 });
}
export function generatedFiles(){
 const files=new Map([['web/privacy.html',renderPrivacy()]]);
 const entries=[{url:origin+'/'},{url:origin+'/?instrument=bass-4'},{url:origin+'/?instrument=ukulele'},{url:origin+'/privacy'}];
 for(const route of Object.values(appRoutes))if(route.path!=='/')entries.push({url:origin+route.path});
 for(const locale of routes.languages)for(const instrument of routes.instruments)for(const topic of routes.topics){
  const route=routes.route(locale,instrument,topic);
  files.set('web'+route+'index.html',render(locale,instrument,topic));
  entries.push({url:origin+route,alternates:routes.languages.map(lang=>({lang,href:origin+routes.route(lang,instrument,topic)}))});
 }
 for(const locale of ['en','fr']){
  files.set('web'+legacy[locale].about+'index.html',render(locale,'guitar','home',legacy[locale].pages.find(p=>p.id==='about')));
  entries.push({url:origin+legacy[locale].about,alternates:['en','fr'].map(lang=>({lang,href:origin+legacy[lang].about}))});
 }
 files.set('web/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(({url,alternates})=>`  <url><loc>${escape(url)}</loc>${alternates?`<lastmod>${reviewed}</lastmod>${[...alternates,{...alternates.find(a=>a.lang==='en'),lang:'x-default'}].map(a=>`<xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.href}"/>`).join('')}`:''}</url>`).join('\n')}
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
