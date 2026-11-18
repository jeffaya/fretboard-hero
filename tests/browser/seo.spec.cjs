const {test,expect,visibleDrawing,ready,installStore}=require('./fixtures.cjs');

for(const [locale,route,description,learn,heading,triads,penta] of [
 ['fr','/fr/guitare/','Explications, schémas et conseils','Pratiquez sur le manche interactif','Comprends le manche. Joue ce que tu vois.','triades/','pentatonique/'],
 ['en','/en/guitar/','Explanations, diagrams and tips','Practice on the interactive fretboard','Understand the neck. Play what you see.','triads/','pentatonic-scales/']
])test(`Home Music theory card opens the topic index and links between articles (${locale})`,async({page})=>{
 await page.goto(`/?instrument=guitar&lang=${locale}`);await ready(page);
 const guide=page.locator('#home .guide-card');await expect(guide).toBeVisible();
 await expect(guide.locator('strong')).toHaveText(locale==='fr'?'Théorie musicale':'Music theory');
 await expect(guide.locator('small')).toHaveText(description);
 await expect(page.locator('#home .learn-card small')).toHaveText(learn);
 await expect(guide).toHaveAttribute('href',route);
 await expect(guide).not.toHaveAttribute('target','_blank');
 await expect.poll(()=>guide.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 expect(await guide.evaluate(node=>getComputedStyle(node).getPropertyValue('--ui-accent').trim())).toBe('#ff6b6b');
 const [card,grid]=await Promise.all([guide.boundingBox(),guide.locator('..').boundingBox()]);
 expect(card.width).toBeCloseTo(grid.width,0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await guide.focus();await page.keyboard.press('Enter');
 await expect(page).toHaveURL(new RegExp(route+'$'));await expect(page.getByRole('heading',{level:1,name:heading})).toBeVisible();
 await expect(page.locator('.related-pages .card')).toHaveCount(6);
 expect(await page.locator('.related-pages').evaluate(node=>!!(node.compareDocumentPosition(document.querySelector('.lesson-body'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 await page.locator(`.related-pages a[href="${route+triads}"]`).click();
 await expect(page).toHaveURL(new RegExp(route+triads+'$'));
 await page.locator(`.page-nav a[href="${route+penta}"]`).click();
 await expect(page).toHaveURL(new RegExp(route+penta+'$'));
 await expect(page.locator('.diagram').first()).toBeVisible();
});

test('Native Guide points to the public site without requiring a purchase',async({page})=>{
 await installStore(page,{platform:'android',owned:false});
 await page.goto('/?instrument=guitar&lang=fr');await ready(page);
 const guide=page.locator('.guide-card');await expect(guide).toBeVisible();
 await expect(guide).toHaveAttribute('href','https://fretboard-hero.com/fr/guitare/');
 await expect(guide).toHaveAttribute('target','_blank');
 await expect(guide).toHaveAttribute('rel','noopener noreferrer');
 await expect(page.locator('body')).toHaveAttribute('data-access','demo');
});

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
  await page.getByRole('link',{name:'English',exact:true}).click();
  await expect(page).toHaveURL(/\/en\/guitar\/pentatonic-scales\/$/);
  await expect(page.locator('.lesson-body .content-section')).toHaveCount(7);
 });
 test('Privacy retains every translation and anchor navigation without JavaScript',async({page})=>{
  await page.goto('/privacy');
  await expect(page.locator('article[lang]')).toHaveCount(11);
  for(const article of await page.locator('article[lang]').all())await expect(article).toBeVisible();
  await page.locator('.home-footer').getByRole('link',{name:'English',exact:true}).click();
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
   const style=getComputedStyle(header),footer=getComputedStyle(document.querySelector('.site-footer,.home-footer'));
   return {font:style.fontFamily,color:style.color,width:style.width,border:style.borderBottomColor,footerFont:footer.fontFamily,footerWidth:footer.width};
  });
  if(expected)expect(shell).toEqual(expected);else expected=shell;
  expect(shell.font).toContain('Hero Condensed');
  await expect(page.locator('.brand svg image')).toHaveAttribute('href',/assets\/home\/product-wordmarks\.webp$/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 }
 await expect(page.locator('.brand')).toHaveAttribute('aria-label','Ukulele Fretboard Hero');
 await expect(page.locator('article[lang]:visible')).toHaveCount(1);
 await page.locator('.home-footer .language-trigger').click();
 await page.getByRole('menuitemradio',{name:'English',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await expect(page.locator('#en-title')).toBeVisible();
 await expect(page.locator('.site-header .brand')).toHaveAttribute('href','./?lang=en&instrument=ukulele');
 await page.locator('.home-footer .language-trigger').click();await page.keyboard.press('Escape');
 await expect(page.locator('.home-footer .language-trigger')).toHaveAttribute('aria-expanded','false');
 await page.emulateMedia({media:'print'});
 await expect(page.locator('.site-header')).toBeHidden();await expect(page.locator('.home-footer')).toBeHidden();
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

test('Guide retains the shared footer dialog without a promotional hero button',async({page})=>{
 await page.goto('/?lang=fr&instrument=guitar');await ready(page);
 const footerStyle=()=>page.locator('.home-footer button.home-footer-link:not(.language-trigger)').evaluate(node=>{
  const s=getComputedStyle(node);return {font:s.font,color:s.color,padding:s.padding,border:s.border,background:s.backgroundColor};
 });
 const homeStyle=await footerStyle();
 await page.goto('/fr/guitare/pentatonique/');
 await expect(page.locator('.site-header .language-picker,.site-header details')).toHaveCount(0);
 await expect(page.locator('.home-footer .language-trigger')).toBeVisible();
 await expect.poll(footerStyle).toEqual(homeStyle);
 const title=await page.title(),canonical=await page.locator('link[rel="canonical"]').getAttribute('href');
 await expect(page.locator('[data-get-app],.byline,.page-aside')).toHaveCount(0);
 for(const trigger of [page.locator('.home-footer button.home-footer-link:not(.language-trigger)')]){
  await trigger.click();await expect(page.locator('.premium-dialog')).toBeVisible();
  await expect(page.locator('.premium-overlay')).toHaveCount(1);await expect(page).toHaveURL(/\/fr\/guitare\/pentatonique\/$/);
  await expect(page.locator('.premium-skills li')).toHaveCount(5);
  await expect(page.locator('.premium-stores a')).toHaveAttribute('href',/id=com.guitar.fretboardhero/);
  await page.locator('.premium-dialog .ui-modal-close').click();await expect(page.locator('.premium-overlay')).toBeHidden();await expect(trigger).toBeFocused();
 }
 expect(await page.title()).toBe(title);expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(canonical);
 await page.locator('.home-footer .language-trigger').click();await page.getByRole('menuitemradio',{name:'English',exact:true}).click();
 await expect(page).toHaveURL(/\/en\/guitar\/pentatonic-scales\/$/);await expect(page.locator('.home-footer .language-trigger')).toContainText('English');
 await expect(page.locator('html')).toHaveAttribute('lang','en');
});

for(const [locale,label] of [['hi','हिन्दी'],['ja','日本語'],['ko','한국어'],['zh-CN','简体中文'],['es','Español'],['de','Deutsch'],['it','Italiano'],['id','Bahasa Indonesia'],['pt-BR','Português (Brasil)']])test(`Translated lessons and chord selection retain instrument and language: ${locale}`,async({page})=>{
 await page.goto(`/?instrument=ukulele&lang=${locale}`);await ready(page);
 await expect(page.locator('.guide-card')).toHaveAttribute('href',`/${locale}/ukulele/`);
 await page.locator('.guide-card').click();
 await page.locator(`.page-nav a[href="/${locale}/ukulele/chords/"]`).click();
 await expect(page.locator('html')).toHaveAttribute('lang',locale);
 await expect(page.locator('.brand')).toHaveAttribute('aria-label','Ukulele Fretboard Hero');
 await expect(page.locator('.brand svg')).toHaveAttribute('viewBox','1800 0 900 550');
 await expect(page.locator('[data-chord-root]')).toHaveCount(12);
 await page.locator('[data-chord-root="1"]').click();
 const sharpC={hi:'सी♯',ja:'ド♯',ko:'도♯','zh-CN':'C♯',es:'Do♯',de:'C♯',it:'Do♯',id:'Do♯','pt-BR':'Dó♯'};
 await expect(page.locator('[data-chord-family="m7"] h2')).toContainText(sharpC[locale]+'m7');
 await expect(page.locator('[data-chord-family]')).toHaveCount(12);
 await expect(page.locator('[data-chord-family="m7"] figure')).toHaveCount(2);
 await expect(page.locator('.home-footer .language-trigger')).toContainText(label);
 await expect(page.locator('.home-footer a[href*="privacy"]')).toHaveAttribute('href',new RegExp(`lang=${locale}&instrument=ukulele`));
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.locator('.home-footer .language-trigger').click();await page.getByRole('menuitemradio',{name:'Français',exact:true}).click();
 await expect(page).toHaveURL(/\/fr\/ukulele\/accords\/\?root=1$/);
 await expect(page.locator('[data-chord-family="m7"] h2')).toContainText('Do♯m7');
});

test('Root selection shows every chord family, preserves links and has no outer border',async({page},testInfo)=>{
 await page.goto('/en/guitar/chords/?root=9&quality=major');
 await expect(page).toHaveURL(/\/en\/guitar\/chords\/\?root=9$/);
 await expect(page.locator('#chord-quality')).toHaveCount(0);
 await expect(page.locator('[data-chord-family]')).toHaveCount(12);
 await expect(page.locator('[data-chord-family] h2')).toHaveText([
  'A · Major','Am · Minor','A7 · Dominant 7th','Am7 · Minor 7th','Amaj7 · Major 7th','A6 · Major 6th',
  'Am6 · Minor 6th','Asus2 · Suspended 2nd','Asus4 · Suspended 4th','Adim · Diminished','Aaug · Augmented','Aadd9 · Added 9th'
 ]);
 for(const selector of ['.chord-explorer','.root-picker']){
  expect(await page.locator(selector).evaluate(node=>{
   const style=getComputedStyle(node);return ['Top','Right','Bottom','Left'].every(side=>style['border'+side+'Width']==='0px');
  })).toBe(true);
 }
 await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,document.querySelector('.root-picker').getBoundingClientRect().top+scrollY-24)});
 await page.screenshot({path:testInfo.outputPath('chords-all-families.png')});
 await page.goto('/fr/guitare/accords/');
 const major=page.locator('[data-chord-family="major"]');
 await expect(major.locator('figure')).toHaveCount(4);
 await expect(major.locator('.fret-code')).toHaveText(['3 · 2 · 0 · 0 · 0 · 3','3 · 2 · 0 · 0 · 3 · 3','3 · 5 · 5 · 4 · 3 · 3','× · 10 · 12 · 12 · 12 · 10']);
 await page.locator('[data-chord-root="10"]').focus();await page.keyboard.press('Enter');
 await expect(page.locator('[data-chord-root="10"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#chord-summary')).toContainText('Si♭');
 await expect(page.locator('[data-chord-family="dim"] h2')).toContainText('Si♭dim');
 await page.reload();await expect(page.locator('[data-chord-family="dim"] h2')).toContainText('Si♭dim');
 await expect(page.locator('nav a[href*="/basse/"]')).toHaveCount(0);
 await page.locator('.site-header .brand').click();await ready(page);
 await page.locator('[data-home-instrument="bass-4"]').click();
 await expect(page.locator('.guide-card')).toHaveAttribute('href','/fr/basse/');
 await page.locator('.guide-card').click();
 await page.locator('.page-nav a[href="/fr/basse/accords/"]').click();
 await expect(page.locator('.brand')).toHaveAttribute('aria-label','Bass Fretboard Hero');
 await page.goto('/fr/basse/accords/?root=10');
 await expect(page).toHaveURL(/\/fr\/basse\/accords\/\?root=10$/);
 await expect(page.locator('.brand')).toHaveAttribute('aria-label','Bass Fretboard Hero');
 await expect(page.locator('[data-chord-family]')).toHaveCount(12);
 await expect(page.locator('#chord-positions .neck-diagram')).toHaveCount(24);
 await expect(page.locator('[data-chord-family="dim"] h2')).toContainText('Si♭dim');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

for(const [instrument,frSlug,strings]of [['guitar','guitare',6],['bass','basse',4],['ukulele','ukulele',4]])test(`Tablature lessons are readable in all 11 languages: ${instrument}`,async({page},testInfo)=>{
 for(const locale of ['en','fr','es','de','it','pt-BR','hi','id','ja','ko','zh-CN']){
  const route=locale==='fr'?`/fr/${frSlug}/lire-les-tablatures/`:`/${locale}/${instrument}/reading-tablature/`;
  await page.goto(route);await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('html')).toHaveAttribute('lang',locale);
  await expect(page.locator('.tab-diagram')).toHaveCount(2);
  await expect(page.locator('.orientation-diagram')).toHaveCount(3);
  for(const diagram of await page.locator('.orientation-diagram').all()){
   await expect(diagram.locator('path[data-string]')).toHaveCount(strings);
   await expect(diagram.locator('g[data-fret]')).toHaveCount(3);
  }
  await expect(page.locator('.tab-diagram').first().locator('.tab-string')).toHaveCount(strings);
  await expect(page.locator('.symbol-table tbody tr')).toHaveCount(10);
  await expect(page.locator('.lesson-sources a')).toHaveCount(3);
  await expect(page.locator('.home-footer .language-trigger')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const svg=await page.locator('.tab-diagram').first().boundingBox();expect(svg.width).toBeGreaterThan(240);
  await page.locator('.tab-transcript summary').click();await expect(page.locator('.tab-transcript>ol')).toBeVisible();
  if(locale==='fr'||(instrument==='bass'&&locale==='hi')||(instrument==='ukulele'&&locale==='ja')){
   await page.screenshot({path:testInfo.outputPath(`guide-${instrument}-${locale}.png`),fullPage:true});
   await page.locator('.tab-orientation').screenshot({path:testInfo.outputPath(`orientation-${instrument}-${locale}.png`)});
  }
 }
});

test('Privacy shares guide footer language and download controls',async({page},testInfo)=>{
 await page.goto('/privacy?lang=hi&instrument=bass-4');
 await expect(page.locator('.site-header .language-picker,.site-header details')).toHaveCount(0);
 await expect(page.locator('.home-footer .language-trigger')).toContainText('हिन्दी');
 await expect(page.locator('.home-footer a[href*="privacy"]')).toHaveAttribute('href',/lang=hi&instrument=bass-4/);
 await expect(page.locator('.home-footer a[href^="mailto:"]')).not.toHaveText('Nous contacter');
 await page.locator('.home-footer button.home-footer-link:not(.language-trigger)').click();
 await expect(page.locator('.premium-dialog')).toBeVisible();
 await expect(page.locator('.premium-stores a')).toHaveAttribute('href',/id=com.bass.fretboardhero/);
 await page.locator('.premium-dialog .ui-modal-close').click();
 await page.locator('.home-footer .language-trigger').click();
 await page.getByRole('menuitemradio',{name:'日本語',exact:true}).click();
 await expect(page).toHaveURL(/privacy\?lang=ja&instrument=bass-4$/);
 await expect(page.locator('article[lang]:visible')).toHaveCount(1);
 await expect(page.locator('article[lang="ja"]')).toBeVisible();
 await expect(page.locator('.home-footer .language-trigger')).toContainText('日本語');
 await expect(page.locator('.home-footer a[href*="privacy"]')).toHaveAttribute('href',/lang=ja&instrument=bass-4/);
 await expect(page.locator('.brand')).toHaveAttribute('aria-label','Bass Fretboard Hero');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.locator('.home-footer').screenshot({path:testInfo.outputPath('privacy-footer-ja.png')});
});
