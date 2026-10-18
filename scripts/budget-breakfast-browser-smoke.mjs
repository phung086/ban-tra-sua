// Production-browser regression: a low-cash player can eat breakfast, save and reload.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const KEY = 'tiem-tra-chibi-save-v3';
const OUT = 'artifacts/budget-breakfast';
const report = { passed: [], errors: [], environment: 'Chromium; not physical devices' };
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, args: [
  '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });
try {
  for (const [width, height] of [[360, 800], [390, 844], [844, 390], [1280, 800]]) {
    const page = await browser.newPage({
      viewport: { width, height }, isMobile: width < 1000, hasTouch: width < 1000,
    });
    page.setDefaultTimeout(60000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    try {
      await page.goto(process.env.PREVIEW_URL ?? 'http://127.0.0.1:5193',
        { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Bỏ qua' }).click();
      await page.waitForFunction(key => Boolean(localStorage.getItem(key)), KEY);
      const fixture = await page.evaluate(key => {
        const saved = JSON.parse(localStorage.getItem(key));
        saved.cash = 0;
        return saved;
      }, KEY);
      // pagehide persists the old state; seed after navigation starts.
      await page.addInitScript(({ key, fixture }) => {
        if (sessionStorage.getItem('budget-breakfast-seeded')) return;
        localStorage.setItem(key, JSON.stringify(fixture));
        sessionStorage.setItem('budget-breakfast-seeded', '1');
      }, { key: KEY, fixture });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('.life-morning-wake').click();
      await page.waitForFunction(key =>
        JSON.parse(localStorage.getItem(key) || '{}').morning?.step === 'awake', KEY);
      const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      const free = page.locator('.life-morning-option')
        .filter({ hasText: 'Ăn cơm nguội còn lại ở nhà' });
      await free.waitFor();
      if (await free.isDisabled()) throw new Error('Free breakfast was disabled at zero cash');
      const paid = page.locator('.life-morning-option')
        .filter({ hasText: 'Mua bánh mì đầu ngõ' });
      if (!await paid.isDisabled()) throw new Error('Paid breakfast should be disabled');
      await free.click();
      await page.waitForFunction(key =>
        JSON.parse(localStorage.getItem(key) || '{}').morning?.breakfast === 'leftovers', KEY);
      const eaten = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (eaten.cash !== 0 || eaten.morning.satiety !== 55 ||
          eaten.city.minutes !== before.city.minutes + 12 ||
          eaten.city.energy !== Math.min(100, before.city.energy + 1))
        throw new Error('Incorrect cash, time, satiety or energy after breakfast');
      await page.reload({ waitUntil: 'domcontentloaded' });
      const restored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (restored.cash !== eaten.cash || restored.city.minutes !== eaten.city.minutes ||
          restored.morning.breakfast !== 'leftovers' ||
          restored.morning.satiety !== eaten.morning.satiety)
        throw new Error('Breakfast was not persisted after reload');
      await page.getByText(/Đã lưu trong ngày, không tính tiền lần hai/).waitFor();
      if (await page.locator('.life-morning-option')
        .filter({ hasText: 'Ăn cơm nguội còn lại ở nhà' }).count())
        throw new Error('Breakfast can be purchased again after reload');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2))
        throw new Error('Horizontal overflow');
      if (errors.length) throw new Error('Console/page errors: ' + errors.join(' | '));
      await page.screenshot({ path: OUT + '/' + width + 'x' + height + '.png',
        fullPage: true, animations: 'disabled' });
      report.passed.push(width + 'x' + height + ': free meal → effects → save/reload');
    } catch (error) {
      report.errors.push(width + 'x' + height + ': ' + String(error.stack || error));
      await page.screenshot({ path: OUT + '/FAIL-' + width + 'x' + height + '.png',
        fullPage: true }).catch(() => {});
    } finally {
      await page.close();
    }
  }
} finally {
  await writeFile(OUT + '/results.json', JSON.stringify(report, null, 2));
  console.log('BUDGET_BREAKFAST_REPORT ' + JSON.stringify(report));
  await browser.close();
}
if (report.errors.length) process.exitCode = 1;
