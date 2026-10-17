// Real counter regression: a spoken apology earns no trust until the next cup is delivered correctly.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const KEY = 'tiem-tra-chibi-save-v3';
const url = process.env.PREVIEW_URL ?? 'http://127.0.0.1:5193';
const output = process.env.REMEMBERED_RECOVERY_OUTPUT ?? 'artifacts/remembered-recovery';
const sizes = [[390, 844], [1280, 800]];
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
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    try {
      console.log(`REMEMBERED_RECOVERY_START ${width}x${height}`);
      await page.addInitScript(() => localStorage.setItem('tiem-tra-chibi-ui-v1',
        JSON.stringify({ renderEngine: 'three', graphics: 'light', coachCompleted: true,
          motion: false, sound: false, music: false })));
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(key => Boolean(localStorage.getItem(key)), KEY);
      const fixture = await page.evaluate(key => {
        const s = JSON.parse(localStorage.getItem(key));
        s.day = 4; s.city.day = 4; s.city.minutes = 850; s.city.energy = 50;
        s.phase = 'open'; s.targetOrders = 1; s.cash = 210000;
        s.morning.day = 4; s.morning.plan.day = 4; s.morning.step = 'finished';
        s.reviews = [{ id: 'recovery-review', customerId: 'miu', customerName: 'Miu',
          day: 1, stars: 2, score: 45, text: 'Topping chưa đúng đơn',
          replyStyle: 'sweet', replyText: 'Mình xin lỗi nhé' }];
        s.relationshipRewardIds = [
          'review-care:recovery-review:1:message',
          'review-followup:recovery-review:remember',
          'remembered-promise:broken-day-three',
          'remembered-service:broken-day-three',
        ];
        s.storyLog = [{ id: 'remembered-service:broken-day-three',
          customerId: 'miu', customerName: 'Miu', title: 'Khách quen góp ý thêm',
          text: 'Miu: Topping chưa đúng đơn. Tiệm đã hứa kiểm tra kỹ nhưng vẫn làm sai.',
          day: 3, rewardFans: 0 }];
        s.currentOrder = { id: 'recovery-day-four', customerId: 'miu', size: 'M',
          base: 'classic-milk-tea', sugar: 25, ice: 50, topping: 'none',
          targetFill: 80, targetShake: 60, price: 20000 };
        s.draft = { ...s.draft, base: 'classic-milk-tea', size: 'M',
          topping: 'none', sugar: 25, ice: 50, fill: 80, shake: 60, sealed: false };
        s.currentOrderQueuedAt = Date.now();
        s.customerQueue = [];
        return s;
      }, KEY);
      await page.addInitScript(({ key, fixture }) => {
        if (sessionStorage.getItem('recovery-seeded')) return;
        localStorage.setItem(key, JSON.stringify(fixture));
        sessionStorage.setItem('recovery-seeded', '1');
      }, { key: KEY, fixture });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /Chào khách quen/ }).click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('remembered-greeting:recovery-day-four'), KEY);
      const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      await page.getByRole('button', { name: /Xin lỗi vì thất hứa/ }).click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('remembered-apology:broken-day-three'), KEY);
      const apology = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (apology.customerBond.miu !== before.customerBond.miu ||
          apology.city.goodwill !== before.city.goodwill ||
          apology.city.minutes !== before.city.minutes + 2 ||
          apology.city.energy !== before.city.energy - 1 ||
          apology.cash !== before.cash) {
        throw new Error('Apology granted trust or charged resources incorrectly');
      }
      await page.screenshot({ path: `${output}/apology-${width}x${height}.png`,
        animations: 'disabled', fullPage: true });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByText(/Lòng tin chỉ phục hồi sau khi giao đúng ly/).waitFor();
      if (await page.getByRole('button', { name: /Xin lỗi vì thất hứa/ }).count())
        throw new Error('Apology could be repeated after reload');
      await page.locator('.craft-stations button').nth(3).click();
      await page.locator('.seal-button').click();
      await page.locator('.serve-button').click();
      await page.locator('.place-buttons button.destination').click();
      await page.waitForSelector('.delivery-tag button.primary-button:not([disabled])');
      await page.locator('.delivery-tag button.primary-button').click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('remembered-service:recovery-day-four'), KEY);
      const delivered = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (delivered.storyLog[0]?.title !== 'Khách quen hài lòng' ||
          !delivered.storyLog[0]?.text.includes('Cảm ơn tiệm đã xin lỗi') ||
          delivered.city.goodwill !== apology.city.goodwill + 1 ||
          delivered.customerBond.miu <= apology.customerBond.miu) {
        throw new Error('Correct real delivery did not restore trust');
      }
      await page.screenshot({ path: `${output}/delivered-${width}x${height}.png`,
        animations: 'disabled', fullPage: true });
      await page.reload({ waitUntil: 'domcontentloaded' });
      const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (saved.city.goodwill !== delivered.city.goodwill ||
          saved.customerBond.miu !== delivered.customerBond.miu ||
          saved.relationshipRewardIds.filter(id => id === 'remembered-service:recovery-day-four').length !== 1)
        throw new Error('Reload lost or duplicated the recovered trust');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2))
        throw new Error('Horizontal overflow');
      if (errors.length) throw new Error('Browser console: ' + errors.join(' | '));
      report.passed.push(`${width}x${height}: apologize → no reward → real delivery → trust → reload`);
      console.log(`REMEMBERED_RECOVERY_PASS ${width}x${height}`);
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
console.log('REMEMBERED_RECOVERY_BROWSER_REPORT ' + JSON.stringify(report));
if (report.errors.length) process.exitCode = 1;
