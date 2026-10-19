// Real DOM clicks against production preview; synthetic summary save is only the entry fixture.
// npm run build && npm run preview -- --host 127.0.0.1 --port 5192
// node scripts/overnight-stock-browser-smoke.mjs (Playwright must be installed in runner).
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.OVERNIGHT_STOCK_URL || 'http://127.0.0.1:5192';
const output = process.env.OVERNIGHT_STOCK_OUTPUT || 'overnight-stock-artifacts';
const viewports = [[360, 800], [390, 844], [844, 390], [1280, 800]];
const summary = { day: 1, eventName: 'Ngày dịu dàng', orders: 4,
  perfectOrders: 1, bestCombo: 1, revenue: 40000, ingredientCost: 1000,
  wasteCost: 0, profit: 39000, averageScore: 90, fansGained: 0, researchGained: 0 };
const seed = { saveVersion: 3, day: 1, phase: 'summary', cash: 20000,
  summary, inventory: { blackPearl: 4 }, freshness: { blackPearl: 17 },
  city: { day: 1, minutes: 1100, energy: 30, goodwill: 0 },
  relationshipRewardIds: [] };
const report = { environment: 'Chromium emulation (not physical mobile)', viewports: [], errors: [] };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox',
  '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader'] });
try {
  for (const [width, height] of viewports) {
    const context = await browser.newContext({ viewport: { width, height },
      isMobile: width < 1000, hasTouch: width < 1000, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(initial => {
      if (!localStorage.getItem('tiem-tra-chibi-save-v3'))
        localStorage.setItem('tiem-tra-chibi-save-v3', JSON.stringify(initial));
      localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
        renderEngine: 'three', graphics: 'light', coachCompleted: true,
        motion: false, sound: false, music: false,
      }));
    }, seed);
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 });
    const panel = page.getByRole('region', { name: 'Bảo quản nguyên liệu qua đêm' });
    await panel.waitFor({ timeout: 90000 });
    await panel.screenshot({ path: path.join(output, `stock-before-${width}x${height}.png`),
      animations: 'disabled' });
    await panel.getByRole('button', { name: /Thêm đá, cất topping/ }).click();
    await panel.getByRole('status').waitFor();
    await page.waitForFunction(() => {
      const s = JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}');
      return s.cash === 17000 && s.freshness?.blackPearl === 29 &&
        s.relationshipRewardIds?.includes('overnight-stock-1-chill');
    }, null, { timeout: 15000 });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await panel.waitFor({ timeout: 90000 });
    assert.equal(await panel.getByRole('button', { name: /Thêm đá, cất topping/ }).count(), 0);
    await page.getByRole('button', { name: /Đi ngủ · sang ngày 2/ }).click();
    await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).waitFor();
    assert.equal(await page.getByRole('region', { name: 'Nhật ký kho sáng nay' }).count(), 0);
    await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
    await page.getByRole('region', { name: 'Nhật ký kho sáng nay' }).waitFor();
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}'));
    assert.equal(state.day, 2);
    assert.equal(state.cash, 17000);
    assert.equal(state.inventory.blackPearl, 4);
    assert.equal(state.freshness.blackPearl, 7);
    assert.equal(state.relationshipRewardIds.filter(id => id === 'overnight-stock-1-chill').length, 1);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(output, `stock-next-morning-${width}x${height}.png`),
      animations: 'disabled' });
    report.viewports.push({ width, height, result: 'PASS', day: state.day, cash: state.cash });
    await context.close();
  }
} catch (error) {
  report.errors.push(String(error.stack || error));
  process.exitCode = 1;
} finally {
  await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
