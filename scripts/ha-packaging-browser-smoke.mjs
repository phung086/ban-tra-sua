// Production preview E2E for Ha day-seven packaging -> sleep -> day-eight callback.
// Requires Playwright installed separately. Chromium emulation is not a real phone.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.HA_PACKAGING_URL || 'http://127.0.0.1:5192';
const output = process.env.HA_PACKAGING_OUTPUT || 'ha-packaging-artifacts';
const viewports = [[360, 800], [390, 844], [844, 390], [1280, 800]];
const report = { viewports: [], environment: 'Chromium SwiftShader; not Android/iPhone', errors: [] };
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
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => {
      if (!localStorage.getItem('tiem-tra-chibi-save-v3')) {
        localStorage.setItem('tiem-tra-chibi-save-v3', JSON.stringify({
          saveVersion: 3, day: 7, phase: 'summary', cash: 30000,
          summary: { day: 7, eventName: 'Ngày thường', orders: 1,
            perfectOrders: 0, bestCombo: 0, revenue: 0, ingredientCost: 0,
            wasteCost: 0, profit: 0, averageScore: 80, fansGained: 0,
            researchGained: 0 },
          relationshipRewardIds: ['evening-ha-6-reconcile'], storyLog: [],
        }));
      }
      localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
        renderEngine: 'three', graphics: 'light', coachCompleted: true,
        motion: false, sound: false, music: false,
      }));
    });
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 });
    const panel = page.getByRole('region', { name: 'Hà chuẩn bị cơm mang đi' });
    await panel.waitFor({ timeout: 90000 });
    await page.screenshot({ path: path.join(output, 'before-' + width + 'x' + height + '.png'), animations: 'disabled' });
    await panel.getByRole('button', { name: /Phụ Hà gấp hộp cơm/ }).click();
    await page.waitForFunction(() => {
      const state = JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}');
      return state.relationshipRewardIds?.includes('ha-packaging-7-fold') && state.day === 7;
    });
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')));
    assert.equal(saved.cash, 30000);
    assert.equal(saved.relationshipRewardIds.filter(id => id === 'ha-packaging-7-fold').length, 1);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await panel.waitFor({ timeout: 90000 });
    assert.equal(await panel.getByRole('button', { name: /Phụ Hà gấp hộp cơm/ }).count(), 0);
    await page.getByRole('button', { name: /Đi ngủ · sang ngày 8/ }).click();
    assert.equal(await page.getByRole('region', { name: 'Lời nhắn từ Hà' }).count(), 0);
    await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
    const reply = page.getByRole('region', { name: 'Lời nhắn từ Hà' });
    await reply.waitFor({ timeout: 30000 });
    assert.match(await reply.innerText(), /gấp hộp nhanh/);
    await page.screenshot({ path: path.join(output, 'reply-' + width + 'x' + height + '.png'), animations: 'disabled' });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    assert.match(await reply.innerText(), /gấp hộp nhanh/);
    const final = await page.evaluate(() => JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')));
    assert.equal(final.day, 8);
    assert.equal(final.relationshipRewardIds.filter(id => id === 'ha-packaging-7-fold').length, 1);
    assert.deepEqual(errors, []);
    report.viewports.push({ width, height, status: 'PASS' });
    await context.close();
  }
} catch (error) {
  report.errors.push(String(error));
  throw error;
} finally {
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
