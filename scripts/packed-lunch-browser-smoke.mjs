// Browser smoke for the real morning -> tea shift -> packed lunch -> reload flow.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const KEY = 'tiem-tra-chibi-save-v3';
const OUT = 'artifacts/packed-lunch';
const report = { passed: [], errors: [], device: 'Chromium (not Android/iPhone hardware)' };
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
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}'), KEY);
    try {
      await page.goto(process.env.PREVIEW_URL ?? 'http://127.0.0.1:5193',
        { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Bỏ qua' }).click();
      await page.locator('.life-morning-wake').click();
      await page.getByRole('button', { name: /Đi làm luôn/ }).click();
      const before = await saved();
      await page.getByRole('button', { name: /Nấu cơm hộp mang theo/ }).click();
      await page.waitForFunction(key =>
        JSON.parse(localStorage.getItem(key) || '{}').morning?.lunchPrep === 'lunchbox', KEY);
      const prepared = await saved();
      if (prepared.cash !== before.cash - 16000 ||
          prepared.city.minutes !== before.city.minutes + 15)
        throw Error('Lunchbox preparation failed');
      await page.getByRole('button', { name: /Mở cửa tiệm/ }).click();
      await page.getByRole('button', { name: /Ăn cơm hộp mang theo/ }).click();
      await page.waitForFunction(key =>
        JSON.parse(localStorage.getItem(key) || '{}').morning?.packedLunchEaten === true, KEY);
      const eaten = await saved();
      if (eaten.cash !== prepared.cash ||
          eaten.city.minutes !== prepared.city.minutes + 10 ||
          eaten.morning.satiety !== Math.min(100, prepared.morning.satiety + 30) ||
          eaten.city.energy !== Math.min(100, prepared.city.energy + 4))
        throw Error('Lunchbox effects or payment incorrect');
      await page.reload({ waitUntil: 'domcontentloaded' });
      const restored = await saved();
      if (restored.morning.packedLunchEaten !== true ||
          restored.cash !== eaten.cash ||
          restored.morning.satiety !== eaten.morning.satiety ||
          await page.getByRole('button', { name: /Ăn cơm hộp mang theo/ }).count())
        throw Error('Lunchbox save/reload duplicated or lost');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2))
        throw Error('Horizontal overflow');
      if (errors.length) throw Error('Console: ' + errors.join(' | '));
      await page.screenshot({ path: OUT + '/' + width + 'x' + height + '.png',
        fullPage: true, animations: 'disabled' });
      report.passed.push(width + 'x' + height);
    } catch (e) {
      report.errors.push(width + 'x' + height + ': ' + String(e.stack || e));
      await page.screenshot({ path: OUT + '/FAIL-' + width + 'x' + height + '.png',
        fullPage: true }).catch(() => {});
    } finally {
      await page.close();
    }
  }
} finally {
  await writeFile(OUT + '/results.json', JSON.stringify(report, null, 2));
  console.log('PACKED_LUNCH_REPORT ' + JSON.stringify(report));
  await browser.close();
}
if (report.errors.length) process.exitCode = 1;
