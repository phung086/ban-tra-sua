// Standalone production-browser E2E: node scripts/neighbor-ha-browser-smoke.mjs
// Requires playwright installed and a Vite preview on port 5193.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.HA_SMOKE_URL || 'http://127.0.0.1:5193';
const dir = process.env.HA_SMOKE_OUTPUT || 'artifacts/neighbor-ha';
const sizes = [[360, 800], [390, 844], [844, 390], [1280, 800]];
const browser = await chromium.launch({ headless: true, args: [
  '--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });
await mkdir(dir, { recursive: true });
const results = [];
const assert = (value, message) => { if (!value) throw new Error(message); };
try {
  for (const [width, height] of sizes) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 1000, isMobile: width < 1000 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
      renderEngine: 'three', graphics: 'light', coachCompleted: true, motion: false, sound: false, music: false,
    })));
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click({ timeout: 30000 });
    await page.getByRole('button', { name: /Đi làm luôn/ }).click({ timeout: 30000 });
    const panel = page.getByRole('region', { name: 'Bữa cơm của chị Hà' });
    await panel.getByRole('button', { name: /Phụ chị Hà chuyển thùng rau/ }).waitFor();
    const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || 'null'));
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || 'null')?.morning?.step === 'finished');
    const before = await read();
    await panel.getByRole('button', { name: /Phụ chị Hà chuyển thùng rau/ }).click();
    await panel.getByText(/Đã lưu, không nhận hai lần/).waitFor();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || 'null')?.city?.stories?.choices?.includes('neighbor-ha:1:help'));
    const after = await read();
    assert(after.cash === before.cash, 'meal must be free');
    assert(after.city.minutes === before.city.minutes + 12, 'meal time not charged');
    assert(after.city.energy === before.city.energy - 3, 'meal energy not charged');
    assert(after.morning.satiety === before.morning.satiety + 25, 'meal satiety not applied');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('region', { name: 'Bữa cơm của chị Hà' }).getByText(/Đã lưu, không nhận hai lần/).waitFor();
    assert(await page.getByRole('region', { name: 'Bữa cơm của chị Hà' }).getByRole('button').count() === 0, 'reward repeatable after reload');
    const persisted = await read();
    assert(persisted.city.minutes === after.city.minutes, 'time duplicated after reload');
    await page.screenshot({ path: `${dir}/ha-${width}x${height}.png`, animations: 'disabled', timeout: 90000 });
    assert(errors.length === 0, `browser errors ${width}x${height}: ${errors.join('; ')}`);
    results.push({ width, height, passed: true, cash: persisted.cash, satiety: persisted.morning.satiety, errors });
    await context.close();
  }
  console.log('NEIGHBOR_HA_E2E ' + JSON.stringify(results));
} finally {
  await writeFile(`${dir}/report.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
