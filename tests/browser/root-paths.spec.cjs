const {test,expect,configure,ready,openMenu,drawer,choose}=require('./fixtures.cjs');
async function start(page,{locale='fr',unlocked=false}={}){
  await page.addInitScript(()=>localStorage.setItem('fretboard-routine-microphone','off'));
  await configure(page,{unlocked});await page.goto(`/?instrument=guitar&lang=${locale}`);await ready(page);
  await page.clock.install();await openMenu(page,'routine');
}
async function next(page){await page.locator('#routineNext').click();await page.clock.runFor(2800)}
const numbers=page=>page.locator('#routineTab .routine-note-number');
test('Root octaves: guided and memory round trips, reveal, resize and the second diagonal',async({page})=>{
  await start(page);
  await expect(page.locator('#routineTitle')).toHaveText('Relie les fondamentales La');
  await expect(numbers(page)).toHaveText(['5','7','10','7','5']);
  await expect(page.locator('#routineContext')).toHaveText('Diagonale 1 · Aller-retour guidé');
  await expect(page.locator('#routineLegend')).toContainText('Aller : +2, puis +3 cases');
  await expect(page.locator('#routineNext')).toHaveText('Essaie de mémoire →');
  await next(page);
  await expect(numbers(page)).toHaveText(['5','?','?','?','?']);
  await expect(page.locator('#routineContext')).toHaveText('Diagonale 1 · De mémoire');
  await expect(page.locator('#routineTab title')).not.toContainText('case 10');
  const size=page.viewportSize();await page.setViewportSize({width:size.height,height:size.width});await page.clock.runFor(150);
  await expect(numbers(page)).toHaveText(['5','?','?','?','?']);
  await page.setViewportSize(size);await page.clock.runFor(150);
  await page.locator('#routineRootReveal').click();await expect(numbers(page)).toHaveText(['5','7','10','7','5']);
  await expect(page.locator('#routineRootReveal')).toBeHidden();
  await next(page);await expect(numbers(page)).toHaveText(['12','14','17','14','12']);
  await next(page);await expect(numbers(page)).toHaveText(['12','?','?','?','?']);
  await next(page);await expect(page.locator('#routineSteps button').nth(1)).toHaveAttribute('aria-current','step');
  await expect(page.locator('#routineRootReveal')).toBeHidden();
  await page.locator('#routineSteps button').first().click();await expect(numbers(page)).toHaveText(['5','7','10','7','5']);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('Every root and quality keeps a fretted, transposed first diagonal',async({page})=>{
  await start(page,{locale:'en',unlocked:true});
  const roots=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  for(const [pc,root] of roots.entries())for(const quality of ['minor','major']){
    await drawer(page,'routine',true);
    await choose(page,'routineRootControls','data-value',root);await choose(page,'routineQualityControls','data-value',quality);
    await drawer(page,'routine',false);
    const fret=((pc-4+12)%12)||12;
    await expect(numbers(page)).toHaveText([fret,fret+2,fret+5,fret+2,fret].map(String));
    await expect(page.locator('#routineRootReveal')).toBeHidden();
  }
});
