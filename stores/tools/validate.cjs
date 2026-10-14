const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const sharp=require('sharp');
const out=path.resolve(__dirname,'../google-play/guitar/en-US');
const fields=[['title.txt',30],['short-description.txt',80],['full-description.txt',4000]];
const folders=[['phone',1080,1920],['tablet-7',1080,1920],['tablet-10',2560,1440],['desktop',1920,1080],['android-xr/drafts-16x9',2560,1440],['android-xr/drafts-8x5',3840,2400]];
const report={status:'passed',locale:'en-US',instrument:'guitar',text:[],assets:[],xrStatus:'Draft only; no XR runtime validation'};
async function check(file,width,height,maxBytes,alpha=false){
  const full=path.join(out,file),m=await sharp(full).metadata(),bytes=fs.statSync(full).size;
  await sharp(full,{failOn:'warning'}).stats();
  assert.equal(m.width,width,file+' width');assert.equal(m.height,height,file+' height');assert.equal(m.format,'png',file+' format');assert.equal(m.hasAlpha,alpha,file+' alpha');assert(bytes<maxBytes,file+' exceeds size limit');
  report.assets.push({file,width,height,bytes,alpha,status:file.startsWith('android-xr/')?'draft':'ready-for-review'});
}
(async()=>{
  for(const [file,max] of fields){const content=fs.readFileSync(path.join(out,file),'utf8').trimEnd();assert(content.length>0&&content.length<=max,file+' length');report.text.push({file,characters:content.length,limit:max});}
  await check('common/app-icon-512x512.png',512,512,1024*1024,true);
  await check('common/feature-graphic-1024x500.png',1024,500,15*1024*1024);
  for(const [folder,width,height] of folders){
    const files=fs.readdirSync(path.join(out,folder)).filter(f=>f.endsWith('.png')).sort();assert.equal(files.length,8,folder+' count');
    for(let i=0;i<8;i++){assert(files[i].startsWith(String(i+1).padStart(2,'0')+'-'),folder+' sequence');await check(folder+'/'+files[i],width,height,8*1024*1024);}
  }
  const alt=JSON.parse(fs.readFileSync(path.join(out,'alt-text.json'),'utf8'));for(const [id,text] of Object.entries(alt))assert(text.length<=140,id+' alt text length');
  fs.writeFileSync(path.join(out,'validation.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,uploadImages:report.assets.length,largestImageBytes:Math.max(...report.assets.map(a=>a.bytes)),text:report.text},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
