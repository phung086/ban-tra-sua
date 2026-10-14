// Browser-only regression: synthetic post-shift save -> dinner -> sleep -> wake -> reload.
// Run against a production Vite preview with Playwright installed. Emulation is NOT a physical-device test.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.EVENING_HA_URL || 'http://127.0.0.1:5192';
const output = process.env.EVENING_HA_OUTPUT || 'evening-ha-artifacts';
const viewports = [[360,800],[390,844],[844,390],[1280,800]];
const summary = {
  day: 1, eventName: 'Ngày thường', orders: 1, perfectOrders: 0, bestCombo: 0,
  revenue: 0, ingredientCost: 0, wasteCost: 0, profit: 0, averageScore: 80,
  fansGained: 0, researchGained: 0,
};
const seed = { saveVersion: 3, day: 1, phase: 'summary', cash: 100000,
  summary, relationshipRewardIds: [], storyLog: [] };
const report = { environment: 'Chromium SwiftShader (not Android/iPhone)', viewports: [], errors: [] };
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
    // Seed only once; subsequent reloads must use the actual game save.
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
    await page.getByRole('region', { name: 'Bữa tối sau ca' }).waitFor({ timeout: 90000 });
    await page.screenshot({ path: path.join(output, `evening-${width}x${height}.png`),
      animations: 'disabled', timeout: 90000 });
    await page.getByRole('button', { name: /Ăn cơm tối/ }).click({ timeout: 30000 });
    await page.waitForFunction(() => {
      const state = JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}');
      return state.cash === 78000 && state.relationshipRewardIds?.includes('evening-ha-1-dinner');
    }, null, { timeout: 15000 });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.getByRole('region', { name: 'Bữa tối sau ca' }).waitFor({ timeout: 90000 });
    assert.equal(await page.getByRole('button', { name: /Ăn cơm tối/ }).count(), 0,
      'Reload must not offer a second paid dinner');
    await page.getByRole('button', { name: /Đi ngủ · sang ngày 2/ }).click({ timeout: 30000 });
    await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).waitFor({ timeout: 30000 });
    assert.equal(await page.getByRole('region', { name: 'Lời nhắn từ Hà' }).count(), 0,
      'Hà must not speak while the player is asleep');
    await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click({ timeout: 30000 });
    await page.getByRole('region', { name: 'Lời nhắn từ Hà' }).waitFor({ timeout: 30000 });
    await page.waitForFunction(() => {
      const state = JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}');
      return state.day === 2 && state.morning?.step === 'awake';
    }, null, { timeout: 15000 });
    await page.screenshot({ path: path.join(output, `ha-reply-${width}x${height}.png`),
      animations: 'disabled', timeout: 90000 });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.getByRole('region', { name: 'Lời nhắn từ Hà' }).waitFor({ timeout: 90000 });
    const state = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}'));
    assert.equal(state.cash, 78000);
    assert.equal(state.day, 2);
    assert.equal(state.relationshipRewardIds.filter(id => id === 'evening-ha-1-dinner').length, 1);
    assert.equal(state.storyLog.filter(item => item.id === 'evening-ha-1-dinner').length, 1);
    await page.getByRole('button', { name: /Đi làm luôn/ }).click({ timeout: 30000 });
    await page.getByRole('button', { name: /Mở cửa tiệm/ }).click({ timeout: 30000 });
    await page.locator('.craft-stations').waitFor({ timeout: 30000 });
    assert.deepEqual(errors, [], 'No browser errors after the sleep/reload flow');

    // Separate persisted day-three save: help on day one unlocks a free meal two evenings later.
    // Exercise actual DOM click, localStorage write, reload, sleep and the next morning's NPC reply.
    const thanksContext = await browser.newContext({
      viewport: { width, height }, isMobile: width < 1000, hasTouch: width < 1000,
      deviceScaleFactor: 1,
    });
    const thanksPage = await thanksContext.newPage();
    const thanksErrors = [];
    thanksPage.on('pageerror', error => thanksErrors.push(error.message));
    thanksPage.on('console', message => {
      if (message.type() === 'error') thanksErrors.push(message.text());
    });
    await thanksPage.addInitScript(initial => {
      if (!localStorage.getItem('tiem-tra-chibi-save-v3')) {
        localStorage.setItem('tiem-tra-chibi-save-v3', JSON.stringify(initial));
      }
      localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
        renderEngine: 'three', graphics: 'light', coachCompleted: true,
        motion: false, sound: false, music: false,
      }));
    }, {
      saveVersion: 3, day: 3, phase: 'summary', cash: 0,
      summary: { ...summary, day: 3 },
      city: { day: 3, minutes: 1100, energy: 40, goodwill: 1 },
      relationshipRewardIds: ['evening-ha-1-help'], storyLog: [],
    });
    await thanksPage.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await thanksPage.getByRole('region', { name: 'Bữa tối sau ca' }).waitFor({ timeout: 90000 });
    await thanksPage.getByRole('button', { name: /Nhận suất cơm Hà cảm ơn/ }).click({ timeout: 30000 });
    await thanksPage.waitForFunction(() => {
      const s = JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}');
      return s.cash === 0 && s.city?.minutes === 1115 && s.city?.energy === 50 &&
        s.city?.goodwill === 3 && s.relationshipRewardIds?.includes('evening-ha-3-thanks');
    }, null, { timeout: 15000 });
    await thanksPage.screenshot({ path: path.join(output, `ha-thanks-${width}x${height}.png`),
      animations: 'disabled', timeout: 90000 });
    await thanksPage.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    assert.equal(await thanksPage.getByRole('button', { name: /Nhận suất cơm Hà cảm ơn/ }).count(), 0,
      'Reload must not offer a second thank-you meal');
    await thanksPage.getByRole('button', { name: /Đi ngủ · sang ngày 4/ }).click({ timeout: 30000 });
    await thanksPage.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click({ timeout: 30000 });
    await thanksPage.getByRole('region', { name: 'Lời nhắn từ Hà' }).waitFor({ timeout: 30000 });
    assert.match(await thanksPage.getByRole('region', { name: 'Lời nhắn từ Hà' }).innerText(),
      /Có qua có lại/);
    await thanksPage.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    const thankYouSaved = await thanksPage.evaluate(() =>
      JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}'));
    assert.equal(thankYouSaved.day, 4);
    assert.equal(thankYouSaved.cash, 0);
    assert.equal(thankYouSaved.relationshipRewardIds.filter(id => id === 'evening-ha-3-thanks').length, 1);
    assert.deepEqual(thanksErrors, [], 'No browser errors in thank-you meal flow');
    await thanksContext.close();

    report.viewports.push({ width, height, result: 'PASS', cash: state.cash, day: state.day,
      thankYou: 'day3 claimed once, day4 remembered' });
    await context.close();
  }
} catch (error) {
  report.errors.push(String(error.stack || error));
  process.exitCode = 1;
} finally {
  await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
