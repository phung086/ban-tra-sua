// Browser smoke: post-shift reservation -> sleep/wake -> callback/reload -> open shop.
// Requires a Vite production preview and Playwright; emulation is NOT physical-device proof.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.SUPPLIER_URL || 'http://127.0.0.1:5192';
const output = process.env.SUPPLIER_OUTPUT || 'supplier-browser-artifacts';
const viewports = [[360, 800], [390, 844], [844, 390], [1280, 800]];
const summary = { day: 1, eventName: 'Ngày thường', orders: 1, perfectOrders: 0,
  bestCombo: 0, revenue: 0, ingredientCost: 0, wasteCost: 0, profit: 0,
  averageScore: 80, fansGained: 0, researchGained: 0 };
const seed = { saveVersion: 3, day: 1, phase: 'summary', cash: 100000,
  city: { day: 1, minutes: 900, energy: 40, goodwill: 0 },
  summary, relationshipRewardIds: [], storyLog: [] };
const report = { environment: 'Chromium SwiftShader, not Android/iPhone', viewports: [], errors: [] };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: [
  '--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });
try {
  for (const [width, height] of viewports) {
    const context = await browser.newContext({
      viewport: { width, height }, isMobile: width < 1000, hasTouch: width < 1000,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(initial => {
      if (!localStorage.getItem('tiem-tra-chibi-save-v3')) {
        localStorage.setItem('tiem-tra-chibi-save-v3', JSON.stringify(initial));
      }
      localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
        renderEngine: 'three', graphics: 'light', coachCompleted: true,
        motion: false, sound: false, music: false,
      }));
    }, seed);
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 });
    const panel = page.getByRole('region', { name: 'Hẹn nguyên liệu với cô Hạnh' });
    await panel.waitFor({ timeout: 90000 });
    await page.screenshot({ path: path.join(output, 'reserve-' + width + 'x' + height + '.png'),
      animations: 'disabled', timeout: 90000 });
    await panel.getByRole('button', { name: /Đặt giỏ nguyên liệu/ }).click({ timeout: 30000 });
    await page.waitForFunction(() => {
      const state = JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}');
      return state.cash === 98000 &&
        state.relationshipRewardIds?.includes('evening-supplier-1-reserve');
    }, null, { timeout: 15000 });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await panel.waitFor({ timeout: 90000 });
    assert.equal(await panel.getByRole('button', { name: /Đặt giỏ nguyên liệu/ }).count(), 0);
    await page.getByRole('button', { name: /Đi ngủ · sang ngày 2/ }).click({ timeout: 30000 });
    await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).waitFor({ timeout: 30000 });
    assert.equal(await page.getByRole('region', { name: 'Lời hẹn chợ sáng' }).count(), 0);
    await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click({ timeout: 30000 });
    const callback = page.getByRole('region', { name: 'Lời hẹn chợ sáng' });
    await callback.waitFor({ timeout: 30000 });
    assert.match(await callback.innerText(), /6.000/);
    await page.screenshot({ path: path.join(output, 'morning-' + width + 'x' + height + '.png'),
      animations: 'disabled', timeout: 90000 });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await callback.waitFor({ timeout: 30000 });
    const restored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}'));
    assert.equal(restored.day, 2);
    assert.equal(restored.cash, 98000);
    assert.equal(restored.relationshipRewardIds.filter(id => id === 'evening-supplier-1-reserve').length, 1);
    await page.getByRole('button', { name: /Đi làm luôn/ }).click({ timeout: 30000 });
    await page.getByRole('button', { name: /Mở cửa tiệm/ }).click({ timeout: 30000 });
    await page.locator('.craft-stations').waitFor({ timeout: 30000 });
    assert.deepEqual(errors, [], 'No console/page errors');
    report.viewports.push({ width, height, result: 'PASS', cash: restored.cash, day: restored.day });
    await context.close();
  }
} catch (error) {
  report.errors.push(String(error.stack || error));
  process.exitCode = 1;
} finally {
  await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
