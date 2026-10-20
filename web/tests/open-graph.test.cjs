const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('web/index.html','utf8');
const meta=name=>new RegExp(`<meta (?:property|name)="${name}" content="([^"]+)"`).exec(html)?.[1];
const imageUrl=key=>`https://fretboard-hero.com/assets/instruments/${key}/og.jpg${new URL(meta('og:image')).search}`;

test('Initial share metadata uses the existing lightweight JPEG artwork',()=>{
 assert.equal(meta('og:image'),imageUrl('guitar'));assert.equal(meta('twitter:image'),meta('og:image'));
 assert.equal(meta('og:image:type'),'image/jpeg');assert.equal(meta('og:image:width'),'1024');assert.equal(meta('og:image:height'),'500');
 for(const key of ['guitar','bass','ukulele']){
  const image=fs.readFileSync(`web/assets/instruments/${key}/og.jpg`);
  assert.equal(image.readUInt16BE(0),0xffd8);assert.equal(image.readUInt16BE(image.length-2),0xffd9);
  assert.ok(image.length<300000,`${key}: keep social previews below our 300 KB budget`);
 }
});

function worker(source){
 class Rewriter {
  constructor(){this.handlers=[]}
  on(selector,handler){this.handlers.push([selector,handler]);return this}
  transform(response){
   // Exercise the worker's actual element handlers without a Cloudflare runtime.
   const attributes=new Map();
   for(const [selector,handler] of this.handlers)for(const part of selector.split(', ')){
    const values={};handler.element({setAttribute:(name,value)=>values[name]=value,setInnerContent:value=>values.textContent=value});attributes.set(part,values);
   }
   return {response,attributes};
  }
 }
 source=source.replace(/^import .*;\r?\n/,'').replace('export default','globalThis.worker =');
 const c=vm.createContext({URL,HTMLRewriter:Rewriter});vm.runInContext(source,c);return c.worker;
}
for(const [format,newline] of [['LF','\n'],['CRLF','\r\n']])test(`Worker supplies instrument JPEG metadata before client JavaScript, including shared query URLs (${format})`,async()=>{
 const source=fs.readFileSync('worker.js','utf8').replace(/\r?\n/g,newline);
 const app=worker(source),response=new Response(html,{headers:{'content-type':'text/html'}});
 for(const pathname of ['/','/index.html'])for(const [instrument,key] of [['guitar','guitar'],['bass-4','bass'],['ukulele','ukulele'],['unknown','guitar']]){
  const {attributes}=await app.fetch(new Request(`https://fretboard-hero.com${pathname}?instrument=${instrument}&lang=fr`),{ASSETS:{fetch:async()=>response}});
  for(const selector of ['meta[property="og:image"]','meta[name="twitter:image"]'])assert.equal(attributes.get(selector).content,imageUrl(key));
  assert.equal(attributes.get('meta[property="og:image:type"]').content,'image/jpeg');
  assert.equal(attributes.get('meta[property="og:image:width"]').content,'1024');assert.equal(attributes.get('meta[property="og:image:height"]').content,'500');
 }
 const image=new Response('image',{headers:{'content-type':'image/jpeg'}});
 assert.equal(await app.fetch(new Request(imageUrl('bass')),{ASSETS:{fetch:async()=>image}}),image,'image responses pass through unchanged');
});
test('All client product profiles preserve the server JPEG URL, MIME type and dimensions',()=>{
 for(const key of ['guitar','bass','ukulele']){
  const nodes=new Map(),get=selector=>{if(!nodes.has(selector))nodes.set(selector,{setAttribute(name,value){this[name]=String(value)}});return nodes.get(selector)};
  const c=vm.createContext({URL,location:{href:'https://fretboard-hero.com/'},document:{querySelector:get},ModeRegistry:{list:()=>[]}});c.window=c;
  for(const path of [`web/products/${key}-fretboard-hero.js`,'web/core/product-shell.js'])vm.runInContext(fs.readFileSync(path,'utf8'),c);
  c.ProductShell.apply(c.FRETBOARD_PRODUCTS[key],{});
  assert.equal(get('meta[property="og:image"]').content,imageUrl(key));assert.equal(get('meta[name="twitter:image"]').content,imageUrl(key));
  assert.equal(get('meta[property="og:image:type"]').content,'image/jpeg');assert.equal(get('meta[property="og:image:width"]').content,'1024');assert.equal(get('meta[property="og:image:height"]').content,'500');
 }
});
