const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const locales=['en','es','fr','de','it','ja','ko','zh-CN','pt-BR','hi','id'];
const catalogs=Object.fromEntries(locales.map(locale=>[locale,JSON.parse(fs.readFileSync(`web/locales/${locale}.json`,'utf8'))]));
async function create({url='https://fretboard-hero.com/',saved=null,languages=['en'],fail=false,privacy=null}={}){
 const ctx={window:{},URL,navigator:{languages},location:{href:url},localStorage:{getItem:()=>saved},document:{documentElement:{},querySelector:()=>privacy},fetch:async path=>({ok:!fail,json:async()=>catalogs[path.match(/locales\/(.+)\.json/)[1]]})};vm.runInNewContext(fs.readFileSync('web/core/i18n.js','utf8'),ctx);const i18n=ctx.window.FretboardI18n;await i18n.initialize();return i18n;
}
test('The external privacy link carries the actual app language, including English fallback',async()=>{
 for(const locale of locales){const privacy={setAttribute(key,value){this[key]=value}};await create({url:'https://fretboard-hero.com/?lang='+locale,privacy});assert.equal(privacy.href,'https://fretboard-hero.com/privacy?lang='+locale)}
 const privacy={setAttribute(key,value){this[key]=value}};await create({languages:['fr'],fail:true,privacy});assert.equal(privacy.href,'https://fretboard-hero.com/privacy?lang=en');
});
test('Browser negotiation supports regions, ordered preferences and English fallback',async()=>{
 for(const [languages,expected] of [[['fr-CA'],'fr'],[['es-MX'],'es'],[['de-AT'],'de'],[['it-IT'],'it'],[['it-CH'],'it'],[['pt-PT'],'pt-BR'],[['zh-Hant-TW'],'zh-CN'],[['xx','ko-KR'],'ko'],[['xx'],'en']])assert.equal((await create({languages})).locale,expected);
 assert.equal((await create({languages:['fr'],saved:'de'})).locale,'de');assert.equal((await create({url:'https://fretboard-hero.com/?lang=ja',saved:'de'})).locale,'ja');assert.equal((await create({languages:['fr'],fail:true})).locale,'en');
});
test('Every catalog has the complete key set and preserves template placeholders',()=>{
 const keys=Object.keys(catalogs.en).sort();for(const locale of locales){assert.deepEqual(Object.keys(catalogs[locale]).sort(),keys);for(const key of keys){const placeholders=s=>[...new Set(s.match(/\{\w+\}/g)||[])].sort();assert.deepEqual(placeholders(catalogs[locale][key]),placeholders(key),`${locale}: ${key}`);assert.ok(catalogs[locale][key].trim())}}
});
test('Microphone support diagnostics give translated recovery guidance in every language',async()=>{
 const keys=['Microphone access requires HTTPS. Open the secure version of this site.','Microphone access is unavailable here. Open the site directly in an up-to-date browser.','Audio analysis is unavailable. Update your browser or system and try again.'];
 for(const locale of locales){
  const i=await create({languages:[locale]});
  for(const key of keys){assert.ok(catalogs[locale][key]);assert.equal(i.text(key),catalogs[locale][key]);if(locale!=='en')assert.notEqual(i.text(key),key)}
 }
});
test('Billing error titles, guidance and support details are localized in every supported language',async()=>{
 const keys=['Error details','Could not complete the purchase','Purchases are unavailable','{store} is unavailable','Unable to connect to the payment service. Check your connection, then try again.','Lifetime access is unavailable','{store} could not load this purchase. Please try again later.','Could not restore your access','Could not verify your purchase','Could not open payment'];
 for(const locale of locales){const i=await create({languages:[locale]});for(const key of keys){const message=key.replace('{store}','Google Play');assert.equal(i.text(message),catalogs[locale][key].replace('{store}','Google Play'));if(locale!=='en')assert.notEqual(i.text(message),message)}}
 const fr=await create({languages:['fr']});assert.equal(fr.text('Google Play is unavailable'),'Google Play est indisponible');
});
test('All ten routine inspirations, the encouragement and its credit localize in every supported language',async()=>{
 const c={window:{}};vm.runInNewContext(fs.readFileSync('web/core/routine-encouragement.js','utf8'),c);
 const keys=['Keep it going!','Inspired by',...c.window.RoutineEncouragement.messages.map(message=>message.text)];
 for(const locale of locales){
  const i18n=await create({languages:[locale]});
  for(const key of keys){
   assert.ok(catalogs[locale][key],`${locale}: ${key}`);
   assert.equal(i18n.text(key),catalogs[locale][key]);
   if(locale!=='en')assert.notEqual(i18n.text(key),key,`${locale}: untranslated inspiration`);
  }
 }
});
test('Dynamic exercises, store messages and repeated note placeholders localize notes without changing canonical identifiers',async()=>{
 const fr=await create({languages:['fr']});assert.equal(fr.text('A#'),'A#');assert.equal(fr.text('CAGED'),'CAGED');assert.equal(fr.text('Guitar Fretboard Hero'),'Guitar Fretboard Hero');assert.equal(fr.text('MAJOR'),'MAJEUR');assert.equal(fr.text('Play the C# minor scale'),'Jouez la gamme de Do# Mineur');assert.equal(fr.text('EXERCISE 3 OF 5'),'EXERCICE 3 SUR 5');assert.equal(fr.text('Opening Google Play…'),'Ouverture de Google Play…');assert.equal(fr.text('Learn · Quiz • Daily Routine'),'Apprendre · Quiz • Routine quotidienne');assert.match(fr.text('Play every A shown, one string at a time. Say “A” aloud as you play to connect the sound, name and position.'),/^Jouez chaque La/);
});
test('Translations are stable under repeated DOM passes in every language',async()=>{
 for(const locale of locales){const t=(await create({languages:[locale]})).text;for(const key of Object.keys(catalogs.en)){if(key.includes('{'))continue;const translated=t(key);assert.equal(t(translated),translated,`${locale}: ${key}`)}}
});

