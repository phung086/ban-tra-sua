// Production-preview regression; requires a runner with Playwright installed.
// Run: npm run build && npm run preview -- --port 5193
// Then: node scripts/remembered-customer-browser-smoke.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const KEY = 'tiem-tra-chibi-save-v3';
const url = process.env.PREVIEW_URL ?? 'http://127.0.0.1:5193';
const sizes = [[360, 800], [390, 844], [844, 390], [1280, 800]];
const output = process.env.REMEMBERED_BROWSER_OUTPUT ?? 'artifacts/remembered-customer';
await mkdir(output, { recursive: true });
const report = { environment: 'Chromium simulated touch / SwiftShader; not physical mobile hardware', passed: [], errors: [] };
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let failures = 0;

try {
  for (const [width, height] of sizes) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 1000, hasTouch: width < 1000 });
    page.setDefaultTimeout(90000);
    await page.addInitScript(() => {
      if (!localStorage.getItem('tiem-tra-chibi-ui-v1')) localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({ renderEngine: 'three', graphics: 'light', coachCompleted: true, motion: false, sound: false, music: false }));
    });
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
        state.storyLog = [{
          id: 'remembered-service:previous', customerId: 'miu', customerName: 'Miu',
          title: 'Khách quen góp ý thêm', text: 'Miu: Topping chưa đúng đơn.',
          day: 1, rewardFans: 0,
        }];
        state.currentOrder = {
          id: 'return-e2e', customerId: 'miu', size: 'M',
          base: 'classic-milk-tea', sugar: 25, ice: 50, topping: 'none',
          targetFill: 80, targetShake: 60, price: 20000,
        };
        state.draft = {
          ...state.draft, base: 'classic-milk-tea', size: 'M',
          topping: 'none', sugar: 25, ice: 50, fill: 80, shake: 60,
          sealed: false,
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
        path: `${output}/${width}x${height}.png`,
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
      await page.getByRole('button', { name: /Hỏi kỹ lỗi lần trước/ }).click();
      await page.waitForFunction(key => {
        const state = JSON.parse(localStorage.getItem(key) || '{}');
        return state.storyLog?.[0]?.id === 'remembered-clarify:return-e2e';
      }, KEY);
      const clarified = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (clarified.cash !== 210000 || clarified.city.minutes !== 855 || clarified.city.energy !== 48 || clarified.currentOrder?.sugar !== 25 || !clarified.storyLog[0]?.text.includes('Topping chưa đúng đơn')) {
        throw new Error('Clarification changed the recipe or charged the wrong cost');
      }
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('note').filter({ hasText: 'Khách nhắc: Miu: Topping chưa đúng đơn.' }).waitFor();
      if (await page.getByRole('button', { name: /Hỏi kỹ lỗi lần trước/ }).count()) throw new Error('Clarification offered twice after reload');
      const clarificationReload = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (clarificationReload.city.minutes !== 855 || clarificationReload.city.energy !== 48 || clarificationReload.storyLog.filter(item => item.id === 'remembered-clarify:return-e2e').length !== 1) {
        throw new Error('Clarification diary or cost lost or duplicated after reload');
      }
      // Promise is a real player action; verify its one-time ledger and cost.
      await page.getByRole('button', { name: /Hứa kiểm tra kỹ/ }).click();
      await page.waitForFunction(key => {
        const state = JSON.parse(localStorage.getItem(key) || '{}');
        return state.relationshipRewardIds?.includes('remembered-promise:return-e2e');
      }, KEY);
      const promised = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (promised.city.minutes !== 856 || promised.city.energy !== 48 ||
          promised.cash !== 210000 || promised.currentOrder?.sugar !== 25) {
        throw new Error('Promise changed resources or customer recipe incorrectly');
      }
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByText(/Đã hứa kiểm tra kỹ/).waitFor();
      if (await page.getByRole('button', { name: /Hứa kiểm tra kỹ/ }).count()) {
        throw new Error('Promise can be claimed twice after reload');
      }

      // Real counter crafting, cup check and delivery: no direct reducer call.
      await page.locator('.craft-stations button').nth(3).click({ timeout: 20000 });
      await page.getByRole('button', { name: /Soát ly trước khi dập nắp/ }).click();
      await page.waitForFunction(key => {
        const state = JSON.parse(localStorage.getItem(key) || '{}');
        return state.relationshipRewardIds?.some(id => id.startsWith('remembered-cup-check:return-e2e:'));
      }, KEY);
      const checked = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (checked.city.minutes !== 858 || checked.city.energy !== 47 ||
          checked.cash !== 210000 ||
          checked.relationshipRewardIds.filter(id => id.startsWith('remembered-cup-check:return-e2e:')).length !== 1) {
        throw new Error('Cup check was charged incorrectly or duplicated');
      }
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByText(/Đã soát đúng công thức|Đã chỉnh đúng công thức sau lần soát/).waitFor();
      if (await page.getByRole('button', { name: /Soát ly trước khi dập nắp/ }).count()) {
        throw new Error('Cup check can be claimed twice after reload');
      }
      const checkedReload = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (checkedReload.city.minutes !== 858 || checkedReload.city.energy !== 47 ||
          checkedReload.relationshipRewardIds.filter(id => id.startsWith('remembered-cup-check:return-e2e:')).length !== 1) {
        throw new Error('Cup check ledger or cost changed after reload');
      }
      // Station tabs are transient UI state and reset to step 1 on reload.
      await page.locator('.craft-stations button').nth(3).click({ timeout: 20000 });
      await page.locator('.seal-button').click({ timeout: 20000 });
      await page.locator('.serve-button').click({ timeout: 15000 });
      await page.locator('.place-buttons button.destination').click({ timeout: 20000 });
      await page.waitForSelector('.delivery-tag button.primary-button:not([disabled])', { timeout: 90000 });
      await page.locator('.delivery-tag button.primary-button').click({ timeout: 15000 });
      await page.waitForFunction(key => {
        const state = JSON.parse(localStorage.getItem(key) || '{}');
        return state.served >= 1 && state.relationshipRewardIds?.includes('remembered-service:return-e2e');
      }, KEY, { timeout: 20000 });
      const delivered = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (delivered.lastScore < 80 ||
          delivered.storyLog[0]?.id !== 'remembered-service:return-e2e' ||
          !delivered.notice.includes('Cảm ơn tiệm đã hỏi kỹ. Hôm nay ly đúng ý mình rồi!') ||
          !delivered.storyLog[0]?.text.includes('Tiệm đã giữ lời kiểm tra kỹ')) {
        throw new Error('Real tea delivery did not produce the expected NPC callback');
      }
      await page.screenshot({
        path: `${output}/delivered-${width}x${height}.png`,
        fullPage: true, animations: 'disabled',
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
      const persisted = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (persisted.served !== delivered.served ||
          persisted.storyLog[0]?.id !== 'remembered-service:return-e2e' ||
          persisted.relationshipRewardIds.filter(id => id === 'remembered-service:return-e2e').length !== 1) {
        throw new Error('NPC delivery callback was lost or duplicated on reload');
      }
      // Silent-service regression: skip both optional dialogue buttons. The
      // actual delivered cup must still be remembered after save/reload.
      const silentFixture = {
        ...fixture, day: 3, city: { ...fixture.city, day: 3 },
        morning: { ...fixture.morning, day: 3,
          plan: { ...fixture.morning.plan, day: 3 } },
        currentOrder: { ...fixture.currentOrder, id: 'silent-e2e-day3' },
        relationshipRewardIds: [...fixture.relationshipRewardIds],
        storyLog: [...fixture.storyLog], currentOrderQueuedAt: Date.now(),
      };
      await page.addInitScript(({ key, value }) => {
        if (sessionStorage.getItem('remember-silent-seeded')) return;
        localStorage.setItem(key, JSON.stringify(value));
        sessionStorage.setItem('remember-silent-seeded', '1');
      }, { key: KEY, value: silentFixture });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /Chào khách quen/ }).waitFor();
      await page.locator('.craft-stations button').nth(3).click();
      await page.locator('.seal-button').click();
      await page.locator('.serve-button').click();
      await page.locator('.place-buttons button.destination').click();
      await page.waitForSelector('.delivery-tag button.primary-button:not([disabled])');
      await page.locator('.delivery-tag button.primary-button').click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('remembered-outcome:miu:silent-e2e-day3:3:good'), KEY);
      const silentDelivered = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (!silentDelivered.relationshipRewardIds.includes('remembered-outcome:miu:silent-e2e-day3:3:good') ||
          silentDelivered.relationshipRewardIds.includes('remembered-greeting:silent-e2e-day3') ||
          silentDelivered.relationshipRewardIds.includes('remembered-quiet:silent-e2e-day3') ||
          silentDelivered.storyLog.some(entry => entry.id === 'remembered-service:silent-e2e-day3'))
        throw new Error('Skipped dialogue lost a real NPC delivery memory');
      await page.reload({ waitUntil: 'domcontentloaded' });
      const silentSaved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (silentSaved.relationshipRewardIds.filter(id =>
          id === 'remembered-outcome:miu:silent-e2e-day3:3:good').length !== 1 ||
          silentSaved.storyLog.some(entry => entry.id === 'remembered-service:silent-e2e-day3'))
        throw new Error('Silent NPC delivery memory duplicated or vanished after reload');
      await page.screenshot({
        path: `${output}/silent-delivery-${width}x${height}.png`,
        fullPage: true, animations: 'disabled',
      });
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2)) {
        throw new Error('Horizontal overflow');
      }
      if (errors.length) throw new Error('Browser errors: ' + errors.join(' | '));
      report.passed.push(`${width}x${height}: greet, clarify, promise, cup check, reload and real delivery`);
      console.log('PASS', report.passed.at(-1));
    } catch (error) {
      failures += 1;
      report.errors.push(`${width}x${height}: ${String(error.stack || error)}`);
      console.error('FAIL', `${width}x${height}`, String(error));
      await page.screenshot({
        path: `${output}/FAIL-${width}x${height}.png`,
        fullPage: true,
      }).catch(() => {});
    } finally {
      await page.close();
    }
  }
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2));
  console.log('REMEMBERED_BROWSER_REPORT ' + JSON.stringify(report));
  await browser.close();
}
if (failures) process.exitCode = 1;
