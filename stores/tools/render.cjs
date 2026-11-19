const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const sharp=require('sharp');
const { out, locale }=require('./listing.cjs');
if(fs.existsSync(path.join(out,'source/copy.json'))){
  require('node:child_process').execFileSync('python3',[path.join(__dirname,'render-localized-guitar.py'),locale],{stdio:'inherit'});
  return;
}
const ids=['01-routine','02-triads','03-pentatonic','04-feedback','05-quiz','06-tuner','07-map','08-circle'];
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
    await page.goto(pathToFileURL(path.join(out,'source/layout/panorama.html')).href);
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForFunction(()=>[...document.images].every(img=>img.complete&&img.naturalWidth>0));
    const clipped=await page.locator('.card').evaluateAll(cards=>cards.flatMap(card=>[...card.querySelectorAll('h1 span,.subtitle')].filter(el=>el.scrollWidth>el.clientWidth+1||(el.matches('.subtitle')&&el.scrollHeight>el.clientHeight+1)).map(el=>({card:card.dataset.id,text:el.textContent}))));
    if(clipped.length)throw new Error('Store artwork contains clipped text: '+JSON.stringify(clipped));
    fs.mkdirSync(path.join(out,'phone'),{recursive:true});
    for(const id of ids){const bytes=await page.locator(`[data-id="${id}"]`).screenshot();await sharp(bytes).removeAlpha().png({compressionLevel:9}).toFile(path.join(out,'phone',`${id}-1080x1920.png`));}
    const tiles=await Promise.all(ids.map(id=>sharp(path.join(out,'phone',`${id}-1080x1920.png`)).resize(360,640).toBuffer()));
    await sharp({create:{width:1440,height:1280,channels:3,background:'#03051b'}}).composite(tiles.map((input,i)=>({input,left:(i%4)*360,top:Math.floor(i/4)*640}))).png().toFile(path.join(out,'overview-phone.png'));
    console.log('Rendered eight phone visuals and overview-phone.png');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
