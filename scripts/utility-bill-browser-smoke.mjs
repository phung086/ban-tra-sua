import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const KEY = 'tiem-tra-chibi-save-v3';
const URL = process.env.PREVIEW_URL ?? 'http://127.0.0.1:5193';
const OUT = 'artifacts/utility-bill';
const results = { passed: [], failed: [], environment: 'Chromium, not physical devices' };
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, args: [
  '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });
try {
  for (const [width, height] of [[360,800],[390,844],[844,390],[1280,800]]) {
    const options = { viewport: { width, height }, isMobile: width < 1000, hasTouch: width < 1000 };
    const seedContext = await browser.newContext(options);
    let fixture;
    try {
      const seedPage = await seedContext.newPage();
      await seedPage.goto(URL, { waitUntil: 'domcontentloaded' });
      await seedPage.waitForFunction(key => Boolean(localStorage.getItem(key)), KEY);
      fixture = await seedPage.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    } finally { await seedContext.close(); }
    fixture.day = 14;
    fixture.phase = 'summary';
    fixture.cash = 50000;
    fixture.city.minutes = 1000;
    fixture.city.energy = 50;
    fixture.summary = { day: 14, eventName: fixture.event.name, orders: 1, perfectOrders: 0,
      bestCombo: 0, revenue: 50000, ingredientCost: 0, wasteCost: 0,
      profit: 50000, averageScore: 80, fansGained: 0, researchGained: 0 };
    const context = await browser.newContext({
      ...options, storageState: { cookies: [], origins: [{
        origin: new URL(URL).origin, localStorage: [{ name: KEY, value: JSON.stringify(fixture) }],
      }] },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(URL, { waitUntil: 'domcontentloaded' });
      const coach = page.getByRole('dialog', { name: 'Hướng dẫn chơi' });
      if (await coach.isVisible()) await coach.getByRole('button', { name: 'Bỏ qua' }).click();
      await page.getByTestId('utility-bill-panel').getByRole('button', { name: /Thanh toán ngay/ }).click();
      await page.waitForFunction(key =>
        JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes('life-utility-bill.14.pay'), KEY);
      const paid = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (paid.cash !== 18000 || paid.city.minutes !== 1005 || paid.city.energy !== 49)
        throw new Error('Payment cash/time/energy mismatch');
      await page.reload({ waitUntil: 'domcontentloaded' });
      if (await page.getByTestId('utility-bill-panel').getByRole('button', { name: /Thanh toán ngay/ }).count())
        throw new Error('Duplicate payment button after reload');
      await page.getByRole('button', { name: /Đi ngủ · sang ngày 15/ }).click();
      await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
      await page.getByText(/Hóa đơn điện nước hôm qua đã thanh toán đủ/).waitFor();
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2))
        throw new Error('Horizontal overflow');
      if (errors.length) throw new Error(errors.join(' | '));
      await page.screenshot({ path: `${OUT}/${width}x${height}.png`, timeout: 15000 });
      results.passed.push(`${width}x${height}`);
    } catch (error) {
      results.failed.push(`${width}x${height}: ${error.stack || error}`);
    } finally { await context.close(); }
  }
} finally {
  await browser.close();
  await writeFile(`${OUT}/results.json`, JSON.stringify(results, null, 2));
  console.log('UTILITY_BILL_REPORT ' + JSON.stringify(results));
}
if (results.failed.length) process.exitCode = 1;
