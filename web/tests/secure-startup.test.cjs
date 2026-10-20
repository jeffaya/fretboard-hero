const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const bootstrap=fs.readFileSync('web/bootstrap.js','utf8');
function start(href){
 const location=new URL(href),redirects=[],reachedDOM=new Error('Normal startup'),document={querySelector(){throw reachedDOM}};
 location.replace=url=>redirects.push(url);
 try{vm.runInNewContext(bootstrap,{location,URL,document})}catch(error){if(error!==reachedDOM)throw error}
 return redirects;
}
test('HTTP visits to the official site use HTTPS before startup and retain instrument, language and fragment',()=>{
 for(const host of ['fretboard-hero.com','www.fretboard-hero.com']){
  assert.deepEqual(start(`http://${host}/?instrument=ukulele&lang=fr#learn`),[`https://${host}/?instrument=ukulele&lang=fr#learn`]);
 }
});
test('Secure visits, native app origins and development URLs are not redirected',()=>{
 for(const url of ['https://fretboard-hero.com/','capacitor://localhost/','http://localhost/','http://127.0.0.1:8080/','http://192.168.1.5/','http://example.com/','http://fretboard-hero.com.example.com/'])assert.deepEqual(start(url),[],url);
});
