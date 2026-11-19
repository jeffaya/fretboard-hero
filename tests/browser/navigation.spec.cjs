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
 expect(container.x+container.width-bounds.x-bounds.width).toBeLessThan(12);expect(bounds.y-container.y).toBeLessThan(12);
 const style=await button.evaluate(node=>{const s=getComputedStyle(node);return {background:s.backgroundColor,border:s.borderTopWidth,shadow:s.boxShadow,color:s.color}});
 expect(style).toEqual({background:'rgba(0, 0, 0, 0)',border:'0px',shadow:'none',color:'rgb(255, 255, 255)'});
 expect(await button.locator('svg').evaluate(node=>node.getBoundingClientRect().width)).toBeLessThanOrEqual(20);
 await button.click();
}

test('Home keeps the phone menu and arranges desktop activities in two groups', async ({page}) => {
  const sizes = [[320, 740], [390, 844], [844, 390], [768, 1024], [1440, 900]];
  for (const lang of ['en', 'fr']) {
    await page.goto('/?lang=' + lang);
    await ready(page);
    for (const [width, height] of sizes) {
      await page.setViewportSize({width, height});
      const {touch, logo, instruments, tuner, cards, overflows} = await page.locator('#home').evaluate(home => {
        function bounds(node) {
          const {x, y, right, bottom, width} = node.getBoundingClientRect();
          return {x, y, right, bottom, width};
        }
        return {
          touch: matchMedia('(pointer: coarse)').matches,
          logo: bounds(home.querySelector('.hero-logo')),
          instruments: bounds(home.querySelector('.home-instruments')),
          tuner: bounds(home.querySelector('#homeTuner')),
          cards: Array.from(home.querySelectorAll('.home-actions a.hero-btn'), bounds),
          overflows: home.scrollWidth > home.clientWidth
        };
      });
      expect(cards).toHaveLength(6);
      expect(overflows).toBe(false);
      if (width < 600 || (touch && width === 844)) {
        let previous = tuner;
        for (const card of cards) {
          expect(card.x).toBeCloseTo(tuner.x, 0);
          expect(card.width).toBeCloseTo(tuner.width, 0);
          expect(card.y).toBeGreaterThanOrEqual(previous.bottom);
          previous = card;
        }
      } else {
        expect(instruments.x).toBeGreaterThan(logo.right);
        expect(tuner.x).toBeCloseTo(instruments.x, 0);
        expect(tuner.width).toBeCloseTo(instruments.width, 0);
        expect(tuner.y).toBeGreaterThan(instruments.bottom);
        expect(cards[0].y).toBeGreaterThan(tuner.bottom);
        if (width < 800) {
          expect(cards[3].x).toBeGreaterThan(cards[0].right);
          expect(cards[3].y).toBeCloseTo(cards[0].y, 0);
          for (const i of [1, 2, 4, 5]) expect(cards[i].y).toBeGreaterThan(cards[i - 1].bottom);
        } else {
          for (const i of [1, 2, 4, 5]) {
            expect(cards[i].x).toBeGreaterThan(cards[i - 1].right);
            expect(cards[i].y).toBeCloseTo(cards[i - 1].y, 0);
          }
          expect(cards[3].y).toBeGreaterThan(cards[0].bottom);
          for (let i = 0; i < 3; i++) expect(cards[i].x).toBeCloseTo(cards[i + 3].x, 0);
        }
      }
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
  const prefix = 'https://fretboard-hero.com'+path+(instrument==='guitar'?'?':'?instrument='+instrument+'&');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',prefix+'lang=fr');
  await expect(page.locator('link[rel="alternate"][hreflang="ru"]')).toHaveAttribute('href',prefix+'lang=ru');
  await page.reload();await loaded(page);await expect(page.locator(surface)).toBeVisible();
 }
});

test('Translated metadata follows the active screen and instrument when using browser history',async({page})=>{
 for(const [lang,instrument] of [['ar','guitar'],['bn','bass-4'],['ru','ukulele']]){
  await page.goto('/?instrument='+instrument+'&lang='+lang);await ready(page);
  const query=instrument==='guitar'?'?lang='+lang:'?instrument='+instrument+'&lang='+lang;
  const home='https://fretboard-hero.com/'+query;
  const canonical=page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute('href',home);
  await openMenu(page,'fretmap');
  const map=home.replace('/?', '/explore/fretboard-map?');
  await expect(canonical).toHaveAttribute('href',map);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(15);
  await expect(page.locator('link[rel="alternate"][hreflang="'+lang+'"]')).toHaveAttribute('href',map);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content',map);
  const data=JSON.parse(await page.locator('#productStructuredData').textContent());
  expect(data.url).toBe(map);expect(data.inLanguage).toBe(lang);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content',data.description);
  await page.goBack();
  await expect(canonical).toHaveAttribute('href',home);
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

test('Every modal has a reachable top-right close cross, including quiz results and routine transitions',async({page})=>{
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
