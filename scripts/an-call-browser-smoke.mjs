// Fixture-seeded production Chromium smoke for An's actual pre-shop buttons.
// Does not replace the full wake/sleep/serve/deliver browser regression.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.AN_CALL_URL || 'http://127.0.0.1:5192';
const output = process.env.AN_CALL_OUTPUT || 'an-call-artifacts';
const sizes = [[360,800],[390,844],[844,390],[1280,800]];
const browser = await chromium.launch({ headless: true, args: [
  '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
] });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const errors = [];
async function setup(context, save) {
  await context.addInitScript(value => {
    localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
      renderEngine: 'three', graphics: 'light', coachCompleted: true, motion: false, sound: false, music: false,
    }));
    if (value) localStorage.setItem('tiem-tra-chibi-save-v3', value);
  }, save);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 });
  return page;
}
try {
  await mkdir(output, { recursive: true });
  const bootstrap = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const first = await setup(bootstrap, null);
  await first.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
  await first.getByRole('button', { name: /Đi làm luôn/ }).click();
  await first.waitForFunction(() => {
    const raw = localStorage.getItem('tiem-tra-chibi-save-v3');
    return raw && JSON.parse(raw).morning?.step === 'finished';
  });
  const fixture = await first.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3'));
    save.day = 2; save.city.day = 2; save.city.minutes = 480;
    save.morning.day = 2; save.morning.plan.day = 2;
    save.morning.step = 'finished'; save.morning.breakfast = 'skip';
    return JSON.stringify(save);
  });
  await bootstrap.close();
  for (const [width, height] of sizes) {
    const context = await browser.newContext({
      viewport: { width, height }, isMobile: width < 1000, hasTouch: width < 1000,
    });
    const page = await setup(context, fixture);
    await page.getByRole('button', { name: /Chỉ An chuyến xe kế tiếp/ }).click();
    await page.waitForFunction(() => {
      const raw = localStorage.getItem('tiem-tra-chibi-save-v3');
      return raw && JSON.parse(raw).relationshipRewardIds.some(id => id === 'family-an-morning:2:guide');
    });
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')));
    assert(saved.customerBond['family-sibling-an'] === 1, 'An bond was not saved');
    assert(saved.city.minutes === 490, 'Clock did not advance 10 minutes');
    assert(saved.city.energy === 99, 'Energy did not decrease');
    assert(documentWidthOk(await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth])),
      'Horizontal overflow at ' + width + 'x' + height);
    await page.screenshot({ path: path.join(output, `an-${width}x${height}.png`), animations: 'disabled' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert(await page.getByRole('button', { name: /Chỉ An chuyến xe kế tiếp/ }).count() === 0,
      'Repeat action available after reload');
    const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')));
    assert(restored.customerBond['family-sibling-an'] === 1, 'Bond duplicated after reload');
    const tomorrow = structuredClone(saved);
    tomorrow.day = 3; tomorrow.city.day = 3; tomorrow.city.minutes = 480;
    tomorrow.morning.day = 3; tomorrow.morning.plan.day = 3;
    tomorrow.morning.step = 'finished'; tomorrow.morning.breakfast = 'skip';
    const nextContext = await browser.newContext({ viewport: { width, height } });
    const nextPage = await setup(nextContext, JSON.stringify(tomorrow));
    await nextPage.getByText(/Em tìm được tuyến mới rồi/).waitFor();
    await nextPage.screenshot({ path: path.join(output, `an-reply-${width}x${height}.png`), animations: 'disabled' });
    await nextContext.close();
    await context.close();
    console.log('AN_CALL_VIEWPORT PASS ' + width + 'x' + height);
  }
  assert(errors.length === 0, 'Browser errors: ' + errors.join('; '));
  console.log('AN_CALL_BROWSER PASS (fixture-seeded; full journey still required)');
} finally {
  await browser.close();
}
function documentWidthOk([scroll, width]) { return scroll <= width + 2; }
