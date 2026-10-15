// Production-preview regression; requires a runner with Playwright installed.
// Run: npm run build && npm run preview -- --port 5193
// Then: node scripts/remembered-customer-browser-smoke.mjs
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const KEY = 'tiem-tra-chibi-save-v3';
const url = process.env.PREVIEW_URL ?? 'http://127.0.0.1:5193';
const sizes = [[360, 800], [390, 844], [844, 390], [1280, 800]];
await mkdir('artifacts/remembered-customer', { recursive: true });
const browser = await chromium.launch({ headless: true });
let failures = 0;

try {
  for (const [width, height] of sizes) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(key => Boolean(localStorage.getItem(key)), KEY, { timeout: 20000 });
      const fixture = await page.evaluate(key => {
        const state = JSON.parse(localStorage.getItem(key));
        state.day = 2;
        state.city.day = 2;
        state.city.minutes = 850;
        state.city.energy = 50;
        state.phase = 'open';
        state.morning.day = 2;
        state.morning.plan.day = 2;
        state.morning.step = 'finished';
        state.cash = 210000;
        state.reviews = [{
          id: 'remember-e2e', customerId: 'miu', customerName: 'Miu',
          day: 1, stars: 2, score: 45, text: 'Trà hơi ngọt',
          replyStyle: 'sweet', replyText: 'Mình xin ghi nhận nhé!',
        }];
        state.relationshipRewardIds = [
          'review-care:remember-e2e:1:message',
          'review-followup:remember-e2e:remember',
        ];
        state.currentOrder = {
          id: 'return-e2e', customerId: 'miu', size: 'M',
          base: 'classic-milk-tea', sugar: 25, ice: 50, topping: 'none',
          targetFill: 80, targetShake: 60, price: 20000,
        };
        state.currentOrderQueuedAt = Date.now();
        state.customerQueue = [];
        return state;
      }, KEY);

      // Seed once per page/tab, not on every reload: otherwise the test would
      // overwrite the greeting ledger and falsely claim persistence.
      await page.addInitScript(({ key, value }) => {
        if (sessionStorage.getItem('remember-e2e-seeded')) return;
        localStorage.setItem(key, JSON.stringify(value));
        sessionStorage.setItem('remember-e2e-seeded', '1');
      }, { key: KEY, value: fixture });

      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByText('Nhớ khách thích ít ngọt').waitFor();
      await page.getByText(/Khách đặt 25% đường hôm nay/).waitFor();
      await page.getByRole('button', { name: /Chào khách quen/ }).click();
      await page.waitForFunction(key => {
        const state = JSON.parse(localStorage.getItem(key) || '{}');
        return state.relationshipRewardIds?.includes('remembered-greeting:return-e2e');
      }, KEY, { timeout: 15000 });

      const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (after.cash !== 210000 ||
          after.city.minutes !== 852 ||
          after.city.energy !== 49 ||
          after.currentOrder?.sugar !== 25) {
        throw new Error('Greeting changed cash/time/energy or the requested recipe incorrectly');
      }
      await page.screenshot({
        path: `artifacts/remembered-customer/${width}x${height}.png`,
        fullPage: true, animations: 'disabled',
      });

      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByText('Đã chào khách theo sở thích.').waitFor();
      if (await page.getByRole('button', { name: /Chào khách quen/ }).count()) {
        throw new Error('Greeting could be claimed again after reload');
      }
      const restored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (restored.city.minutes !== 852 ||
          restored.city.energy !== 49 ||
          restored.relationshipRewardIds.filter(id => id === 'remembered-greeting:return-e2e').length !== 1) {
        throw new Error('Greeting ledger or cost changed after reload');
      }
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2)) {
        throw new Error('Horizontal overflow');
      }
      if (errors.length) throw new Error('Browser errors: ' + errors.join(' | '));
      console.log('PASS', `${width}x${height}`, 'remember/greet/save/reload');
    } catch (error) {
      failures += 1;
      console.error('FAIL', `${width}x${height}`, String(error));
      await page.screenshot({
        path: `artifacts/remembered-customer/FAIL-${width}x${height}.png`,
        fullPage: true,
      }).catch(() => {});
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
if (failures) process.exitCode = 1;
