// Browser smoke for the actual prep UI. Requires Playwright and a running preview.
// Uses a complete save from the game; only the shift summary is fixture-seeded.
// This does NOT verify brewing/delivery, joystick/collision, or physical devices.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const KEY = 'tiem-tra-chibi-save-v3';
const URL = process.env.THAO_MENU_URL || 'http://127.0.0.1:5192';
const OUT = process.env.THAO_MENU_OUTPUT || 'artifacts/thao-menu';
const viewports = [[360, 800], [390, 844], [844, 390], [1280, 800]];
const report = { environment: 'Chromium emulation, not physical devices', results: [] };
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, args: [
  '--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });
try {
  for (const [width, height] of viewports) {
    const context = await browser.newContext({
      viewport: { width, height }, isMobile: width < 1000,
      hasTouch: width < 1000, reducedMotion: 'reduce', deviceScaleFactor: 1,
    });
    const errors = [];
    const item = { viewport: `${width}x${height}`, status: 'PENDING' };
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(45000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.addInitScript(() => {
        localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
          renderEngine: 'three', graphics: 'light', coachCompleted: true,
          motion: false, sound: false, music: false,
        }));
      });
      await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
      const skip = page.getByRole('button', { name: 'Bỏ qua' });
      if (await skip.isVisible().catch(() => false)) await skip.click();
      await page.waitForFunction(key => Boolean(localStorage.getItem(key)), KEY);
      const fixture = await page.evaluate(key => {
        const saved = JSON.parse(localStorage.getItem(key));
        saved.day = 2;
        saved.phase = 'prep';
        saved.cash = 30000;
        saved.city.day = 2;
        saved.city.minutes = 480;
        saved.city.energy = 60;
        saved.morning.day = 2;
        saved.morning.plan.day = 2;
        saved.morning.step = 'asleep';
        saved.morning.breakfast = null;
        saved.morning.satiety = 30;
        saved.relationshipRewardIds = [];
        saved.storyLog = [];
        saved.summary = null;
        return saved;
      }, KEY);
      // Pagehide persists the old React state; seed at the next document start.
      // Session flag prevents overwriting later player decisions on reload.
      await page.addInitScript(({ key, fixture }) => {
        if (sessionStorage.getItem('__thao_seeded')) return;
        localStorage.setItem(key, JSON.stringify(fixture));
        sessionStorage.setItem('__thao_seeded', 'yes');
      }, { key: KEY, fixture });
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
      const wake = async () => {
        await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
        await page.getByRole('button', { name: /Đi làm luôn/ }).click();
      };
      const panel = page.getByRole('region', { name: 'Bảng thực đơn cùng Thảo' });
      await wake();
      await panel.waitFor();
      await panel.getByRole('button', { name: /Hẹn Thảo làm bảng thực đơn/ }).click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('thao-menu-2-book'), KEY);
      const booked = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      assert.equal(booked.cash, 30000);
      assert.equal(booked.customerBond['friend-thao'], 1);
      assert.equal(booked.relationshipRewardIds.filter(id => id === 'thao-menu-2-book').length, 1);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
      assert.match(await panel.innerText(), /Đã lưu quyết định/);
      assert.equal(await panel.getByRole('button', { name: /Hẹn Thảo làm bảng thực đơn/ }).count(), 0);

      // Summary is the only shortcut. Sleep, nextDay, wake, choice and reload
      // all use the real app controls and persistent save state.
      await page.addInitScript(key => {
        if (sessionStorage.getItem('__thao_summary') !== 'yes') return;
        sessionStorage.removeItem('__thao_summary');
        const state = JSON.parse(localStorage.getItem(key) || '{}');
        state.phase = 'summary';
        state.closingCareChoice = 'skip';
        state.summary = { day: state.day, eventName: 'Ca thử nghiệm', orders: 0,
          perfectOrders: 0, bestCombo: 0, revenue: 0, ingredientCost: 0,
          wasteCost: 0, profit: 0, averageScore: 0, fansGained: 0, researchGained: 0 };
        localStorage.setItem(key, JSON.stringify(state));
      }, KEY);
      const sleepTo = async day => {
        await page.evaluate(() => sessionStorage.setItem('__thao_summary', 'yes'));
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
        await page.getByRole('button', { name: new RegExp(`Đi ngủ · sang ngày ${day}`) }).click();
        await page.waitForFunction(({ key, day }) => {
          const state = JSON.parse(localStorage.getItem(key) || '{}');
          return state.day === day && state.phase === 'prep';
        }, { key: KEY, day });
        await wake();
      };
      await sleepTo(3);
      await panel.getByRole('button', { name: /In bảng rõ giá/ }).click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('thao-menu-3-print'), KEY);
      const printed = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      assert.equal(printed.cash, 6000);
      assert.equal(printed.fans, booked.fans + 3);
      assert.equal(printed.relationshipRewardIds.filter(id => id === 'thao-menu-3-print').length, 1);
      await panel.getByRole('group', { name: 'Bảng giá trước cửa tiệm' }).waitFor();
      assert.match(await panel.innerText(), /Trà sữa truyền thống/);
      assert.match(await panel.innerText(), /28\.000/);
      await panel.screenshot({ path: path.join(OUT, `day3-${width}x${height}.png`), animations: 'disabled' });
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
      assert.equal(await panel.getByRole('button', { name: /In bảng rõ giá/ }).count(), 0);
      assert.match(await panel.innerText(), /Bảng in rõ giá/);
      await sleepTo(4);
      assert.match(await panel.innerText(), /Hôm qua khách đọc bảng giá/);
      assert.match(await panel.innerText(), /Trà sữa truyền thống/);
      const day4 = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      assert.equal(day4.cash, 6000);
      assert.equal(day4.fans, printed.fans);
      assert.equal(day4.relationshipRewardIds.filter(id => id === 'thao-menu-3-print').length, 1);
      await panel.screenshot({ path: path.join(OUT, `day4-${width}x${height}.png`), animations: 'disabled' });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false);
      assert.deepEqual(errors, []);
      item.status = 'PASS';
    } catch (error) {
      item.status = 'FAIL';
      item.error = String(error.stack || error);
      item.consoleErrors = errors;
    } finally {
      report.results.push(item);
      await context.close();
    }
  }
} finally {
  await writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
console.log('THAO_MENU_BROWSER', JSON.stringify(report));
if (report.results.some(item => item.status !== 'PASS')) process.exitCode = 1;
