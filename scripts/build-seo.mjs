import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {languages, reviewed} from './seo/content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://fretboard-hero.com';
const store = 'https://play.google.com/store/apps/details?id=com.guitar.fretboardhero';
const image = `${origin}/assets/instruments/guitar/og.jpg`;
const author = 'Jean-François Seignemorte';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const pagePath = (locale, page) => page.id === 'about' ? languages[locale].about : languages[locale].base + page.slug;
const counterpart = (locale, id) => pagePath(locale, languages[locale].pages.find(p => p.id === id));
const appLink = (locale, page) => `/?${new URLSearchParams({instrument:'guitar',lang:locale,...(page.screen !== 'home' ? {screen:page.screen} : {}),...(page.mode ? {mode:page.mode} : {})})}`;

function sectionHTML(section) {
  const table = section.table;
  return `<section class="guide-section">
<h2>${escape(section.title)}</h2>
${(section.paragraphs || []).map(p => `<p>${escape(p)}</p>`).join('\n')}
${section.items ? `<ul>${section.items.map(p => `<li>${escape(p)}</li>`).join('')}</ul>` : ''}
${section.steps ? `<ol class="steps">${section.steps.map(p => `<li>${escape(p)}</li>`).join('')}</ol>` : ''}
${table ? `<div class="table-wrap"><table><caption>${escape(section.title)}</caption><thead><tr>${table.headers.map(v => `<th scope="col">${escape(v)}</th>`).join('')}</tr></thead><tbody>${table.rows.map(row => `<tr>${row.map((v,i) => i ? `<td>${escape(v)}</td>` : `<th scope="row">${escape(v)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
</section>`;
}

function pentatonicDiagram(locale) {
  const labels = locale === 'fr' ? ['Mi','Si','Sol','Ré','La','Mi'] : ['E','B','G','D','A','E'];
  // High E at the top, low E at the bottom. Frets are 5–8, not open strings.
  const rows = [ [[5,'A'],[8,'C']], [[5,'E'],[8,'G']], [[5,'C'],[7,'D']], [[5,'G'],[7,'A']], [[5,'D'],[7,'E']], [[5,'A'],[8,'C']] ];
  return `<figure class="diagram"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 304" role="img" aria-labelledby="penta-title penta-desc">
<title id="penta-title">${locale === 'fr' ? 'Pentatonique de La mineur, position 1' : 'A minor pentatonic, position 1'}</title>
<desc id="penta-desc">${escape(languages[locale].diagram)}</desc>
<rect x="80" y="36" width="440" height="228" rx="10" fill="#191827"/>
${[5,6,7,8].map((f,i) => `<text x="${135+i*110}" y="22" text-anchor="middle" fill="#b8bed2" font-size="16">${f}</text>`).join('')}
${[0,1,2,3,4].map(i => `<path d="M${80+i*110} 36V264" stroke="#6b687c" stroke-width="3"/>`).join('')}
${rows.map((notes,s) => `<text x="54" y="${61+s*37}" text-anchor="end" fill="#dce1f5" font-size="16">${labels[s]}</text><path d="M80 ${56+s*37}H520" stroke="#b8bed2" stroke-width="${1+s*.45}"/>${notes.map(([f,n]) => `<circle cx="${135+(f-5)*110}" cy="${56+s*37}" r="17" fill="${n==='A'?'#ff64cd':'#e6e9ff'}"/><text x="${135+(f-5)*110}" y="${62+s*37}" text-anchor="middle" fill="#10101c" font-size="17" font-weight="700">${n}</text>`).join('')}`).join('')}
</svg><figcaption>${escape(languages[locale].diagram)}</figcaption></figure>`;
}

function render(locale, page) {
  const text = languages[locale], url = origin + pagePath(locale,page), isAbout = page.id === 'about';
  const dateLabel = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${reviewed}T00:00:00Z`));
  const isGuide = !['home','about'].includes(page.id);
  const app = {'@type':'SoftwareApplication','@id':`${origin}/#guitar-app`,name:'Guitar Fretboard Hero',url:origin+'/',applicationCategory:'EducationalApplication',operatingSystem:'Web browser, Android',description:text.pages[0].description,image,downloadUrl:store,featureList:text.pages[0].sections[0].items};
  const person = {'@type':'Person','@id':`${origin}/#creator`,name:author,url:origin+text.about};
  const webpage = {'@type':isAbout?'AboutPage':isGuide?'Article':'WebPage','@id':url+'#page',url,name:page.title,headline:page.heading,description:page.description,inLanguage:locale,dateModified:reviewed,author:{'@id':person['@id']},about:{'@id':app['@id']},mainEntityOfPage:url};
  const breadcrumbs = {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Fretboard Hero',item:origin+'/'},{'@type':'ListItem',position:2,name:text.guides,item:origin+text.base},...(page.id !== 'home' ? [{'@type':'ListItem',position:3,name:page.label,item:url}] : [])]};
  const graph = {'@context':'https://schema.org','@graph':[app,person,webpage,breadcrumbs]};
  const nav = text.pages.filter(p=>p.id!=='about').map(p=>`<a href="${pagePath(locale,p)}"${page.id===p.id?' aria-current="page"':''}>${escape(p.label)}</a>`).join('\n');
  return `<!doctype html>
<!-- Generated by scripts/build-seo.mjs. Edit scripts/seo/content.mjs instead. -->
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#080a13">
<title>${escape(page.title)} | Fretboard Hero</title>
<meta name="description" content="${escape(page.description)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<link rel="canonical" href="${url}">
${Object.keys(languages).map(lang=>`<link rel="alternate" hreflang="${lang}" href="${origin+counterpart(lang,page.id)}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${origin+counterpart('en',page.id)}">
<meta property="og:type" content="${isGuide?'article':'website'}">
<meta property="og:site_name" content="Fretboard Hero">
<meta property="og:title" content="${escape(page.title)}">
<meta property="og:description" content="${escape(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${text.locale}">
<meta property="og:locale:alternate" content="${languages[locale==='fr'?'en':'fr'].locale}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1024">
<meta property="og:image:height" content="500">
<meta property="og:image:alt" content="Guitar Fretboard Hero">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(page.title)}">
<meta name="twitter:description" content="${escape(page.description)}">
<meta name="twitter:image" content="${image}">
<link rel="icon" href="/assets/instruments/guitar/favicon.ico">
<link rel="stylesheet" href="/guides.css?v=1">
<script type="application/ld+json">${json(graph)}</script>
</head>
<body>
<a class="skip" href="#content">${text.skip}</a>
<header class="site-header"><a class="brand" href="${text.base}" aria-label="Fretboard Hero"><span class="brand-mark" aria-hidden="true">FH</span><span>FRETBOARD <b>HERO</b></span></a>
<div class="header-actions"><nav class="languages" aria-label="${locale==='fr'?'Langue':'Language'}">${Object.entries(languages).map(([lang,t])=>`<a href="${counterpart(lang,page.id)}" lang="${lang}" hreflang="${lang}"${lang===locale?' aria-current="page"':''}>${t.label}</a>`).join('')}</nav><a class="button small" href="${escape(appLink(locale,text.pages[0]))}">${text.open}</a></div></header>
<nav class="guide-nav" aria-label="${text.guides}">${nav}</nav>
<main id="content">
<section class="hero${page.diagram?' with-diagram':''}"><div><p class="eyebrow">FRETBOARD HERO / ${escape(page.label.toUpperCase())}</p><h1>${escape(page.heading)}</h1><p class="intro">${escape(page.intro)}</p><div class="actions"><a class="button" data-exercise-link href="${escape(appLink(locale,page))}">${escape(page.cta||text.try)} <span aria-hidden="true">↗</span></a><a class="store-link" href="${store}">${text.store}</a></div><p class="byline">${text.author} <a href="${text.about}">${author}</a> · ${text.updated} <time datetime="${reviewed}">${dateLabel}</time></p></div>${page.diagram?pentatonicDiagram(locale):''}</section>
<div class="article-layout"><article>${page.sections.map(sectionHTML).join('\n')}
${page.faq.length?`<section class="guide-section faq"><h2>${text.questions}</h2>${page.faq.map(([q,a])=>`<details><summary>${escape(q)}</summary><p>${escape(a)}</p></details>`).join('\n')}</section>`:''}
</article><aside class="offer"><p class="eyebrow">FRETBOARD HERO</p><h2>${text.offerTitle}</h2><p>${escape(text.offer)}</p><a class="button" href="${escape(appLink(locale,page))}">${text.open}</a><p class="platform">${escape(text.platform)}</p></aside></div>
<section class="related"><h2>${text.related}</h2><div class="cards">${text.pages.filter(p=>p.id!==page.id&&p.id!=='about'&&p.id!=='home').map(p=>`<a class="card" href="${pagePath(locale,p)}"><h3>${escape(p.label)} <span aria-hidden="true">↗</span></h3><p>${escape(p.description)}</p></a>`).join('')}</div></section>
</main>
<footer class="site-footer"><a class="brand" href="${text.base}">FRETBOARD <b>HERO</b></a><nav aria-label="${locale==='fr'?'Informations':'Information'}"><a href="${text.about}">${text.aboutLabel}</a><a href="/privacy?lang=${locale}">${text.privacy}</a><a href="mailto:hello@fretboard-hero.com">${text.contact}</a><a href="${escape(appLink(locale,text.pages[0]))}">${text.open}</a></nav></footer>
</body>
</html>
`;
}

export function generatedFiles() {
  const files = new Map();
  const entries = [{url:origin+'/'},{url:origin+'/?instrument=bass-4'},{url:origin+'/?instrument=ukulele'},{url:origin+'/privacy'}];
  for (const [locale,text] of Object.entries(languages)) for (const page of text.pages) {
    files.set(`web${pagePath(locale,page)}index.html`,render(locale,page));
    entries.push({url:origin+pagePath(locale,page),id:page.id});
  }
  files.set('web/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(({url,id})=>`  <url><loc>${escape(url)}</loc>${id?`<lastmod>${reviewed}</lastmod>${[...Object.keys(languages),'x-default'].map(lang=>`<xhtml:link rel="alternate" hreflang="${lang}" href="${origin+counterpart(lang==='x-default'?'en':lang,id)}"/>`).join('')}`:''}</url>`).join('\n')}
</urlset>
`);
  return files;
}

async function main() {
  const check = process.argv.includes('--check');
  const stale = [];
  for (const [relative,content] of generatedFiles()) {
    const filename = path.join(root,relative);
    if (check) {
      if (await fs.readFile(filename,'utf8').catch(()=>null) !== content) stale.push(relative);
    } else {
      await fs.mkdir(path.dirname(filename),{recursive:true});
      await fs.writeFile(filename,content);
    }
  }
  if (stale.length) throw new Error(`Generated SEO files are stale. Run node scripts/build-seo.mjs:\n${stale.join('\n')}`);
  console.log(`${check?'Checked':'Generated'} ${generatedFiles().size} SEO files.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
