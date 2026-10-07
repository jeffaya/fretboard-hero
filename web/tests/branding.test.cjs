const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

test('Server share metadata follows the instrument and never leaks a test key',async()=>{
  const {socialIdentity,renderSocialHtml}=await import('../../server/social.mjs');
  const template=fs.readFileSync('web/index.html','utf8');
  for(const [instrument,key,name] of [['guitar','guitar','Guitar'],['bass-4','bass','Bass'],['ukulele','ukulele','Ukulele']]){
    const identity=socialIdentity(`https://preview.example/?instrument=${instrument}&key=secret`);
    assert.equal(identity.instrument,instrument);
    assert.match(identity.url,/^https:\/\/fretboard-hero\.com\//);
    assert.ok(!identity.url.includes('secret'));
    const html=renderSocialHtml(template,identity);
    assert.ok(html.includes(`<title>${name} Fretboard Hero`));
    assert.ok(html.includes(`assets/og/${key}.jpg?v=10.22.0`));
    assert.ok(html.includes(`assets/icons/${key}/apple-touch-icon.png`));
    assert.ok(html.includes(`manifests/${key}.webmanifest`));
    assert.doesNotMatch(html,/workers\.dev|seignemorte\.com/);
  }
  assert.equal(socialIdentity('https://preview.example/?instrument=__proto__').instrument,'guitar');
});

test('Share worker leaves static assets alone and returns correct instrument HTML for GET and HEAD',async()=>{
  const {default:worker}=await import('../../server/social.mjs');
  const template=fs.readFileSync('web/index.html','utf8'),requests=[];
  const env={ASSETS:{fetch:async request=>{requests.push(request.url);return new Response(template,{headers:{'content-type':'text/html','etag':'old','content-length':'123'}})}}};
  for(const method of ['GET','HEAD']){
    const response=await worker.fetch(new Request('https://fretboard-hero.com/?instrument=bass-4',{method}),env);
    assert.equal(response.status,200);assert.equal(response.headers.get('etag'),null);
    const body=await response.text();
    if(method==='HEAD')assert.equal(body,'');else assert.match(body,/<title>Bass Fretboard Hero/);
    assert.equal(requests.at(-1),'https://fretboard-hero.com/');
  }
  await worker.fetch(new Request('https://fretboard-hero.com/assets/loading/instruments.gif'),env);
  assert.equal(requests.at(-1),'https://fretboard-hero.com/assets/loading/instruments.gif');
});

test('All declared web icon dimensions exist, and the loader supports reduced motion',()=>{
  for(const key of ['guitar','bass','ukulele']){
    for(const file of [`icon-1024.png`,`icon-192.png`,`icon-512.png`,`icon-maskable-192.png`,`icon-maskable-512.png`,`apple-touch-icon.png`,... [16,32,48,64,96,128,144,152,167,180,192,256,384,512].map(n=>`favicon-${n}.png`)]){
      const data=fs.readFileSync(`web/assets/icons/${key}/${file}`);
      const expected=file==='apple-touch-icon.png'?180:Number(file.match(/(\d+)\.png$/)[1]);
      assert.equal(data.readUInt32BE(16),expected,file);assert.equal(data.readUInt32BE(20),expected,file);
    }
  }
  const html=fs.readFileSync('web/index.html','utf8');
  assert.match(html,/<source media="\(prefers-reduced-motion: reduce\)"/);
  assert.ok(fs.readFileSync('web/assets/loading/instruments.gif').subarray(0,6).toString().startsWith('GIF8'));
});

test('Quiz shares the selected instrument on the public site while stripping private parameters',()=>{
  const source=fs.readFileSync('web/app.js','utf8');
  const functionSource=source.slice(source.indexOf('  function quizShareUrl(){'),source.indexOf("  $('#shareScore').addEventListener"));
  for(const instrument of ['guitar','bass-4','ukulele']){
    const context={URL,FRETBOARD_SITE_CONFIG:{instrument,publicUrl:'https://fretboard-hero.com/?key=secret#test'},location:{href:'https://preview.example/?key=secret'}};
    vm.createContext(context);vm.runInContext(functionSource+';result=quizShareUrl()',context);
    const url=new URL(context.result);assert.equal(url.origin,'https://fretboard-hero.com');assert.equal(url.searchParams.get('key'),null);assert.equal(url.hash,'');
    assert.equal(url.searchParams.get('instrument'),instrument==='guitar'?null:instrument);
  }
});
