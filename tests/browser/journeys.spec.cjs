const {test,expect,configure,ready,openMenu,home,drawer,choose,visibleDrawing}=require('./fixtures.cjs');
const instruments=[['guitar',6],['bass-4',4],['ukulele',4]];

for(const [instrument,strings] of instruments){
  for(const unlocked of [false,true])test(`${instrument}: ${unlocked?'premium':'free'} Learn, Map and Circle remain usable`,async({page})=>{
    // This journey visits every mode in both qualities. WebKit's full sequence
    // needs more time; individual clicks and assertions retain short deadlines.
    test.setTimeout(120000);
    await configure(page,{unlocked});await page.goto(`/?instrument=${instrument}&lang=en`);await ready(page);
    await openMenu(page,'learn');await visibleDrawing(page,'#learnFretboard',{strings});
    const modes=await page.locator('#modeControls [data-mode]').evaluateAll(nodes=>nodes.map(n=>n.dataset.mode));
    for(const quality of ['major','minor'])for(const mode of modes){
      await drawer(page,'learn',true);await choose(page,'qualityControls','data-quality',quality);await choose(page,'modeControls','data-mode',mode);
      const last=await page.locator('#learnPositionButtons [data-value]').last().getAttribute('data-value');
      await choose(page,'learnPositionButtons','data-value',last);await drawer(page,'learn',false);
      await visibleDrawing(page,'#learnFretboard',{strings});await expect(page.locator('.premium-overlay')).toBeHidden();
    }
    await drawer(page,'learn',true);await choose(page,'rootControls','data-root','C');
    if(unlocked)await expect(page.locator('#learnTitle')).toHaveText('C MINOR');
    else{await expect(page.locator('.premium-dialog')).toBeVisible();await page.locator('.premium-close').click();await expect(page.locator('#learnTitle')).toHaveText('A MINOR')}
    await drawer(page,'learn',false);await home(page,'learn');
    await openMenu(page,'fretmap');await visibleDrawing(page,'#mapFretboard',{strings});
    if(!unlocked)await expect(page.locator('#mapFretboard .neck-note text')).toHaveText(Array(await page.locator('#mapFretboard .neck-note').count()).fill('A'));
    await home(page,'fretmap');await openMenu(page,'circle');
    await visibleDrawing(page,'#circleWheel',{notes:false});
    for(let i=0;i<12;i++)await page.locator('#circleNext').click();
    await expect(page.locator('#circleKeyTitle')).toHaveText('C MAJOR');
    await page.locator('#circlePrevious').click();await expect(page.locator('#circleKeyTitle')).not.toHaveText('C MAJOR');
    await expect(page.locator('.premium-overlay')).toBeHidden();await home(page,'circle');
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  });

  test(`${instrument}: Quiz draws, scores, rotates, exits cleanly and replays`,async({page})=>{
    await page.goto(`/?instrument=${instrument}&lang=en`);await ready(page);await page.clock.install();
    await openMenu(page,'quiz');await expect(page.locator('#quizIntroView')).toBeVisible();
    await page.locator('#startQuizButton').click();await page.clock.runFor(150);
    await visibleDrawing(page,'#quizFretboard',{strings,notes:false});
    const root=await page.locator('#quizChord').textContent();
    const notes=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const tuning=instrument==='guitar'?[4,9,2,7,11,4]:instrument==='bass-4'?[4,9,2,7]:[7,0,4,9];
    const zones=page.locator('#quizFretboard .quiz-hit-zone');
    const positions=await zones.evaluateAll(nodes=>nodes.map(n=>({s:+n.dataset.string,f:+n.dataset.fret})));
    const answer=positions.findIndex(({s,f})=>(tuning[s]+f)%12===notes.indexOf(root));
    expect(answer).toBeGreaterThanOrEqual(0);await zones.nth(answer).click();await expect(page.locator('#scoreCount')).toHaveText('100');
    const size=page.viewportSize();await page.setViewportSize({width:size.height,height:size.width});
    await page.clock.runFor(350);await visibleDrawing(page,'#quizFretboard',{strings,notes:false});
    await page.setViewportSize(size);await page.clock.runFor(150);await visibleDrawing(page,'#quizFretboard',{strings,notes:false});
    await home(page,'quiz');await page.clock.fastForward(61000);
    await expect(page.locator('#resultModal')).not.toHaveClass(/show/);
    await openMenu(page,'quiz');await page.locator('#startQuizButton').click();await page.clock.fastForward(61000);
    await expect(page.locator('#quizResultView')).toBeVisible();await expect(page.locator('#resultScore')).toHaveText('0');
    await page.locator('#replayQuiz').click();await page.clock.runFor(150);await visibleDrawing(page,'#quizFretboard',{strings,notes:false});
    await expect(page.locator('#scoreCount')).toHaveText('0');
  });

  test(`${instrument}: all Routine exercises render and manual completion can replay`,async({page})=>{
    await page.addInitScript(()=>{localStorage.setItem('fretboard-routine-microphone','off')});
    await page.goto(`/?instrument=${instrument}&lang=en`);await ready(page);await page.clock.install();await openMenu(page,'routine');
    const steps=page.locator('#routineSteps button');
    const lastStep={guitar:'Rhythm','bass-4':'Arpeggios',ukulele:'Chords'}[instrument];
    await expect(steps).toHaveText(['Root','Scale','Penta','Triads',lastStep]);
    for(let i=0;i<5;i++){
      await steps.nth(i).click();
      const rhythm=await page.locator('#routineStrumming').isVisible();
      await visibleDrawing(page,rhythm?'#routineRhythmTab':'#routineTab',{notes:false,minHeight:40});
      await expect(page.locator('#routineNext')).toBeEnabled();
      if(instrument==='guitar'&&i===2){
        for(const [context,count] of [['Diagonal 1 · Frets 3–12 · Ascending',15],['Diagonal 1 · Frets 3–12 · Returning',14],
          ['Diagonal 2 · Frets 8–17 · Ascending',15],['Diagonal 2 · Frets 8–17 · Returning',14]]){
          await expect(page.locator('#routineContext')).toHaveText(context);
          await expect(page.locator('#routineTab .routine-note-number')).toHaveCount(count);
          await expect(steps.nth(2)).toHaveAttribute('aria-current','step');
          await page.locator('#routineNext').click();await page.clock.fastForward(2800);
        }
        await expect(steps.nth(3)).toHaveAttribute('aria-current','step');
      }
    }
    for(let step=0;step<40&&!(await page.locator('#routineFinish').isVisible());step++){
      await page.locator('#routineNext').click();await page.clock.fastForward(2800);
    }
    await expect(page.locator('#routineFinish')).toBeVisible();await page.locator('#routineReplay').click();
    await visibleDrawing(page,'#routineTab',{notes:false,minHeight:40});await expect(page.locator('#routineTitle')).toContainText('A');
    await home(page,'routine');
  });
}

