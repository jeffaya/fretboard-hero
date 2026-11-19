import {readFileSync} from 'node:fs';
import {renderPage} from './components.mjs';
import {documentStyles,documentScripts,renderDocumentFooter} from './document-shell.mjs';
import {lessonCopy} from '../lessons/translations.mjs';

// Legal copy is kept intact, separately from the shared shell.
const content = readFileSync(new URL('./privacy-content.html',import.meta.url),'utf8');
const languages = [
  ['fr','Français'],['en','English'],['es','Español'],['de','Deutsch'],['it','Italiano'],
  ['pt-BR','Português (Brasil)'],['ja','日本語'],['ko','한국어'],['zh-CN','简体中文'],['hi','हिन्दी'],['id','Bahasa Indonesia'],['ar','العربية'],['bn','বাংলা'],['ru','Русский']
].map(([locale,label]) => ({locale,label,href:'#'+locale,attrs:{'data-policy-language':locale}}));

export function renderPrivacy() {
  const home = {href:'./',label:'Retour à Fretboard Hero',attrs:{'data-policy-home':''}};
  return renderPage({
    locale:'fr',assetBase:'./',layout:'reading',skipLabel:'Aller à la politique',
    head:`<meta name="description" content="Cette politique explique comment Guitar, Bass et Ukulele Fretboard Hero utilisent vos données sur fretboard-hero.com et dans les applications, y compris pour les achats intégrés.">
<title>Politique de confidentialité — Fretboard Hero</title>
<link rel="canonical" href="https://fretboard-hero.com/privacy">
<link rel="icon" href="./assets/instruments/guitar/favicon.ico">`,
    styles:documentStyles,
    scripts:[...documentScripts,'./privacy.js?v=10.58.0'],
    header:{home},
    footerHTML:renderDocumentFooter({locale:'fr',instrument:'guitar',languages,ui:lessonCopy('fr').ui,configId:'policyConfig',localizedUI:Object.fromEntries(languages.map(({locale})=>{const {privacy,contact}=lessonCopy(locale).ui;return [locale,{privacy,contact}]}))}),
    body:content
  });
}
