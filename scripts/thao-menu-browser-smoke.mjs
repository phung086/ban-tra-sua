// Requires Playwright and a running production preview at THAO_MENU_URL.
// The smoke must fail until the panel is mounted in the real prep screen.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.THAO_MENU_URL ?? 'http://127.0.0.1:4173';
const out = process.env.THAO_MENU_OUTPUT ?? 'thao-menu-artifacts';
const sizes = [[360, 800], [390, 844], [844, 390], [1280, 800]];
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const results = [];
try {
  for (const [width, height] of sizes) {
    const errors = [];
    const context = await browser.newContext({
      viewport: { width, height }, hasTouch: width < 1000,
      isMobile: width < 1000, reducedMotion: 'reduce',
    });
    const result = { width, height, status: 'PENDING', errors };
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.addInitScript(() => {
        if (!localStorage.getItem('tiem-tra-chibi-save-v3')) {
          localStorage.setItem('tiem-tra-chibi-save-v3', JSON.stringify({
            saveVersion: 3, day: 2, phase: 'prep', cash: 30000,
            relationshipRewardIds: [], storyLog: [],
          }));
        }
        localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
          renderEngine: 'three', graphics: 'light', coachCompleted: true,
          motion: false, sound: false, music: false,
        }));
      });
      await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
      await page.getByRole('button', { name: /Đi làm luôn/ }).click();
      const panel = page.getByRole('region', { name: 'Bảng thực đơn cùng Thảo' });
      await panel.waitFor();
      await panel.screenshot({ path: out + '/thao-' + width + 'x' + height + '.png', timeout: 30000 });
      await panel.getByRole('button', { name: /Hẹn Thảo làm bảng thực đơn/ }).click();
      await page.waitForFunction(() => {
        const saved = JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}');
        return saved.relationshipRewardIds?.includes('thao-menu-2-book');
      });
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')));
      assert.equal(saved.cash, 30000);
      assert.equal(saved.customerBond['friend-thao'], 1);
      assert.equal(saved.relationshipRewardIds.filter(id => id === 'thao-menu-2-book').length, 1);
      // A fresh document reads the saved choice, without granting rewards again.
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
      await panel.waitFor();
      assert.match(await panel.innerText(), /Đã lưu quyết định/);
      assert.equal(await panel.getByRole('button', { name: /Hẹn Thảo làm bảng thực đơn/ }).count(), 0);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')).cash), 30000);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false);
      assert.deepEqual(errors, []);
      result.status = 'PASS';
    } catch (error) {
      result.status = 'FAIL';
      result.reason = String(error);
    } finally {
      results.push(result);
      await context.close();
    }
  }
} finally {
  await browser.close();
  await writeFile(out + '/report.json', JSON.stringify(results, null, 2));
}
console.log('THAO_MENU_BROWSER', JSON.stringify(results));
if (results.some(result => result.status !== 'PASS')) process.exitCode = 1;
