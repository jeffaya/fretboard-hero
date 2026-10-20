const {test:base,expect}=require('@playwright/test');
const test=base.extend({page:async({page},use)=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`)});
  await use(page);
  expect(errors,'Uncaught JavaScript errors or failed resource loads').toEqual([]);
}});

async function configure(page,overrides={}){
  await page.route('**/site.config.json',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,json:{...await response.json(),...overrides}});
  });
}
async function ready(page){
  await expect(page.locator('body')).toHaveAttribute('aria-busy','false');
  await expect(page.locator('#startupLoader')).toBeHidden();
  await expect(page.locator('#home')).toBeVisible();
}
async function openMenu(page,name){
  await page.locator(`#home [data-go="${name}"]`).click();
  await expect(page.locator(`#${name}`)).toBeVisible();
}
async function home(page,name){await page.locator(`#${name} [data-go="home"]`).click();await expect(page.locator('#home')).toBeVisible()}
async function drawer(page,name,open){
  const button=page.locator(`#${name}MenuBtn`);
  if(await button.isVisible()){
    if(open&&await button.getAttribute('aria-expanded')!=='true')await button.click();
    if(!open&&await button.getAttribute('aria-expanded')==='true')await page.locator(`#${name}MenuClose`).click();
  }
}
async function choose(page,source,attribute,value){
  const button=page.locator(`#${source} button[${attribute}="${value}"]`);
  if(await button.isVisible())return button.click();
  const index=await button.evaluate(node=>[...node.parentElement.querySelectorAll('button')].indexOf(node));
  const select=page.locator(`[data-select-for="${source}"]`);
  await select.locator('.select-trigger').click();
  await select.locator('.select-option').nth(index).click();
}
async function visibleDrawing(page,selector,{strings,notes=true,minHeight=120}={}){
  const svg=page.locator(selector);
  await expect(svg).toBeVisible();await svg.scrollIntoViewIfNeeded();
  await expect.poll(async()=>{
    const box=await svg.boundingBox();return !!box&&box.width>100&&box.height>=minHeight;
  },{message:`${selector} must have a usable rendered size`}).toBe(true);
  await expect(svg).toBeInViewport();
  if(strings)await expect(svg.locator('[data-string-gauge]')).toHaveCount(strings);
  if(notes){
    const note=svg.locator('.neck-note').first();await expect(note).toBeVisible();
    await expect(note.locator('text')).not.toHaveText('');
    // A node existing in the DOM is insufficient: its ink must occupy screen space.
    const box=await note.boundingBox();expect(box.width).toBeGreaterThan(4);expect(box.height).toBeGreaterThan(4);
  }
}
async function installStore(page,{platform='android',owned=false}={}){
  await configure(page,{nativeBilling:true,unlocked:false});
  await page.addInitScript(({platform,owned})=>{
    const key='browser-test-verified-purchase';
    if(sessionStorage.getItem(key)===null)sessionStorage.setItem(key,String(owned));
    const listeners={};
    const state=()=>({unlocked:sessionStorage.getItem(key)==='true',status:sessionStorage.getItem(key)==='true'?'purchased':'not_owned'});
    const store=window.__store={get calls(){return Number(sessionStorage.getItem('browser-test-purchase-calls')||0)},result:null,fail:false,offline:false,emit:()=>listeners.purchasesChanged?.(),
      verify(value){sessionStorage.setItem(key,String(value));this.emit()}};
    const plugin={cachedState:async()=>state(),price:async()=>({price:'4,79 €'}),
      purchase:async()=>{
        sessionStorage.setItem('browser-test-purchase-calls',String(store.calls+1));
        if(store.fail)throw Object.assign(new Error('Google Play is unavailable. Please try again.'),{code:'PLAY_LAUNCH_3',data:{debugMessage:'Test diagnostic <not HTML>'}});
        const result=store.result||{unlocked:true,status:'purchased'};
        if(result.unlocked)sessionStorage.setItem(key,'true');return result;
      },
      restore:async()=>{if(store.offline)throw Error('Offline');return state()},
      refresh:async()=>{if(store.offline)throw Error('Offline');return state()},
      addListener:(name,fn)=>{listeners[name]=fn;return {remove(){delete listeners[name]}}}};
    window.Capacitor={getPlatform:()=>platform,Plugins:{[platform==='ios'?'StoreBilling':'PlayBilling']:plugin,App:{addListener:()=>({remove(){}})}}};
  },{platform,owned});
}
module.exports={test,expect,configure,ready,openMenu,home,drawer,choose,visibleDrawing,installStore};
