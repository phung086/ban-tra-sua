// Real production-preview browser flow: closing shift -> call Mai -> sleep -> wake -> save/reload.
// Chromium emulation is NOT physical Android/iPhone verification.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.MOTHER_EVENING_URL || 'http://127.0.0.1:5195';
const output = process.env.MOTHER_EVENING_OUTPUT || 'artifacts/evening-mother';
const KEY = 'tiem-tra-chibi-save-v3';
const viewports = [[360, 800], [390, 844], [844, 390], [1280, 800]];
const report = { viewports: [], errors: [], environment: 'Chromium SwiftShader; no physical devices' };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: [
  '--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });
try {
  for (const [width, height] of viewports) {
    const context = await browser.newContext({
      viewport: { width, height }, isMobile: width < 1000,
      hasTouch: width < 1000, deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    try {
      await page.addInitScript(() => {
        if (!sessionStorage.getItem('mother-evening-seeded')) {
          localStorage.setItem('tiem-tra-chibi-save-v3', JSON.stringify({
            saveVersion: 3, day: 1, phase: 'summary', cash: 0,
            summary: { day: 1, eventName: 'Ngày thường', orders: 1,
              perfectOrders: 0, bestCombo: 0, revenue: 0,
              ingredientCost: 0, wasteCost: 0, profit: 0,
              averageScore: 80, fansGained: 0, researchGained: 0 },
            relationshipRewardIds: [], storyLog: [],
          }));
          sessionStorage.setItem('mother-evening-seeded', '1');
        }
        localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
          renderEngine: 'three', graphics: 'light', coachCompleted: true,
          motion: false, sound: false, music: false,
        }));
      });
      await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 });
      const coach = page.getByRole('dialog', { name: 'Hướng dẫn chơi' });
      if (await coach.isVisible()) {
        await coach.getByRole('button', { name: 'Bỏ qua' }).click();
        await coach.waitFor({ state: 'hidden' });
      }
      const panel = page.getByRole('region', { name: 'Gọi mẹ Mai sau ca' });
      await panel.waitFor({ timeout: 90000 });
      await page.waitForFunction(key => {
        const state = JSON.parse(localStorage.getItem(key) || '{}');
        return state.city && Number.isFinite(state.city.minutes) && Number.isFinite(state.city.energy);
      }, KEY, { timeout: 30000 });
      const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      await page.screenshot({ path: path.join(output, `before-${width}x${height}.png`),
        animations: 'disabled' });
      await panel.getByRole('button', { name: /Gọi mẹ kể chuyện bán trà/ }).click();
      await page.waitForFunction(key => {
        const state = JSON.parse(localStorage.getItem(key) || '{}');
        return state.relationshipRewardIds?.includes('evening-mother-mai-1-call');
      }, KEY, { timeout: 30000 });
      const called = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      assert.equal(called.cash, 0);
      assert.equal(called.city.minutes, before.city.minutes + 8);
      assert.equal(called.city.energy, before.city.energy - 1);
      assert.equal(called.relationshipRewardIds.filter(id => id === 'evening-mother-mai-1-call').length, 1);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
      await panel.waitFor();
      assert.equal(await panel.getByRole('button', { name: /Gọi mẹ kể chuyện bán trà/ }).count(), 0);
      await page.getByRole('button', { name: /Đi ngủ · sang ngày 2/ }).click();
      assert.equal(await page.getByRole('region', { name: 'Tin nhắn của mẹ Mai sáng hôm sau' }).count(), 0);
      await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
      const callback = page.getByRole('region', { name: 'Tin nhắn của mẹ Mai sáng hôm sau' });
      await callback.waitFor({ timeout: 30000 });
      assert.match(await callback.innerText(), /Tối qua nghe con kể chuyện tiệm/);
      await page.screenshot({ path: path.join(output, `callback-${width}x${height}.png`),
        animations: 'disabled' });
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
      await callback.waitFor();
      assert.match(await callback.innerText(), /Tối qua nghe con kể chuyện tiệm/);
      const final = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      assert.equal(final.day, 2);
      assert.equal(final.relationshipRewardIds.filter(id => id === 'evening-mother-mai-1-call').length, 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false);
      assert.deepEqual(errors, []);
      report.viewports.push({ width, height, status: 'PASS' });
    } catch (error) {
      report.errors.push(`${width}x${height}: ${String(error.stack || error)}`);
      await page.screenshot({ path: path.join(output, `FAIL-${width}x${height}.png`),
        animations: 'disabled' }).catch(() => {});
    } finally {
      await context.close();
    }
  }
} finally {
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
if (report.errors.length) {
  console.error('EVENING_MOTHER_E2E_FAILURES', report.errors);
  process.exitCode = 1;
} else {
  console.log('EVENING_MOTHER_E2E_PASS', report.viewports);
}
