const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(native){const context={window:{},document:{createElement:()=>({setAttribute(){},addEventListener(){}})}};vm.runInNewContext(fs.readFileSync('web/core/modal.js','utf8'),context);const events={};let closed=0;const surface={classList:{add(){}},prepend(){},querySelectorAll:()=>[],tagName:native?'DIALOG':'DIV',getBoundingClientRect:()=>({left:20,top:20,right:200,bottom:200}),addEventListener:(type,fn)=>events[type]=fn};context.window.FretboardModal.bindDismiss(surface,()=>closed++);const fire=(type,target,x=5,y=5)=>events[type]({target,clientX:x,clientY:y});return {surface,fire,closed:()=>closed};}
for(const native of [false,true])test(`light dismiss ${native?'native dialog':'overlay'} respects inside clicks, drags and cancellation`,()=>{const {surface,fire,closed}=setup(native),child={};fire('pointerdown',child);fire('click',child);assert.equal(closed(),0);fire('pointerdown',child);fire('click',surface);assert.equal(closed(),0);fire('pointerdown',surface);fire('pointercancel',surface);fire('click',surface);assert.equal(closed(),0);if(native){fire('pointerdown',surface,50,50);fire('click',surface,50,50);assert.equal(closed(),0)}fire('pointerdown',surface);fire('click',surface);assert.equal(closed(),1)});

test('The explicit close button works on a click without any preceding pointerdown',()=>{
 let closed=0,added,prepended;
 const events={},attributes={};
 const button={setAttribute:(name,value)=>attributes[name]=value,addEventListener:(name,fn)=>events[name]=fn};
 const context={window:{FretboardI18n:{text:()=> 'Fermer'}},document:{createElement:()=>button}};
 vm.runInNewContext(fs.readFileSync('web/core/modal.js','utf8'),context);
 context.window.FretboardModal.addClose({classList:{add:className=>added=className},prepend:node=>prepended=node},()=>closed++);
 assert.equal(button.type,'button');assert.equal(attributes['aria-label'],'Fermer');assert.equal(added,'ui-dismissible');assert.equal(prepended,button);
 events.click({preventDefault(){},stopPropagation(){}});assert.equal(closed,1);
});
