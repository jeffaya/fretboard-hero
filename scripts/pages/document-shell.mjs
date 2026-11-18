import {readFileSync} from 'node:fs';
import {escape,renderLink} from './components.mjs';
const home=readFileSync(new URL('../../web/index.html',import.meta.url),'utf8');
const footer=home.match(/<footer class="home-footer">[\s\S]*?<\/footer>/)[0];
const menus=[...home.matchAll(/<a class="hero-btn [^"]*"[^>]*data-go="[^"]+"[\s\S]*?<\/a>/g)].map(m=>m[0].replace(/ href="[^"]*"/g,'')).join('');
export const stores=JSON.parse(readFileSync(new URL('../../web/site.config.json',import.meta.url),'utf8')).stores;
export const documentStyles=['/footer.css?v=10.54.0','/premium.css?v=10.52.0'];
export const documentScripts=['/core/instrument-selection.js?v=10.49.22','/core/document-branding.js?v=10.53.0','/core/i18n.js?v=10.56.0','/core/modal.js?v=10.52.0','/core/access.js?v=10.52.0','/core/footer.js?v=10.52.0','/core/document-shell.js?v=10.54.0'];
export function renderDocumentFooter({locale,instrument,languages,ui,configId,localizedUI,notation}){
 const links=languages.map(l=>renderLink({...l,attrs:{lang:l.locale,hreflang:l.locale,...(l.locale===locale?{'aria-current':'page'}:{}),...l.attrs}})).join(' · ');
 const state=JSON.stringify({locale,instrument,stores,languages,ui,localizedUI,notation}).replace(/</g,'\\u003c');
 return footer.replace('<div class="language-picker"></div>',`<div class="language-picker">${links}</div>`)
 .replace('https://fretboard-hero.com/privacy',`https://fretboard-hero.com/privacy?lang=${locale}&amp;instrument=${instrument}`)
 .replace('Privacy policy',escape(ui.privacy)).replace('Contact us',escape(ui.contact))+
 `<template id="documentAppMenu">${menus}</template><script type="application/json" id="${configId}">${state}</script>`;
}
