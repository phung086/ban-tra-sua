// Production DOM smoke. Install Playwright separately; do not mark PASS without running.
// npm run build && npx vite preview --host 127.0.0.1 --port 5196
// node scripts/father-sign-browser-smoke.mjs
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const KEY = 'tiem-tra-chibi-save-v3';
const URL = process.env.FATHER_SIGN_URL || 'http://127.0.0.1:5196';
const OUT = 'artifacts/father-sign';
const viewports = [[360, 800], [390, 844], [844, 390], [1280, 800]];
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, args: [
  '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });
const report = { passed: [], failed: [], environment: 'Chromium only; physical devices pending' };
try {
  for (const [width, height] of viewports) {
    const context = await browser.newContext({
      viewport: { width, height }, isMobile: width < 1000, hasTouch: width < 1000,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    try {
      await page.goto(URL, { waitUntil: 'domcontentloaded' });
      const skip = page.getByRole('button', { name: 'Bỏ qua' });
      if (await skip.isVisible()) await skip.click();
      await page.waitForFunction(key => Boolean(localStorage.getItem(key)), KEY);
      const fixture = await page.evaluate(key => {
        const saved = JSON.parse(localStorage.getItem(key));
        saved.day = 7;
        saved.phase = 'prep';
        saved.city.day = 7;
        saved.city.minutes = 600;
        saved.city.energy = 30;
        saved.morning.day = 7;
        saved.morning.plan.day = 7;
        saved.morning.step = 'finished';
        saved.morning.breakfast = 'skip';
        saved.cash = 20000;
        saved.relationshipRewardIds = [
          ...saved.relationshipRewardIds.filter(id => !id.startsWith('family-father-quang-sign')),
          'family-father-quang-sign',
        ];
        return saved;
      }, KEY);
      await page.addInitScript(({ key, saved }) => {
        if (sessionStorage.getItem('father-sign-seeded')) return;
        localStorage.setItem(key, JSON.stringify(saved));
        sessionStorage.setItem('father-sign-seeded', '1');
      }, { key: KEY, saved: fixture });
      await page.reload({ waitUntil: 'domcontentloaded' });
      const panel = page.getByRole('region', { name: 'Sửa biển hiệu cùng bố Quang' });
      await panel.getByRole('button', { name: /Cùng bố thay ốc/ }).click();
      await page.waitForFunction(key => {
        const saved = JSON.parse(localStorage.getItem(key) || '{}');
        return saved.relationshipRewardIds?.includes('family-father-quang-sign:completed');
      }, KEY);
      const repaired = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      assert.equal(repaired.cash, 8000);
      assert.equal(repaired.city.minutes, 625);
      assert.equal(repaired.city.energy, 26);
      assert.equal(repaired.customerBond['family-father-quang'] >= 3, true);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await panel.getByText('Đã lưu lựa chọn', { exact: false }).waitFor();
      assert.equal(await panel.getByRole('button', { name: /Cùng bố thay ốc/ }).count(), 0);
      const savedAgain = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      assert.equal(savedAgain.cash, repaired.cash);
      assert.equal(savedAgain.city.energy, repaired.city.energy);
      // Screenshot the actual interactive panel rather than a costly full WebGL page.
      await panel.screenshot({ path: OUT + '/' + width + 'x' + height + '.png',
        timeout: 20000, animations: 'disabled' });
      const summary = {
        ...savedAgain, phase: 'summary', closingCareChoice: 'skip',
        summary: { day: 7, eventName: 'Một ngày ở phố', orders: 0,
          perfectOrders: 0, bestCombo: 0, revenue: 0, ingredientCost: 0,
          wasteCost: 0, profit: 0, averageScore: 0, fansGained: 0, researchGained: 0 },
      };
      await page.addInitScript(({ key, saved }) => {
        if (sessionStorage.getItem('father-sign-summary')) return;
        localStorage.setItem(key, JSON.stringify(saved));
        sessionStorage.setItem('father-sign-summary', '1');
      }, { key: KEY, saved: summary });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /Đi ngủ · sang ngày 8/ }).click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}').day === 8, KEY);
      await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
      await page.getByText(/Biển hiệu sáng hẳn/).waitFor();
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2))
        throw new Error('Horizontal overflow');
      if (errors.length) throw new Error('Browser errors: ' + errors.join(' | '));
      report.passed.push(width + 'x' + height + ': repair → save/reload → sleep → next-day memory');
    } catch (error) {
      report.failed.push(width + 'x' + height + ': ' + String(error.stack || error));
    } finally {
      await context.close();
    }
  }
} finally {
  await writeFile(OUT + '/results.json', JSON.stringify(report, null, 2));
  console.log('FATHER_SIGN_REPORT ' + JSON.stringify(report));
  await browser.close();
}
if (report.failed.length) process.exitCode = 1;
