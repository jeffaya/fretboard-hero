/* Capture the real local app; no UI text, notes, scores or controls are painted in. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const sharp = require('sharp');
const repo = path.resolve(__dirname, '../..');
const web = path.join(repo, 'web');
const { out, locale, language, instrument, appInstrument, profileId, strings } = require('./listing.cjs');
const variants = [
  {id:'phone', width:432, height:768, dpr:2.5, touch:true, folder:'source/screens-phone'},
  {id:'tablet-7', width:720, height:1280, dpr:1.5, touch:true, folder:'tablet-7'},
  {id:'tablet-10', width:1600, height:900, dpr:1.6, touch:true, folder:'tablet-10'},
  {id:'desktop', width:1920, height:1080, dpr:1, touch:false, folder:'desktop'},
  {id:'android-xr-console', width:1600, height:900, dpr:1.6, touch:false, folder:'android-xr'}
];
const jpeg = instrument === 'guitar' && !['en-US','fr-FR'].includes(locale);
const names = ['01-routine','02-triads','03-pentatonic','04-feedback','05-quiz','06-tuner','07-map','08-circle'];
const evidence = {sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),locale,instrument,capture:'Chromium rendering of local web source; viewport emulation, not physical-device certification',access:'Local capture-only unlocked configuration; production config unchanged',audio:'Synthetic microphone input processed by the real detector',variants:[]};
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server = http.createServer((req,res)=>{
  const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(web,'.'+(requested==='/'?'/index.html':requested));
  if(!file.startsWith(web+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
async function pause(page, ms=300){await page.waitForTimeout(ms);}
async function nativeClick(page, selector){await page.locator(selector).evaluate(el=>el.click());await pause(page);}
async function home(page){if(await page.locator('.tuner-dialog[open]').count())await page.keyboard.press('Escape');await nativeClick(page,'.screen.active [data-go="home"]');}
async function routine(page,step){
  await page.click('#home [data-go="routine"]');
  await nativeClick(page,'#routineRootControls [data-value="A"]');
  await page.click(`#routineSteps [data-step="${step}"]`);
  if(await page.locator('#routineMic').getAttribute('aria-checked')==='true')await page.click('#routineMic');
  await pause(page);
}
async function tone(page,midis){await page.evaluate(notes=>window.__storeTone(notes),midis);}
async function save(page,v,name){
  await page.evaluate(()=>window.scrollTo(0,0));if(name!=='05-quiz')await pause(page,200);
  const actualLanguage=await page.evaluate(()=>({html:document.documentElement.lang,app:FretboardI18n.locale}));
  if(actualLanguage.html!==language||actualLanguage.app!==language)throw new Error(`Capture language mismatch: ${JSON.stringify(actualLanguage)}`);
  const actualInstrument=await page.evaluate(()=>({id:FRETBOARD_ACTIVE_INSTRUMENT.id,strings:FRETBOARD_ACTIVE_INSTRUMENT.courses.length,product:FRETBOARD_ACTIVE_PRODUCT.name,tuning:FRETBOARD_ACTIVE_INSTRUMENT.courses.map(c=>c.name)}));
  if(actualInstrument.id!==profileId||actualInstrument.strings!==strings)throw new Error(`Capture instrument mismatch: ${JSON.stringify(actualInstrument)}`);
  const dir=path.join(out,v.folder);fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,`${name}-${Math.round(v.width*v.dpr)}x${Math.round(v.height*v.dpr)}.${jpeg?'jpg':'png'}`);
  const bytes=await page.screenshot({animations:'disabled',fullPage:false});
  const rgb=sharp(bytes).removeAlpha();
  const encoded=await (jpeg?rgb.jpeg({quality:91}):rgb.png({compressionLevel:9})).toBuffer();
  fs.writeFileSync(file+'.tmp',encoded);fs.renameSync(file+'.tmp',file);
  const visibleText=await page.locator(name==='06-tuner'?'.tuner-dialog[open]':'.screen.active').innerText();
  return {file:path.relative(out,file).split(path.sep).join('/'),language:actualLanguage,instrument:actualInstrument,screen:await page.locator('body').getAttribute('data-screen'),title:await page.locator('.screen.active h2, .screen.active .section-heading').first().innerText().catch(()=>''),mic:await page.locator('#routineMicStatus').innerText(),visibleText,sizeBytes:fs.statSync(file).size};
}
async function capture(browser,v,base){
  const context=await browser.newContext({viewport:{width:v.width,height:v.height},deviceScaleFactor:v.dpr,locale,hasTouch:v.touch,reducedMotion:'reduce'});
  await context.route('**/site.config.json',async route=>{const json=JSON.parse(fs.readFileSync(path.join(web,'site.config.json'),'utf8'));json.unlocked=true;await route.fulfill({json});});
  await context.addInitScript(()=>{
    localStorage.setItem('fretboard-routine-microphone','off');localStorage.setItem('fretboard-tuner-microphone','off');
    let audio,stream,voices=[];
    navigator.mediaDevices.getUserMedia=async()=>{voices.forEach(o=>o.stop());voices=[];if(audio)await audio.close();audio=new AudioContext();stream=audio.createMediaStreamDestination();await audio.resume();return stream.stream;};
    window.__storeTone=async notes=>{
      if(!audio){audio=new AudioContext();stream=audio.createMediaStreamDestination();}await audio.resume();
      voices.forEach(o=>o.stop());voices=[];
      for(const midi of notes)for(let harmonic=1;harmonic<=4;harmonic++){
        const oscillator=audio.createOscillator(),gain=audio.createGain();
        oscillator.frequency.value=440*2**((midi-69)/12)*harmonic;
        gain.gain.value=.09/(harmonic*notes.length);oscillator.connect(gain).connect(stream);oscillator.start();voices.push(oscillator);
      }
    };
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(base+`/?lang=${language}&instrument=${appInstrument}`);await page.waitForSelector('#home.active');await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(expected=>document.documentElement.lang===expected&&window.FretboardI18n?.locale===expected,language);
  const record={...v,outputs:[],errors};
  await routine(page,2);record.outputs.push(await save(page,v,names[0]));
  await page.click('#routineSteps [data-step="3"]');record.outputs.push(await save(page,v,names[1]));
  await home(page);await page.click('#home [data-go="learn"]');record.outputs.push(await save(page,v,names[2]));
  await home(page);await routine(page,1);await page.click('#routineMic');await page.waitForFunction(()=>document.querySelector('#routineMicStatus').textContent.includes(FretboardI18n.text('Listening…')));
  const firstRoot=await page.evaluate(()=>{const course=FRETBOARD_ACTIVE_INSTRUMENT.courses[0];return course.midi+MusicTheory.mod(MusicTheory.PC.A-course.pc)});
  await pause(page,600);await tone(page,[firstRoot]);
  await page.waitForSelector('#routineTab .is-played');await tone(page,[]);await pause(page,350);
  record.outputs.push(await save(page,v,names[3]));
  await home(page);await page.click('#home [data-go="quiz"]');await page.click('#startQuizButton');await pause(page,500);
  for(let n=0;n<4;n++){
    const selector=await page.evaluate(()=>{
      const notes=MusicTheory.PC,displayedRoot=document.querySelector('#quizChord').textContent.trim().split(' ')[0],label=document.querySelector('#quizPrompt strong').textContent.trim().toUpperCase();
      // Match the longest localized note first: CJK chord qualities may touch the root.
      const root=Object.keys(notes).sort((a,b)=>FretboardI18n.note(b).length-FretboardI18n.note(a).length)
        .find(note=>displayedRoot.toUpperCase().startsWith(FretboardI18n.note(note).toUpperCase()));
      if(root===undefined)throw new Error(`Unknown localized quiz root: ${displayedRoot}`);
      const translated=value=>FretboardI18n.text(value).toUpperCase();
      const target=(notes[root]+(label===translated('5TH')?7:label===translated('3RD')?4:label===translated('♭3RD')?3:0))%12;
      const courses=FRETBOARD_ACTIVE_INSTRUMENT.courses;
      const hit=[...document.querySelectorAll('.quiz-hit-zone')].find(el=>(courses[+el.dataset.string].pc+(+el.dataset.fret))%12===target);
      if(!hit)throw new Error('No visible correct answer for the current quiz question');
      return `.quiz-hit-zone[data-string="${hit.dataset.string}"][data-fret="${hit.dataset.fret}"]`;
    });
    await page.locator(selector).evaluate(el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    await pause(page,n===3?40:900);
  }
  if(Number((await page.locator('#scoreCount').innerText()).replace(/\D/g,''))===0)throw new Error('Quiz capture did not register correct answers');
  record.outputs.push(await save(page,v,names[4]));
  await home(page);await page.click('#home [data-open-tuner]');await page.click('.tuner-mic');
  const openA=await page.evaluate(()=>FRETBOARD_ACTIVE_INSTRUMENT.courses.find(course=>course.name==='A').midi);
  await tone(page,[openA]);await page.waitForFunction(()=>document.querySelector('.tuner-dialog').classList.contains('in-tune'));
  record.outputs.push(await save(page,v,names[5]));await tone(page,[]);
  await page.keyboard.press('Escape');await page.click('#home [data-go="fretmap"]');record.outputs.push(await save(page,v,names[6]));
  await home(page);await page.click('#home [data-go="circle"]');await page.click('#circleNext');record.outputs.push(await save(page,v,names[7]));
  if(errors.length)throw new Error(errors.join('\n'));
  await context.close();return record;
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
  try{for(const v of variants.filter(v=>!process.env.STORE_DEVICE||v.id===process.env.STORE_DEVICE)){
    console.log('Capturing '+v.id);evidence.variants.push(await capture(browser,v,'http://127.0.0.1:'+server.address().port));
    fs.mkdirSync(path.join(out,'source'),{recursive:true});fs.writeFileSync(path.join(out,'source',`capture-${v.id}.json`),JSON.stringify({...evidence,variants:evidence.variants.slice(-1)},null,2)+'\n');
  }}finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});

