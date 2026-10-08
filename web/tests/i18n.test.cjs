const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const locales=['en','es','fr','de','ja','ko','zh-CN','pt-BR','hi','id'];
const catalogs=Object.fromEntries(locales.map(locale=>[locale,JSON.parse(fs.readFileSync(`web/locales/${locale}.json`,'utf8'))]));
async function create({url='https://fretboard-hero.com/',saved=null,languages=['en'],fail=false}={}){
 const ctx={window:{},URL,navigator:{languages},location:{href:url},localStorage:{getItem:()=>saved},document:{documentElement:{}},fetch:async path=>({ok:!fail,json:async()=>catalogs[path.match(/locales\/(.+)\.json/)[1]]})};vm.runInNewContext(fs.readFileSync('web/core/i18n.js','utf8'),ctx);const i18n=ctx.window.FretboardI18n;await i18n.initialize();return i18n;
}
test('Browser negotiation supports regions, ordered preferences and English fallback',async()=>{
 for(const [languages,expected] of [[['fr-CA'],'fr'],[['es-MX'],'es'],[['de-AT'],'de'],[['pt-PT'],'pt-BR'],[['zh-Hant-TW'],'zh-CN'],[['xx','ko-KR'],'ko'],[['xx'],'en']])assert.equal((await create({languages})).locale,expected);
 assert.equal((await create({languages:['fr'],saved:'de'})).locale,'de');assert.equal((await create({url:'https://fretboard-hero.com/?lang=ja',saved:'de'})).locale,'ja');assert.equal((await create({languages:['fr'],fail:true})).locale,'en');
});
test('Every catalog has the complete key set and preserves template placeholders',()=>{
 const keys=Object.keys(catalogs.en).sort();for(const locale of locales){assert.deepEqual(Object.keys(catalogs[locale]).sort(),keys);for(const key of keys){const placeholders=s=>[...new Set(s.match(/\{\w+\}/g)||[])].sort();assert.deepEqual(placeholders(catalogs[locale][key]),placeholders(key),`${locale}: ${key}`);assert.ok(catalogs[locale][key].trim())}}
});
test('Dynamic exercises, store prices and repeated note placeholders translate without changing notation',async()=>{
 const fr=await create({languages:['fr']});assert.equal(fr.text('A#'),'A#');assert.equal(fr.text('CAGED'),'CAGED');assert.equal(fr.text('Guitar Fretboard Hero'),'Guitar Fretboard Hero');assert.equal(fr.text('MAJOR'),'MAJEUR');assert.equal(fr.text('Play the C# minor scale'),'Jouez la gamme de C# Mineur');assert.equal(fr.text('EXERCISE 3 OF 5'),'EXERCICE 3 SUR 5');assert.equal(fr.text('Unlock full access — 9,99 €'),'Débloquer — 9,99 €');assert.match(fr.text('Play every A shown, one string at a time. Say “A” aloud as you play to connect the sound, name and position.'),/^Jouez chaque A/);
});
test('Translations are stable under repeated DOM passes in every language',async()=>{
 for(const locale of locales){const t=(await create({languages:[locale]})).text;for(const key of Object.keys(catalogs.en)){if(key.includes('{'))continue;const translated=t(key);assert.equal(t(translated),translated,`${locale}: ${key}`)}}
});
