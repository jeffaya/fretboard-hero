const {test,expect,ready,openMenu,installStore}=require('./fixtures.cjs');
const routes={routine:'/practice/daily-routine',learn:'/practice/learn',quiz:'/practice/quiz',fretmap:'/explore/fretboard-map',circle:'/explore/circle-of-fifths',tuner:'/tuner'};
async function loaded(page){await expect(page.locator('body')).toHaveAttribute('aria-busy','false');await expect(page.locator('#startupLoader')).toBeHidden()}
async function closeButton(page,panel){
 const button=page.locator(`${panel} .ui-modal-close`);await expect(button).toBeVisible();
 // Measure once the entrance animation has settled and the control can be tapped.
 await button.click({trial:true});
 const bounds=await button.boundingBox(),container=await page.locator(panel).boundingBox();
 // Firefox can report 43.999984px for a 44px control; compare at CSS hundredth precision.
 expect(Math.round(bounds.width*100)/100).toBeGreaterThanOrEqual(44);expect(Math.round(bounds.height*100)/100).toBeGreaterThanOrEqual(44);
 expect(bounds.x-container.x).toBeLessThan(50);expect(bounds.y-container.y).toBeLessThan(50);
 await button.click();
}

test('Home links share one full-width row layout on small and large screens',async({page})=>{
 for(const lang of ['en','fr']){
  await page.goto('/?lang='+lang);await ready(page);
  for(const viewport of [{width:320,height:740},{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){
   await page.setViewportSize(viewport);
   const cards=await page.locator('#home .hero-btn').evaluateAll(nodes=>nodes.map(node=>{
    const box=node.getBoundingClientRect(),title=node.querySelector('strong'),style=getComputedStyle(title);
    return {tag:node.tagName,x:box.x,width:box.width,height:box.height,font:style.fontSize,columns:getComputedStyle(node).gridTemplateColumns};
   }));
   expect(cards).toHaveLength(7);
   for(const card of cards){expect(card.tag).toBe('A');expect(card.x).toBeCloseTo(cards[0].x,0);expect(card.width).toBeCloseTo(cards[0].width,0);expect(card.height).toBeCloseTo(cards[0].height,0);expect(card.font).toBe(cards[0].font);expect(card.columns).toBe(cards[0].columns)}
  }
 }
});

for(const instrument of ['guitar','bass-4','ukulele'])test(`${instrument}: every section opens directly and survives reload`,async({page})=>{
 test.setTimeout(120000);
 await page.addInitScript(()=>{localStorage.setItem('fretboard-routine-microphone','off');localStorage.setItem('fretboard-tuner-microphone','off')});
 for(const [screen,path] of Object.entries(routes)){
  await page.goto(`${path}?instrument=${instrument}&lang=fr`);await loaded(page);
  const surface=screen==='tuner'?'.tuner-dialog':`#${screen}`;
  await expect(page.locator(surface)).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-instrument',instrument);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',`https://fretboard-hero.com${path}${instrument==='guitar'?'':'?instrument='+instrument}`);
  await page.reload();await loaded(page);await expect(page.locator(surface)).toBeVisible();
 }
});

test('Links preserve new-tab behavior, and browser back/forward restores the selected section',async({page})=>{
 await page.goto('/?instrument=bass-4&lang=en');await ready(page);
 const href=await page.locator('#home [data-go="learn"]').getAttribute('href');
 expect(href).toContain('/practice/learn?');expect(href).toContain('instrument=bass-4');
 const popup=await page.context().newPage();await popup.goto(href);await loaded(popup);await expect(popup.locator('#learn')).toBeVisible();await popup.close();
 await openMenu(page,'learn');await expect(page).toHaveURL(/\/practice\/learn\?/);
 await page.goBack();await expect(page.locator('#home')).toBeVisible();
 await page.goForward();await expect(page.locator('#learn')).toBeVisible();
 await page.locator('#learn [data-go="home"]').click();await expect(page).toHaveURL(/\/\?instrument=bass-4&lang=en$/);
});

test('Every modal has a reachable top-left close button, including quiz results and routine transitions',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('fretboard-routine-microphone','off');localStorage.setItem('fretboard-tuner-microphone','off')});
 await page.goto('/?lang=en');await ready(page);await page.clock.install();
 await page.locator('#homeTuner').click();await closeButton(page,'.tuner-dialog');await expect(page.locator('.tuner-dialog')).toBeHidden();
 await expect(page.locator('#homeTuner')).toBeFocused();
 await page.locator('.home-footer button.home-footer-link:not(.language-trigger)').click();await closeButton(page,'.premium-dialog');await expect(page.locator('.premium-overlay')).toBeHidden();
 await openMenu(page,'quiz');await closeButton(page,'#quizIntroView');await expect(page.locator('#home')).toBeVisible();
 await openMenu(page,'quiz');await page.locator('#introRankLadder').click();await closeButton(page,'#rankLadderView');await expect(page.locator('#resultModal')).not.toHaveClass(/show/);
 await openMenu(page,'quiz');await page.locator('#startQuizButton').click();await page.clock.fastForward(61000);
 await closeButton(page,'#quizResultView');await expect(page.locator('#home')).toBeVisible();
 await page.clock.fastForward(61000);await expect(page.locator('#resultModal')).not.toHaveClass(/show/);
 await openMenu(page,'routine');await page.locator('#routineNext').click();await page.clock.runFor(400);
 await closeButton(page,'#routineTransition');await expect(page.locator('#routineTransition')).toBeHidden();await expect(page.locator('#routineNext')).toBeEnabled();
 const title=await page.locator('#routineTitle').textContent();await page.clock.fastForward(3000);await expect(page.locator('#routineTitle')).toHaveText(title);
});

test('Native in-app navigation keeps local asset URLs and the purchase close button restores focus',async({page})=>{
 await installStore(page,{platform:'ios',owned:false});await page.goto('/?instrument=guitar&lang=en');await ready(page);
 const url=page.url();await openMenu(page,'learn');expect(page.url()).toBe(url);
 await page.locator('#learn [data-go="home"]').click();
 const trigger=page.locator('.home-footer button.home-footer-link:not(.language-trigger)');await trigger.click();
 await closeButton(page,'.premium-dialog');await expect(page.locator('.premium-overlay')).toBeHidden();await expect(trigger).toBeFocused();
});
