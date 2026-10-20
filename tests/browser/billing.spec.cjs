const {test,expect,installStore,ready,openMenu,drawer,choose,visibleDrawing}=require('./fixtures.cjs');
test.beforeEach(async({page},info)=>{await installStore(page,{platform:info.project.name==='iphone-webkit'?'ios':'android'});await page.goto('/?instrument=guitar&lang=en');await ready(page)});
const paywall=async page=>{await page.locator('.home-footer button[aria-haspopup="dialog"]').click();await expect(page.locator('.premium-dialog')).toBeVisible()};
const buy=page=>page.locator('.premium-billing > button').nth(0);

test('Verified purchase unlocks immediately, survives reload and allows another instrument',async({page})=>{
  await paywall(page);await buy(page).click();await expect(page.locator('.premium-overlay')).toHaveCount(0);await ready(page);
  await page.reload();await ready(page);await expect(page.locator('.premium-overlay')).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>window.__store.calls)).toBe(1);
  await page.locator('[data-home-instrument="bass-4"]').click();await ready(page);await openMenu(page,'learn');
  await drawer(page,'learn',true);await choose(page,'rootControls','data-root','C');await drawer(page,'learn',false);
  await expect(page.locator('#learnTitle')).toHaveText('C MINOR');await visibleDrawing(page,'#learnFretboard',{strings:4});
});
test('Cancelled and pending purchases keep access locked; a verified update unlocks',async({page})=>{
  await paywall(page);
  for(const status of ['cancelled','pending']){
    await page.evaluate(status=>{window.__store.result={unlocked:false,status}},status);await buy(page).click();
    await expect(page.locator('.billing-status')).toContainText(status==='cancelled'?'cancelled':'pending');
    await expect(page.locator('.billing-error')).toBeHidden();await expect(page.locator('.premium-overlay')).toBeVisible();
  }
  await page.evaluate(()=>window.__store.verify(true));await expect(page.locator('.premium-overlay')).toHaveCount(0);await ready(page);
});
test('Billing errors have a visible alert, collapsed plain-text details and a working retry',async({page})=>{
  await paywall(page);await page.evaluate(()=>{window.__store.fail=true});await buy(page).click();
  const panel=page.locator('.billing-error');await expect(panel).toBeVisible();await expect(panel).toHaveAttribute('role','alert');
  await expect(panel.locator('strong')).toHaveText('Could not open payment');
  await expect(panel.locator('details')).not.toHaveAttribute('open','');await panel.locator('summary').click();
  await expect(panel.locator('code')).toBeVisible();await expect(panel.locator('code')).toContainText('Test diagnostic <not HTML>');
  await expect(panel.locator('code *')).toHaveCount(0);
  const [red,green,blue]=await panel.evaluate(node=>getComputedStyle(node).borderTopColor.match(/[\d.]+/g).map(Number));
  expect(red).toBeGreaterThan(green);expect(red).toBeGreaterThan(blue);
  await page.evaluate(()=>{window.__store.fail=false});await buy(page).click();await expect(page.locator('.premium-overlay')).toHaveCount(0);await ready(page);
});
test('Restore uses verified ownership without launching a purchase',async({page})=>{
  await paywall(page);await page.evaluate(()=>sessionStorage.setItem('browser-test-verified-purchase','true'));
  await page.locator('.premium-billing > button').nth(1).click();await expect(page.locator('.premium-overlay')).toHaveCount(0);await ready(page);
  await expect.poll(()=>page.evaluate(()=>window.__store.calls)).toBe(0);
});
