// Real counter -> silent delivery -> save/reload -> next-day NPC memory.
// Production preview: npm run build && npm run preview -- --port 5193
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const KEY = 'tiem-tra-chibi-save-v3';
const output = 'artifacts/remembered-quiet-return';
const sizes = [[360, 800], [390, 844], [844, 390], [1280, 800]];
const report = { environment: 'Chromium simulated touch / SwiftShader (not physical devices)', passed: [], errors: [] };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true,
  args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  for (const [width, height] of sizes) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 1000, hasTouch: width < 1000 });
    page.setDefaultTimeout(90000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => {
      if (!localStorage.getItem('tiem-tra-chibi-ui-v1'))
        localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
          renderEngine: 'three', graphics: 'light', coachCompleted: true, motion: false, sound: false, music: false,
        }));
    });
    try {
      await page.goto(process.env.PREVIEW_URL ?? 'http://127.0.0.1:5193', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(key => Boolean(localStorage.getItem(key)), KEY);
      const fixture = await page.evaluate(key => {
        const state = JSON.parse(localStorage.getItem(key));
        state.day = 3; state.phase = 'open'; state.cash = 210000;
        state.city = { ...state.city, day: 3, minutes: 850, energy: 50 };
        state.morning = { ...state.morning, day: 3, step: 'finished',
          plan: { ...state.morning.plan, day: 3 } };
        state.reviews = [{ id: 'quiet-review', customerId: 'miu', customerName: 'Miu',
          day: 1, stars: 2, score: 45, text: 'Trà hơi ngọt',
          replyStyle: 'sweet', replyText: 'Mình xin ghi nhận nhé!' }];
        state.relationshipRewardIds = ['review-care:quiet-review:1:message',
          'review-followup:quiet-review:remember'];
        state.storyLog = [{ id: 'remembered-service:older-complaint',
          customerId: 'miu', customerName: 'Miu', title: 'Khách quen góp ý thêm',
          text: 'Miu: Topping chưa đúng đơn.', day: 1, rewardFans: 0 }];
        state.currentOrder = { id: 'quiet-real-day3', customerId: 'miu',
          size: 'M', base: 'classic-milk-tea', sugar: 25, ice: 50,
          topping: 'none', targetFill: 80, targetShake: 60, price: 20000 };
        state.draft = { ...state.draft, size: 'M', base: 'classic-milk-tea',
          sugar: 25, ice: 50, topping: 'none', fill: 80, shake: 60, sealed: false };
        state.currentOrderQueuedAt = Date.now(); state.customerQueue = [];
        return state;
      }, KEY);
      await page.addInitScript(({ key, state }) => {
        if (sessionStorage.getItem('quiet-real-seeded')) return;
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem('quiet-real-seeded', '1');
      }, { key: KEY, state: fixture });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /Chào khách quen/ }).waitFor();
      await page.locator('.craft-stations button').nth(3).click();
      await page.locator('.seal-button').click();
      await page.locator('.serve-button').click();
      await page.locator('.place-buttons button.destination').click();
      await page.waitForSelector('.delivery-tag button.primary-button:not([disabled])');
      await page.locator('.delivery-tag button.primary-button').click();
      const outcome = 'remembered-outcome:miu:quiet-real-day3:3:good';
      await page.waitForFunction(({ key, outcome }) =>
        JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes(outcome),
        { key: KEY, outcome });
      const delivered = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (delivered.relationshipRewardIds.includes('remembered-greeting:quiet-real-day3') ||
          delivered.storyLog.some(item => item.id === 'remembered-service:quiet-real-day3'))
        throw new Error('Skipping optional dialogue unexpectedly created NPC speech');
      await page.reload({ waitUntil: 'domcontentloaded' });
      const restored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (restored.relationshipRewardIds.filter(id => id === outcome).length !== 1)
        throw new Error('Silent delivered-cup memory lost or duplicated on reload');
      // The app persists the previous React state during pagehide. Writing
      // localStorage immediately before reload is overwritten by that save.
      // Prepare the next-day fixture, then install it in the new document
      // before the app hydrates (once per page session).
      const returnFixture = await page.evaluate(({ key, order }) => {
        const state = JSON.parse(localStorage.getItem(key));
        state.day = 4; state.phase = 'open';
        state.city = { ...state.city, day: 4, minutes: 850, energy: 50 };
        state.morning = { ...state.morning, day: 4, step: 'finished',
          plan: { ...state.morning.plan, day: 4 } };
        state.currentOrder = { ...order, id: 'quiet-return-day4' };
        state.draft = { ...state.draft, sealed: false };
        state.currentOrderQueuedAt = Date.now(); state.customerQueue = [];
        return state;
      }, { key: KEY, order: fixture.currentOrder });
      await page.addInitScript(({ key, state }) => {
        if (sessionStorage.getItem('quiet-return-seeded')) return;
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem('quiet-return-seeded', '1');
      }, { key: KEY, state: returnFixture });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(key => {
        const state = JSON.parse(localStorage.getItem(key) || '{}');
        return state.day === 4 && state.currentOrder?.id === 'quiet-return-day4';
      }, KEY);
      await page.getByRole('note').filter({ hasText: 'Lần giao trước (ngày 3)' }).waitFor();
      await page.getByRole('note').filter({ hasText: 'Ly đã đúng đơn' }).waitFor();
      if (await page.getByRole('button', { name: /Hỏi kỹ lỗi lần trước/ }).count())
        throw new Error('Older complaint reopened after a correct silent delivery');
      await page.getByRole('button', { name: /Chào khách quen/ }).click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('remembered-greeting:quiet-return-day4'), KEY);
      const greeted = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (greeted.city.minutes !== 852 || greeted.city.energy !== 49 ||
          greeted.currentOrder.sugar !== 25 ||
          greeted.relationshipRewardIds.filter(id => id === outcome).length !== 1)
        throw new Error('Return greeting changed recipe/resources or duplicated outcome');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('note').filter({ hasText: 'Ly đã đúng đơn' }).waitFor();
      if (await page.getByRole('button', { name: /Chào khách quen/ }).count())
        throw new Error('Return greeting can be rewarded twice');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2))
        throw new Error('Horizontal overflow');
      if (errors.length) throw new Error('Browser console errors: ' + errors.join(' | '));
      await page.screenshot({ path: `${output}/return-${width}x${height}.png`,
        fullPage: true, animations: 'disabled' });
      report.passed.push(`${width}x${height}: real silent delivery, reload, NPC return, no duplicate reward`);
    } catch (error) {
      report.errors.push(`${width}x${height}: ${String(error.stack || error)}`);
      await page.screenshot({ path: `${output}/FAIL-${width}x${height}.png`,
        fullPage: true }).catch(() => {});
    } finally { await page.close(); }
  }
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2));
  console.log('QUIET_RETURN_BROWSER_REPORT ' + JSON.stringify(report));
  await browser.close();
}
if (report.errors.length) process.exitCode = 1;
