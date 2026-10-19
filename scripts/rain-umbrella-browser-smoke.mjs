// Run after npm run build && npm run preview -- --host 127.0.0.1 --port 5192
// Install Playwright in the runner; Chromium SwiftShader is not physical device QA.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ headless: true, args: [
  '--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });
const base = process.env.SMOKE_URL || 'http://127.0.0.1:5192';
const out = 'artifacts/rain-umbrella';
const report = { passed: [], failed: [], device: 'Chromium SwiftShader only; Android/iPhone PENDING' };
await mkdir(out, { recursive: true });
try {
  for (const [width, height] of [[360,800], [390,844], [844,390], [1280,800]]) {
    const mobile = width < 1000;
    const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    try {
      await page.addInitScript(() => localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
        renderEngine: 'three', graphics: 'light', coachCompleted: true, motion: false, sound: false, music: false,
      })));
      await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForSelector('.life-morning', { timeout: 90000 });
      await page.waitForFunction(() => !!localStorage.getItem('tiem-tra-chibi-save-v3'), null, { timeout: 20000 });
      const fixture = await page.evaluate(() => {
        const game = JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3'));
        game.day = 3; game.city.day = 3; game.city.minutes = 1100; game.city.energy = 50;
        game.phase = 'summary';
        game.summary = { day: 3, eventName: game.event.name, orders: 1, perfectOrders: 0,
          bestCombo: 0, revenue: 0, ingredientCost: 0, wasteCost: 0,
          profit: 0, averageScore: 80, fansGained: 0, researchGained: 0 };
        game.closingCareChoice = 'skip'; game.relationshipRewardIds = []; game.storyLog = [];
        return game;
      });
      await page.addInitScript(seed => {
        if (sessionStorage.getItem('rain-umbrella-fixture-seeded')) return;
        localStorage.setItem('tiem-tra-chibi-save-v3', JSON.stringify(seed));
        sessionStorage.setItem('rain-umbrella-fixture-seeded', '1');
      }, fixture);
      await page.reload({ waitUntil: 'domcontentloaded' });
      const panel = page.getByRole('region', { name: 'Chuẩn bị ô cho ngày mưa' });
      await panel.waitFor({ timeout: 90000 });
      await panel.getByRole('button', { name: /Nhờ bác Minh cho mượn ô/ }).click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}')
        .relationshipRewardIds?.includes('rain-umbrella:3:borrow'), null, { timeout: 20000 });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await panel.getByText('Đã ghi vào sổ', { exact: false }).waitFor();
      if (await panel.getByRole('button', { name: /Nhờ bác Minh cho mượn ô/ }).count())
        throw new Error('Borrow action duplicated after reload');
      await panel.screenshot({ path: `${out}/${width}x${height}-borrowed.png`,
        timeout: 20000, animations: 'disabled' });
      await page.getByRole('button', { name: /Đi ngủ · sang ngày 4/ }).click();
      await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
      const callback = page.getByRole('region', { name: 'Lời nhắn của bác Minh' });
      await callback.getByText('đỡ mệt hơn một nửa', { exact: false }).waitFor();
      await callback.screenshot({ path: `${out}/${width}x${height}-callback.png`,
        timeout: 20000, animations: 'disabled' });
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2))
        throw new Error('Horizontal overflow');
      if (errors.length) throw new Error('Browser console: ' + errors.join(' | '));
      report.passed.push(`${width}x${height}: borrow → save/reload → sleep → wake → callback`);
    } catch (error) {
      report.failed.push(`${width}x${height}: ${String(error.stack || error)}`);
    } finally { await context.close(); }
  }
} finally {
  await writeFile(out + '/results.json', JSON.stringify(report, null, 2));
  console.log('RAIN_UMBRELLA_REPORT ' + JSON.stringify(report));
  await browser.close();
}
if (report.failed.length) process.exitCode = 1;
