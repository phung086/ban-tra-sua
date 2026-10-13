// Production Chromium/SwiftShader gameplay smoke. Simulated mobile sizes,
// not a claim about Android/iOS performance or physical-device M1 acceptance.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.MOBILE_LAYOUT_URL || 'http://127.0.0.1:5192';
const dir = process.env.MOBILE_LAYOUT_OUTPUT || 'mobile-layout-artifacts';
const saveKey = 'tiem-tra-chibi-save-v3';
const viewports = [[360, 800], [390, 844], [844, 390], [1280, 800]];
const report = { cases: [], errors: [], environment: 'Chromium SwiftShader simulated mobile and desktop' };
const assert = (value, message) => { if (!value) throw new Error(message); };
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: [
  '--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
      renderEngine: 'three', graphics: 'light', coachCompleted: true,
      motion: false, sound: false, music: false,
    }));
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('.street-world canvas', { timeout: 120000 });
  await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click({ timeout: 30000 });
  await page.getByRole('button', { name: /Đi làm luôn/ }).click({ timeout: 30000 });
  await page.waitForFunction(key => {
    try { return JSON.parse(localStorage.getItem(key) || '{}').morning?.step === 'finished'; }
    catch { return false; }
  }, saveKey, { timeout: 20000 });
  const initial = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);

  async function fixture(day, data = initial) {
    await page.evaluate(({ day, data, key }) => {
      const game = structuredClone(data);
      game.day = day;
      game.phase = 'prep';
      game.city.day = day;
      game.morning.day = day;
      game.morning.plan.day = day;
      game.morning.step = 'finished';
      game.morning.breakfast = 'skip';
      game.morning.satiety = 30;
      localStorage.setItem(key, JSON.stringify(game));
    }, { day, data, key: saveKey });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.getByRole('region', { name: 'Câu chuyện tuần ba' }).waitFor({ timeout: 45000 });
  }

  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await fixture(15);
    const panel = page.getByRole('region', { name: 'Câu chuyện tuần ba' });
    assert(await panel.getByText('Cơn mỏi vai').isVisible(), 'Day 15 panel missing at ' + width + 'x' + height);
    const care = panel.getByRole('button', { name: /Nghỉ ngơi 30 phút/ });
    assert(await care.isEnabled(), 'Rest action disabled at ' + width + 'x' + height);
    await care.click({ timeout: 45000 });
    await page.waitForFunction(key => {
      try { return JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes('week-three-15-care'); }
      catch { return false; }
    }, saveKey, { timeout: 20000 });
    const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
    assert(after.city.energy <= 100, 'Rest exceeded energy cap');
    assert(after.city.minutes >= initial.city.minutes + 30, 'Rest did not advance game time');
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await panel.getByText(/Đã lưu quyết định/).waitFor({ timeout: 30000 });
    assert(await panel.getByRole('button').count() === 0, 'Reload allowed duplicate action');
    await page.screenshot({ path: path.join(dir, 'week-three-' + width + 'x' + height + '.png'), animations: 'disabled', timeout: 90000 });
    report.cases.push('day15 rest/save/reload ' + width + 'x' + height);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await fixture(20);
  const beforeIce = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).inventory.ice, saveKey);
  await page.getByRole('region', { name: 'Câu chuyện tuần ba' })
    .getByRole('button', { name: /Nhờ bố mua đá dự phòng/ }).click({ timeout: 45000 });
  await page.waitForFunction(key => {
    try { return JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes('week-three-20-care'); }
    catch { return false; }
  }, saveKey, { timeout: 20000 });
  const afterDay20 = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  assert(afterDay20.inventory.ice === beforeIce + 4, 'Ice restock was not applied once');
  await fixture(21, afterDay20);
  const callback = page.getByRole('region', { name: 'Câu chuyện tuần ba' });
  assert(await callback.getByText(/Bố Quang hỏi thùng đá/).isVisible(), 'NPC did not remember day 20 on day 21');
  report.cases.push('day20 reserve ice -> day21 father callback');
  assert(report.errors.length === 0, 'Uncaught browser errors: ' + report.errors.join('; '));
  await context.close();
} catch (error) {
  report.errors.push(String(error.stack || error));
  process.exitCode = 1;
} finally {
  await writeFile(path.join(dir, 'week-three-results.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
