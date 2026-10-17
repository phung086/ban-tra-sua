// Production browser journey: one actual tea delivery -> sleep/wake -> returning NPC.
// Customer identity on day 3 is fixed after opening to avoid random-queue flakes.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const KEY = 'tiem-tra-chibi-save-v3';
const url = process.env.PREVIEW_URL ?? 'http://127.0.0.1:5193';
const output = process.env.REMEMBERED_THANKS_OUTPUT ?? 'artifacts/remembered-thanks';
const sizes = [[360, 800], [390, 844], [844, 390], [1280, 800]];
await mkdir(output, { recursive: true });
const report = { environment: 'Chromium SwiftShader; not physical Android/iPhone', passed: [], errors: [] };
const browser = await chromium.launch({ headless: true, args: [
  '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });
try {
  for (const [width, height] of sizes) {
    const page = await browser.newPage({ viewport: { width, height },
      isMobile: width < 1000, hasTouch: width < 1000 });
    page.setDefaultTimeout(90000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    try {
      await page.addInitScript(() => localStorage.setItem('tiem-tra-chibi-ui-v1',
        JSON.stringify({ renderEngine: 'three', graphics: 'light', coachCompleted: true,
          motion: false, sound: false, music: false })));
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(key => Boolean(localStorage.getItem(key)), KEY);
      const fixture = await page.evaluate(key => {
        const state = JSON.parse(localStorage.getItem(key));
        state.day = 2;
        state.city.day = 2;
        state.city.minutes = 850;
        state.city.energy = 50;
        state.phase = 'open';
        state.targetOrders = 1;
        state.morning.day = 2;
        state.morning.plan.day = 2;
        state.morning.step = 'finished';
        state.cash = 210000;
        state.reviews = [{ id: 'thanks-review', customerId: 'miu', customerName: 'Miu',
          day: 1, stars: 2, score: 45, text: 'Topping chưa đúng đơn',
          replyStyle: 'sweet', replyText: 'Mình xin lỗi nhé' }];
        state.relationshipRewardIds = ['review-care:thanks-review:1:message',
          'review-followup:thanks-review:remember'];
        state.storyLog = [{ id: 'remembered-service:older', customerId: 'miu',
          customerName: 'Miu', title: 'Khách quen góp ý thêm',
          text: 'Miu: Topping chưa đúng đơn.', day: 1, rewardFans: 0 }];
        state.currentOrder = { id: 'thanks-e2e-day-two', customerId: 'miu', size: 'M',
          base: 'classic-milk-tea', sugar: 25, ice: 50, topping: 'none',
          targetFill: 80, targetShake: 60, price: 20000 };
        state.draft = { ...state.draft, base: 'classic-milk-tea', size: 'M',
          topping: 'none', sugar: 25, ice: 50, fill: 80, shake: 60, sealed: false };
        state.currentOrderQueuedAt = Date.now();
        state.customerQueue = [];
        return state;
      }, KEY);
      await page.addInitScript(({ key, fixture }) => {
        if (sessionStorage.getItem('thanks-e2e-seeded')) return;
        localStorage.setItem(key, JSON.stringify(fixture));
        sessionStorage.setItem('thanks-e2e-seeded', '1');
      }, { key: KEY, fixture });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /Chào khách quen/ }).click();
      await page.getByRole('button', { name: /Hỏi kỹ lỗi lần trước/ }).click();
      await page.getByRole('button', { name: /Hứa kiểm tra kỹ/ }).click();
      await page.locator('.craft-stations button').nth(3).click();
      await page.getByRole('button', { name: /Soát ly trước khi dập nắp/ }).click();
      await page.locator('.seal-button').click();
      await page.locator('.serve-button').click();
      await page.locator('.place-buttons button.destination').click();
      await page.waitForSelector('.delivery-tag button.primary-button:not([disabled])');
      await page.locator('.delivery-tag button.primary-button').click();
      await page.waitForFunction(key => {
        const s = JSON.parse(localStorage.getItem(key) || '{}');
        return s.phase === 'summary' &&
          s.relationshipRewardIds?.includes('remembered-service:thanks-e2e-day-two');
      }, KEY);
      const delivered = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (delivered.storyLog[0]?.title !== 'Khách quen hài lòng' ||
          !delivered.storyLog[0]?.text.includes('Tiệm đã giữ lời kiểm tra kỹ'))
        throw new Error('Real delivery did not keep the cup-check promise');
      await page.screenshot({ path: `${output}/delivered-${width}x${height}.png`,
        animations: 'disabled', fullPage: true });
      await page.getByRole('button', { name: /Đi ngủ · sang ngày 3/ }).click();
      await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
      await page.getByRole('button', { name: /Đi làm luôn/ }).click();
      await page.getByRole('button', { name: /Mở cửa tiệm/ }).click();
      await page.locator('.craft-stations').waitFor();
      const before = await page.evaluate(key => {
        const s = JSON.parse(localStorage.getItem(key) || '{}');
        if (s.day !== 3 || s.city.day !== 3 || s.phase !== 'open')
          throw new Error('Actual sleep/wake did not reach day 3');
        s.currentOrder = { id: 'thanks-e2e-day-three', customerId: 'miu', size: 'M',
          base: 'classic-milk-tea', sugar: 25, ice: 50, topping: 'none',
          targetFill: 80, targetShake: 60, price: 20000 };
        s.currentOrderQueuedAt = Date.now();
        s.customerQueue = [];
        localStorage.setItem(key, JSON.stringify(s));
        return { cash: s.cash, minutes: s.city.minutes, energy: s.city.energy,
          bond: s.customerBond.miu ?? 0, goodwill: s.city.goodwill };
      }, KEY);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('note').filter({ hasText: 'Lần giao trước (ngày 2)' }).waitFor();
      if (await page.getByRole('button', { name: /Hỏi kỹ lỗi lần trước/ }).count())
        throw new Error('Older complaint reopened after a satisfied delivery');
      await page.getByRole('button', { name: /Chào khách quen/ }).click();
      await page.getByRole('button', { name: /Hỏi thăm sau lần giữ lời/ }).click();
      await page.waitForFunction(key => {
        const s = JSON.parse(localStorage.getItem(key) || '{}');
        return s.relationshipRewardIds?.includes('remembered-thanks:thanks-e2e-day-two');
      }, KEY);
      const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (after.cash !== before.cash || after.city.minutes !== before.minutes + 4 ||
          after.city.energy !== before.energy - 2 ||
          after.customerBond.miu !== before.bond + 2 ||
          after.city.goodwill !== before.goodwill + 2)
        throw new Error('Next-day dialogue charged or rewarded incorrectly');
      await page.screenshot({ path: `${output}/return-${width}x${height}.png`,
        animations: 'disabled', fullPage: true });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByText(/Đã hỏi thăm. Khách ghi nhận tiệm đã giữ lời/).waitFor();
      if (await page.getByRole('button', { name: /Hỏi thăm sau lần giữ lời/ }).count())
        throw new Error('Follow-up was offered twice');
      const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (saved.city.minutes !== after.city.minutes || saved.city.energy !== after.city.energy ||
          saved.relationshipRewardIds.filter(id => id === 'remembered-thanks:thanks-e2e-day-two').length !== 1)
        throw new Error('Save/reload lost or duplicated the follow-up');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2))
        throw new Error('Horizontal overflow');
      if (errors.length) throw new Error('Browser console: ' + errors.join(' | '));
      report.passed.push(`${width}x${height}: deliver → sleep → wake → remembered NPC → reload`);
    } catch (error) {
      report.errors.push(`${width}x${height}: ${String(error.stack || error)}`);
      await page.screenshot({ path: `${output}/FAIL-${width}x${height}.png`,
        fullPage: true }).catch(() => {});
    } finally { await page.close(); }
  }
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
if (report.errors.length) process.exitCode = 1;
