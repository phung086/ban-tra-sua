// Real counter: a silent wrong cup -> apology -> corrected delivery -> saved NPC memory.
// Seed only prior visit state; apology, brewing, serving and delivery are UI actions.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const KEY = 'tiem-tra-chibi-save-v3';
const output = 'artifacts/remembered-quiet-apology';
const sizes = [[360, 800], [390, 844], [844, 390], [1280, 800]];
const report = { environment: 'Chromium simulated touch / SwiftShader (not physical devices)', passed: [], errors: [] };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true,
  args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  for (const [width, height] of sizes) {
    const page = await browser.newPage({ viewport: { width, height },
      isMobile: width < 1000, hasTouch: width < 1000 });
    page.setDefaultTimeout(90000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => {
      if (!localStorage.getItem('tiem-tra-chibi-ui-v1'))
        localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
          renderEngine: 'three', graphics: 'light', coachCompleted: true,
          motion: false, sound: false, music: false,
        }));
    });
    try {
      await page.goto(process.env.PREVIEW_URL ?? 'http://127.0.0.1:5193',
        { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(key => Boolean(localStorage.getItem(key)), KEY);
      const fixture = await page.evaluate(key => {
        const state = JSON.parse(localStorage.getItem(key));
        state.day = 4; state.phase = 'open'; state.cash = 210000;
        state.city = { ...state.city, day: 4, minutes: 850, energy: 50 };
        state.morning = { ...state.morning, day: 4, step: 'finished',
          plan: { ...state.morning.plan, day: 4 } };
        state.reviews = [{ id: 'quiet-apology-review', customerId: 'miu',
          customerName: 'Miu', day: 1, stars: 2, score: 45,
          text: 'Topping chưa đúng đơn', replyStyle: 'sweet',
          replyText: 'Mình xin ghi nhận nhé!' }];
        state.relationshipRewardIds = [
          'review-care:quiet-apology-review:1:message',
          'review-followup:quiet-apology-review:remember',
          'remembered-outcome:miu:quiet-wrong-day3:3:bad',
        ];
        state.storyLog = [];
        state.currentOrder = { id: 'quiet-apology-day4', customerId: 'miu',
          size: 'M', base: 'classic-milk-tea', sugar: 25, ice: 50,
          topping: 'none', targetFill: 80, targetShake: 60, price: 20000 };
        state.draft = { ...state.draft, size: 'M', base: 'classic-milk-tea',
          sugar: 25, ice: 50, topping: 'none', fill: 80, shake: 60, sealed: false };
        state.currentOrderQueuedAt = Date.now(); state.customerQueue = [];
        return state;
      }, KEY);
      await page.addInitScript(({ key, state }) => {
        if (sessionStorage.getItem('quiet-apology-initial-seeded')) return;
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem('quiet-apology-initial-seeded', '1');
      }, { key: KEY, state: fixture });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('note').filter({ hasText: 'Ly chưa đúng đơn' }).waitFor();
      await page.getByRole('button', { name: /Chào khách quen/ }).click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('remembered-greeting:quiet-apology-day4'), KEY);
      const greeted = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      await page.getByRole('button', { name: /Xin lỗi vì ly giao sai/ }).click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('remembered-quiet-apology:quiet-apology-day4'), KEY);
      const apologized = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (apologized.city.minutes !== greeted.city.minutes + 2 ||
          apologized.city.energy !== greeted.city.energy - 1 ||
          apologized.cash !== greeted.cash ||
          apologized.city.goodwill !== greeted.city.goodwill ||
          JSON.stringify(apologized.customerBond) !== JSON.stringify(greeted.customerBond))
        throw new Error('Apology cost/trust changed without a corrected cup');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByText(/Đã nhận lỗi/).waitFor();
      if (await page.getByRole('button', { name: /Xin lỗi vì ly giao sai/ }).count())
        throw new Error('Apology could be claimed twice after reload');
      await page.locator('.craft-stations button').nth(3).click();
      await page.locator('.seal-button').click();
      await page.locator('.serve-button').click();
      await page.locator('.place-buttons button.destination').click();
      await page.waitForSelector('.delivery-tag button.primary-button:not([disabled])');
      await page.locator('.delivery-tag button.primary-button').click();
      const good = 'remembered-outcome:miu:quiet-apology-day4:4:good';
      await page.waitForFunction(({ key, good }) =>
        JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes(good),
        { key: KEY, good });
      const delivered = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (!delivered.storyLog.some(item => item.id === 'remembered-service:quiet-apology-day4' &&
            item.text.includes('Khách ghi nhận lời xin lỗi và ly trà được sửa đúng đơn')) ||
          delivered.relationshipRewardIds.filter(id =>
            id === 'remembered-quiet-apology:quiet-apology-day4').length !== 1)
        throw new Error('Correct delivery did not acknowledge the prior apology exactly once');
      await page.reload({ waitUntil: 'domcontentloaded' });
      const restored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (restored.relationshipRewardIds.filter(id => id === good).length !== 1 ||
          restored.relationshipRewardIds.filter(id =>
            id === 'remembered-quiet-apology:quiet-apology-day4').length !== 1)
        throw new Error('Apology or corrected cup duplicated/lost on reload');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2))
        throw new Error('Horizontal overflow');
      if (errors.length) throw new Error('Browser console errors: ' + errors.join(' | '));
      await page.screenshot({ path: output + '/apology-' + width + 'x' + height + '.png',
        fullPage: true, animations: 'disabled' });
      report.passed.push(width + 'x' + height + ': apology costs resources, real corrected cup, reload');
    } catch (error) {
      report.errors.push(width + 'x' + height + ': ' + String(error.stack || error));
      await page.screenshot({ path: output + '/FAIL-' + width + 'x' + height + '.png',
        fullPage: true }).catch(() => {});
    } finally { await page.close(); }
  }
} finally {
  await writeFile(output + '/results.json', JSON.stringify(report, null, 2));
  console.log('QUIET_APOLOGY_BROWSER_REPORT ' + JSON.stringify(report));
  await browser.close();
}
if (report.errors.length) process.exitCode = 1;
