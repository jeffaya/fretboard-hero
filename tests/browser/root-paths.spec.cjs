const {test,expect,configure,ready,openMenu,drawer,choose}=require('./fixtures.cjs');
async function start(page,{instrument='guitar',locale='fr',unlocked=false}={}){
  await page.addInitScript(()=>localStorage.setItem('fretboard-routine-microphone','off'));
  await configure(page,{unlocked});await page.goto(`/?instrument=${instrument}&lang=${locale}`);await ready(page);
  await page.clock.install();await openMenu(page,'routine');
}
async function next(page){await page.locator('#routineNext').click();await page.clock.runFor(2800)}
const numbers=page=>page.locator('#routineTab .routine-note-number');
test('Guitar roots move up by fret and retrace the same positions from memory',async({page})=>{
  await start(page);
  const outward=['0','2','5','5','7','10','12'];
  await expect(page.locator('#routineTitle')).toHaveText('Relie les fondamentales La');
  await expect(numbers(page)).toHaveText(outward);
  await expect(page.locator('#routineInstruction')).toContainText('par numéro de case croissant');
  await expect(page.locator('#routineNext')).toHaveText('Essaie de mémoire →');
  await next(page);
  const hidden=['12','?','?','?','?','?','?'];
  await expect(numbers(page)).toHaveText(hidden);
  await expect(page.locator('#routineContext')).toContainText('De mémoire');
  await expect(page.locator('#routineTab title')).not.toContainText('case 10');
  const size=page.viewportSize();await page.setViewportSize({width:size.height,height:size.width});await page.clock.runFor(150);
  await expect(numbers(page)).toHaveText(hidden);
  await page.setViewportSize(size);await page.clock.runFor(150);
  await page.locator('#routineRootReveal').click();await expect(numbers(page)).toHaveText([...outward].reverse());
  await expect(page.locator('#routineRootReveal')).toBeHidden();
  await next(page);await expect(page.locator('#routineSteps button').nth(1)).toHaveAttribute('aria-current','step');
  await page.locator('#routineSteps button').first().click();await expect(numbers(page)).toHaveText(outward);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
for(const [instrument,frets] of [['bass-4',['0','2','5','7','12']],['ukulele',['0','2','5','9','12']]]){
  test(`${instrument} plays A roots from the nut to fret 12`,async({page})=>{
    await start(page,{instrument});
    await expect(numbers(page)).toHaveText(frets);
    await next(page);await expect(page.locator('#routineSteps button').nth(1)).toHaveAttribute('aria-current','step');
  });
}
test('Changing the guitar key or quality recalculates the root positions from the nut',async({page})=>{
  await start(page,{locale:'en',unlocked:true});
  const tuning=[4,9,2,7,11,4];
  for(const [pc,root] of ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].entries()){
    const frets=tuning.flatMap(open=>open===pc?[0,12]:[(pc-open+12)%12]).sort((a,b)=>a-b).map(String);
    for(const quality of ['minor','major']){
      await drawer(page,'routine',true);
      await choose(page,'routineRootControls','data-value',root);await choose(page,'routineQualityControls','data-value',quality);
      await drawer(page,'routine',false);
      await expect(numbers(page)).toHaveText(frets);
      await expect(page.locator('#routineRootReveal')).toBeHidden();
    }
  }
});
