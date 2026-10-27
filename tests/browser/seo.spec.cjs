const {test,expect,visibleDrawing}=require('./fixtures.cjs');

test.describe('Public guides without JavaScript',()=>{
 test.use({javaScriptEnabled:false});
 test('French and English guides are readable, linked and usable on the current viewport',async({page,request})=>{
  const sitemap=await request.get('/sitemap.xml');expect(sitemap.status()).toBe(200);
  const urls=[...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]).pathname).filter(p=>/^\/(fr|en)\//.test(p));
  expect(urls.length).toBeGreaterThan(0);
  for(const url of urls){
   const response=await page.goto(url);expect(response.status()).toBe(200);
   await expect(page.locator('html')).toHaveAttribute('lang',url.startsWith('/fr/')?'fr':'en');
   await expect(page.locator('h1')).toBeVisible();await expect(page.locator('.content-section').first()).toBeVisible();
   await expect(page.locator('[data-exercise-link]')).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  }
  await page.goto('/fr/guitare/pentatonique/');
  await page.locator('.language-menu summary').click();
  await page.getByRole('link',{name:'English',exact:true}).click();
  await expect(page).toHaveURL(/\/en\/guitar\/pentatonic-scales\/$/);
  const question=page.locator('.faq details').first();await question.locator('summary').click();await expect(question.locator('p')).toBeVisible();
 });
 test('Privacy retains every translation and anchor navigation without JavaScript',async({page})=>{
  await page.goto('/privacy');
  await expect(page.locator('article[lang]')).toHaveCount(11);
  for(const article of await page.locator('article[lang]').all())await expect(article).toBeVisible();
  await page.locator('.language-menu summary').click();
  await page.getByRole('link',{name:'English',exact:true}).click();
  await expect(page).toHaveURL(/\/privacy#en$/);
  await expect(page.locator('#en-title')).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 });
});

test('Privacy and guides use the same responsive shell, logo and theme',async({page})=>{
 let expected;
 for(const route of ['/fr/guitare/triades/','/en/about/','/privacy?lang=fr&instrument=ukulele']){
  await page.goto(route);await page.evaluate(()=>document.fonts.ready);
  const shell=await page.locator('.site-header').evaluate(header=>{
   const style=getComputedStyle(header),footer=getComputedStyle(document.querySelector('.site-footer'));
   return {font:style.fontFamily,color:style.color,width:style.width,border:style.borderBottomColor,footerFont:footer.fontFamily,footerWidth:footer.width};
  });
  if(expected)expect(shell).toEqual(expected);else expected=shell;
  expect(shell.font).toContain('Hero Condensed');
  await expect(page.locator('.brand svg image')).toHaveAttribute('href',/assets\/home\/product-wordmarks\.webp$/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 }
 await expect(page.locator('.brand')).toHaveAttribute('aria-label','Ukulele Fretboard Hero');
 await expect(page.locator('article[lang]:visible')).toHaveCount(1);
 await page.locator('.language-menu summary').click();
 await page.getByRole('link',{name:'English',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await expect(page.locator('#en-title')).toBeVisible();
 await expect(page.locator('.site-footer .back-link')).toHaveAttribute('href','./?lang=en&instrument=ukulele');
 await page.locator('.language-menu summary').click();await page.keyboard.press('Escape');
 await expect(page.locator('.language-menu')).not.toHaveAttribute('open','');
 await page.emulateMedia({media:'print'});
 await expect(page.locator('.site-header')).toBeHidden();await expect(page.locator('.site-footer')).toBeHidden();
 await expect(page.locator('#en-title')).toBeVisible();await expect(page.locator('article[lang]:visible')).toHaveCount(1);
});

for(const [route,screen,mode] of [
 ['/fr/guitare/pentatonique/','learn','penta'],
 ['/en/guitar/triads/','learn','triad'],
 ['/fr/guitare/notes-du-manche/','fretmap',null],
 ['/en/guitar/daily-routine/','routine',null]
])test(`Guide opens its actual exercise: ${route}`,async({page})=>{
 await page.goto(route);await page.locator('[data-exercise-link]').click();
 await expect(page.locator('body')).toHaveAttribute('aria-busy','false');
 await expect(page.locator('#startupLoader')).toBeHidden();
 await expect(page.locator('body')).toHaveAttribute('data-screen',screen);
 await expect(page.locator(`#${screen}`)).toBeVisible();
 await expect(page.locator('body')).toHaveAttribute('data-access','demo');
 if(mode)await expect(page.locator(`#modeControls button[data-mode="${mode}"]`)).toHaveClass(/active/);
 if(screen==='learn')await visibleDrawing(page,'#learnFretboard',{strings:6});
 if(screen==='fretmap')await visibleDrawing(page,'#mapFretboard',{strings:6});
 if(screen==='routine')await expect(page.locator('#routineTitle')).not.toHaveText('');
 await page.locator(`#${screen} [data-go="home"]`).click();await expect(page.locator('#home')).toBeVisible();
});

test('Unrecognized entry routes fall back to home and never bypass free access',async({page})=>{
 await page.goto('/?instrument=guitar&lang=en&screen=%23resultModal&mode=anything&unlocked=true');
 await expect(page.locator('body')).toHaveAttribute('aria-busy','false');
 await expect(page.locator('#home')).toBeVisible();
 await expect(page.locator('body')).toHaveAttribute('data-access','demo');
 await page.goto('/?instrument=guitar&lang=en&screen=learn&mode=anything');
 await expect(page.locator('body')).toHaveAttribute('aria-busy','false');
 await expect(page.locator('#learn')).toBeVisible();
 await expect(page.locator('#modeControls button[data-mode="penta"]')).toHaveClass(/active/);
});
