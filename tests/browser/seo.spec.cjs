const {test,expect,visibleDrawing}=require('./fixtures.cjs');

test.describe('Public guides without JavaScript',()=>{
 test.use({javaScriptEnabled:false});
 test('French and English guides are readable, linked and usable on the current viewport',async({page,request})=>{
  const sitemap=await request.get('/sitemap.xml');expect(sitemap.status()).toBe(200);
  const urls=[...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]).pathname).filter(p=>/^\/(fr|en)\//.test(p));
  expect(urls).toHaveLength(12);
  for(const url of urls){
   const response=await page.goto(url);expect(response.status()).toBe(200);
   await expect(page.locator('html')).toHaveAttribute('lang',url.startsWith('/fr/')?'fr':'en');
   await expect(page.locator('h1')).toBeVisible();await expect(page.locator('.guide-section').first()).toBeVisible();
   await expect(page.locator('[data-exercise-link]')).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  }
  await page.goto('/fr/guitare/pentatonique/');
  await page.getByRole('link',{name:'English',exact:true}).click();
  await expect(page).toHaveURL(/\/en\/guitar\/pentatonic-scales\/$/);
  const question=page.locator('details').first();await question.locator('summary').click();await expect(question.locator('p')).toBeVisible();
 });
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