test('Tuner permission denial is readable and the modal can close and reopen',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{throw new DOMException('Test denial','NotAllowedError')}}));
  await page.goto('/?lang=en');await ready(page);await page.locator('#homeTuner').click();
  await expect(page.locator('.tuner-dialog')).toBeVisible();await expect(page.locator('.tuner-status')).toContainText(/microphone|permission/i);
  await expect(page.locator('.tuner-string')).toHaveCount(6);await page.locator('.tuner-string').first().click();
  await expect(page.locator('.tuner-string').first()).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('Escape');await expect(page.locator('.tuner-dialog')).toBeHidden();
  await expect(page.locator('#homeTuner')).toBeFocused();await page.locator('#homeTuner').click();await expect(page.locator('.tuner-dialog')).toBeVisible();
});

test('Language and instrument selection survive reload and Privacy navigation',async({page})=>{
  await page.goto('/?instrument=guitar&lang=en');await ready(page);
  await page.locator('.language-trigger').click();await page.locator('[data-language="fr"]').click();await ready(page);
  await expect(page.locator('html')).toHaveAttribute('lang','fr');
  await page.locator('[data-home-instrument="bass-4"]').click();await ready(page);
  await expect(page).toHaveURL(/instrument=bass-4/);await expect(page.locator('html')).toHaveAttribute('lang','fr');
  await page.reload();await ready(page);await expect(page.locator('[data-home-instrument="bass-4"]')).toHaveAttribute('aria-pressed','true');
  const privacy=page.locator('a[href*="/privacy"]');const url=new URL(await privacy.getAttribute('href'),page.url());
  expect(url.searchParams.get('instrument')).toBe('bass-4');expect(url.searchParams.get('lang')).toBe('fr');
  // Keep the navigation on this checkout; the live public hostname is not under test.
  await page.goto(url.pathname+url.search);await expect(page.locator('article[lang="fr"]')).toBeVisible();
  await expect(page.locator('.brand')).toHaveAttribute('aria-label',/Bass/);
  await page.locator('.brand[data-policy-home]').click();await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-instrument','bass-4');await expect(page.locator('html')).toHaveAttribute('lang','fr');
});