test('Note display follows locale, retains accidentals and never translates prose or CAGED',async()=>{
 const expected={en:'C',it:'Do',es:'Do',fr:'Do',de:'C',ja:'ド',ko:'도','zh-CN':'C','pt-BR':'Dó',hi:'सी',id:'Do'};
 for(const locale of locales){const i=await create({languages:[locale]});assert.equal(i.note('C'),expected[locale]);assert.equal(i.note('C#'),expected[locale]+'#');assert.equal(i.note('C♭m'),expected[locale]+'♭m');assert.equal(i.note('CAGED'),'CAGED');assert.equal(i.note('A new exercise'),'A new exercise')}
 const de=await create({languages:['de']});assert.equal(de.note('B'),'H');assert.equal(de.note('B♭'),'B');assert.equal(de.note('A#'),'A#');assert.equal(de.music('B♭ • B'),'B • H');
 const fr=await create({languages:['fr']});assert.equal(fr.music('EAD, DGB, CAGED'),'Mi–La–Ré, Ré–Sol–Si, CAGED');assert.equal(fr.text('Correct — A#'),'Correct — La#');
});

test('Triad liaison notes and CAGED form letters localize without losing interval spelling',async()=>{
 const fr=await create({languages:['fr']});
 assert.equal(fr.text('Minor third — C'),'Tierce mineure — Do');
 assert.equal(fr.text('Major third — E#'),'Tierce majeure — Mi#');
 assert.equal(fr.text('Major third — C##'),'Tierce majeure — Do##');
 assert.equal(fr.text('CAGED forms: C / D'),'Formes CAGED : C / D');
 for(const locale of locales){const i=await create({languages:[locale]});for(const key of ['Minor third — C','Major third — C##','CAGED forms: C / D'])assert.equal(i.text(i.text(key)),i.text(key),locale+' '+key)}
});
test('Melodic instructions, directions, box blocks and degree labels localize in every language',async()=>{
 const phrases=['Start on A. Play up to the octave, then return to the root.','Return to C#, reading from left to right.','Connect the A minor pentatonic boxes','One octave · Frets 5–8 · Ascending','Diagonal 2 · Frets 8–17 · Returning','Block 3','Degree ♭3','Slide 7 → 9'];
 for(const locale of locales){const i=await create({languages:[locale]});for(const phrase of phrases){const localized=i.text(phrase);if(locale!=='en'&&!['Block 3','Slide 7 → 9'].includes(phrase))assert.notEqual(localized,phrase,locale+' '+phrase);assert.equal(i.text(localized),localized)}}
 const fr=await create({languages:['fr']});assert.equal(fr.text(phrases[0]),'Partez de La : montez à l’octave, puis revenez à la fondamentale.');assert.equal(fr.text('Degree ♭3'),'Degré ♭3');assert.ok(fr.text(phrases[2]).includes('La Mineur'));
});

test('Download and lifetime access explanations translate in every supported language',async()=>{
 const keys=['Contact us','Get the app','Get it free on','Download for free on the','One payment.','Lifetime access.','No subscription.','Guitar, bass & ukulele.','All notes, keys and modes.','Unlock for life','Restore your access','Already purchased on another phone? Restore your access with the same account, without paying again.','Could not read purchase status. Please restore your access.'];
 for(const locale of locales){const t=(await create({languages:[locale]})).text;for(const key of keys){assert.equal(t(key),catalogs[locale][key]);if(locale!=='en')assert.notEqual(t(key),key,`${locale}: ${key}`)}}
 const fr=await create({languages:['fr']});assert.equal(fr.text('Restore your access'),'Récupérer votre accès');assert.equal(fr.text(keys.at(-2)),'Déjà acheté sur un autre téléphone ? Récupérez votre accès avec le même compte, sans repayer.');
});

test('Native recovery errors use the current action and localize in every language',async()=>{
 const files=['app/android/app/src/main/java/com/guitar/fretboardhero/PlayBillingPlugin.java','app/ios/App/App/StoreBillingPlugin.swift'];
 const errors=new Set();
 for(const file of files){
  const source=fs.readFileSync(file,'utf8');
  const messages=[...source.matchAll(/call\.reject\("([^"\n]*restore your access[^"\n]*)"/gi)].map(match=>match[1]);
  assert.ok(messages.length,`${file}: recovery guidance must be present`);
  assert.doesNotMatch(source,/restore purchases/i);
  messages.forEach(message=>errors.add(message));
 }
 for(const locale of locales){
  const i18n=await create({languages:[locale]});
  for(const message of errors){assert.ok(catalogs[locale][message],`${locale}: ${message}`);assert.equal(i18n.text(message),catalogs[locale][message]);if(locale!=='en')assert.notEqual(i18n.text(message),message)}
 }
 const fr=await create({languages:['fr']});
 assert.ok(fr.text('Purchase verification is temporarily unavailable. Connect and tap Restore your access to retry.').includes(fr.text('Restore your access')));
});

