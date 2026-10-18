// Browser E2E: unavailable WebGL must not prevent a real tea delivery.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const KEY = 'tiem-tra-chibi-save-v3';
const OUT = 'artifacts/navigation-fallback';
const report = { passed: [], errors: [], environment: 'Chromium with WebGL disabled; not physical devices' };
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, args: [
  '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });
try {
  for (const [width, height] of [[360, 800], [390, 844], [844, 390], [1280, 800]]) {
    const page = await browser.newPage({ viewport: { width, height },
      isMobile: width < 1000, hasTouch: width < 1000 });
    page.setDefaultTimeout(90000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {
      if (m.type() !== 'error') return;
      if (/Không mở được đồ họa|Error creating WebGL context|THREE\.WebGLRenderer/.test(m.text())) return;
      errors.push(m.text());
    });
    // Force context creation to fail regardless of the renderer's hashed chunk name.
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
        if (/^(webgl2?|experimental-webgl)$/i.test(String(kind))) return null;
        return original.call(this, kind, ...args);
      };
    });
    await page.addInitScript(() => localStorage.setItem('tiem-tra-chibi-ui-v1',
      JSON.stringify({ renderEngine: 'three', graphics: 'light',
        coachCompleted: true, motion: false, sound: false, music: false })));
    try {
      await page.goto(process.env.PREVIEW_URL ?? 'http://127.0.0.1:5193',
        { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(key => Boolean(localStorage.getItem(key)), KEY);
      const fixture = await page.evaluate(key => {
        const state = JSON.parse(localStorage.getItem(key));
        state.day = 4;
        state.phase = 'open';
        state.targetOrders = 1;
        state.served = 0;
        state.cash = 210000;
        state.city = { ...state.city, day: 4, minutes: 850, energy: 50 };
        state.morning = { ...state.morning, day: 4, step: 'finished',
          plan: { ...state.morning.plan, day: 4 } };
        state.currentOrder = { id: 'fallback-day4', customerId: 'miu',
          size: 'M', base: 'classic-milk-tea', sugar: 25, ice: 50,
          topping: 'none', targetFill: 80, targetShake: 60, price: 20000 };
        state.currentOrderQueuedAt = Date.now();
        state.customerQueue = [];
        state.draft = { ...state.draft, size: 'M', base: 'classic-milk-tea',
          sugar: 25, ice: 50, topping: 'none', fill: 80, shake: 60, sealed: false };
        return state;
      }, KEY);
      await page.addInitScript(({ key, fixture }) => {
        if (sessionStorage.getItem('navigation-fallback-seeded')) return;
        localStorage.setItem(key, JSON.stringify(fixture));
        sessionStorage.setItem('navigation-fallback-seeded', '1');
      }, { key: KEY, fixture });
      await page.reload({ waitUntil: 'domcontentloaded' });
      const webglAvailable = await page.evaluate(() => Boolean(
        document.createElement('canvas').getContext('webgl2') ||
        document.createElement('canvas').getContext('webgl')
      ));
      if (webglAvailable) throw new Error('Invalid fixture: WebGL was not disabled');
      await page.locator('.world-viewport[data-renderer="fallback"]').waitFor();
      await page.getByText(/Thiết bị chưa mở được đồ họa 3D/).waitFor();
      await page.locator('.craft-stations button').nth(3).click();
      await page.locator('.seal-button').click();
      await page.locator('.serve-button').click();
      await page.locator('.place-buttons button.destination').click();
      await page.waitForSelector('.delivery-tag button.primary-button:not([disabled])');
      await page.locator('.delivery-tag button.primary-button').click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}').served >= 1, KEY);
      const delivered = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      await page.reload({ waitUntil: 'domcontentloaded' });
      const restored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (restored.served !== delivered.served || restored.cash !== delivered.cash ||
          restored.city.minutes !== delivered.city.minutes)
        throw new Error('Delivery outcome changed after save/reload');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2))
        throw new Error('Horizontal overflow');
      if (errors.length) throw new Error('Unexpected console/page errors: ' + errors.join(' | '));
      await page.screenshot({ path: OUT + '/' + width + 'x' + height + '.png',
        fullPage: true, animations: 'disabled' });
      report.passed.push(width + 'x' + height + ': no WebGL → 2D place → delivery → reload');
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
  console.log('NAVIGATION_FALLBACK_REPORT ' + JSON.stringify(report));
  await browser.close();
}
if (report.errors.length) process.exitCode = 1;
