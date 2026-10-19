// Production-preview browser check: real teamwork click, save/reload, sleep/wake and NPC callback.
// Summary is seeded in a separate browser context; this does not replace a full serve/deliver E2E.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const url = process.env.STREET_TEAMWORK_URL || 'http://127.0.0.1:5192';
const output = process.env.STREET_TEAMWORK_OUTPUT || 'street-teamwork-artifacts';
const viewports = [[360,800], [390,844], [844,390], [1280,800]];
const summary = { day: 1, eventName: 'Ngày thường', orders: 1, perfectOrders: 0,
  bestCombo: 0, revenue: 0, ingredientCost: 0, wasteCost: 0, profit: 0,
  averageScore: 80, fansGained: 0, researchGained: 0 };
const seed = { saveVersion: 3, day: 1, phase: 'prep', cash: 0,
  city: { day: 1, minutes: 530, energy: 20, goodwill: 0, stories: { bonds: { lan: 0 } } },
  morning: { day: 1, worldSeed: 'street-teamwork-e2e', step: 'finished',
    breakfast: 'skip', satiety: 30, fatherCall: null, lunchPrep: null,
    plan: { schemaVersion: 1, worldSeed: 'street-teamwork-e2e', day: 1,
      episodeId: 'day-001', wakeVariant: 'on-time', wakeMinute: 480,
      weather: { name: 'Nắng nhẹ', rain: false, temperature: 27 },
      customerTone: 'ordinary', socialHook: 'none',
      streetHook: 'forgotten-umbrella', crowdVariant: 0 } } };
const report = { environment: 'Chromium SwiftShader; not physical Android/iPhone',
  viewports: [], errors: [], fullShift: 'PENDING - summary fixture' };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: [
  '--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });
try {
  for (const [width, height] of viewports) {
    const viewport = { width, height };
    const options = { viewport, isMobile: width < 1000, hasTouch: width < 1000,
      deviceScaleFactor: 1 };
    const context = await browser.newContext(options);
    const errors = [];
    const page = await context.newPage();
    const observe = p => {
      p.on('pageerror', e => errors.push(e.message));
      p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    };
    observe(page);
    await page.addInitScript(initial => {
      if (!localStorage.getItem('tiem-tra-chibi-save-v3'))
        if (!localStorage.getItem('tiem-tra-chibi-save-v3'))
        localStorage.setItem('tiem-tra-chibi-save-v3', JSON.stringify(initial));
      localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
        renderEngine: 'three', graphics: 'light', coachCompleted: true,
        motion: false, sound: false, music: false,
      }));
    }, seed);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    const region = page.getByRole('region', { name: 'Góc phố sáng nay' });
    await region.getByRole('button', { name: /Nhờ Lan cùng tìm chiếc ô/ }).waitFor({ timeout: 90000 });
    await page.screenshot({ path: path.join(output, 'before-'+width+'x'+height+'.png'),
      animations: 'disabled', timeout: 90000 });
    await region.getByRole('button', { name: /Nhờ Lan cùng tìm chiếc ô/ }).click({ timeout: 30000 });
    await page.waitForFunction(() => {
      const s = JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}');
      return s.relationshipRewardIds?.includes('street-moment-1-forgotten-umbrella-team') &&
        s.city?.stories?.bonds?.lan === 1 && s.city?.minutes === 538 &&
        s.city?.energy === 19 && s.cash === 0;
    }, null, { timeout: 20000 });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    assert.equal(await region.getByRole('button', { name: /Nhờ Lan cùng tìm chiếc ô/ }).count(), 0);
    const persisted = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}'));
    assert.equal(persisted.relationshipRewardIds.filter(id =>
      id === 'street-moment-1-forgotten-umbrella-team').length, 1);
    await page.screenshot({ path: path.join(output, 'saved-'+width+'x'+height+'.png'),
      animations: 'disabled', timeout: 90000 });

    const nightContext = await browser.newContext(options);
    const night = await nightContext.newPage();
    observe(night);
    await night.addInitScript(initial => {
      if (!localStorage.getItem('tiem-tra-chibi-save-v3'))
        localStorage.setItem('tiem-tra-chibi-save-v3', JSON.stringify(initial));
      localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
        renderEngine: 'three', graphics: 'light', coachCompleted: true,
        motion: false, sound: false, music: false,
      }));
    }, { ...persisted, phase: 'summary', summary });
    await night.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await night.getByRole('button', { name: /Đi ngủ · sang ngày 2/ }).click({ timeout: 90000 });
    assert.equal(await night.getByText(/Lan nhắn:.*Bác Minh/).count(), 0,
      'No next-day callback before waking');
    await night.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click({ timeout: 30000 });
    await night.getByText(/Lan nhắn:.*Bác Minh/).waitFor({ timeout: 30000 });
    await night.screenshot({ path: path.join(output, 'callback-'+width+'x'+height+'.png'),
      animations: 'disabled', timeout: 90000 });
    await night.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await night.getByText(/Lan nhắn:.*Bác Minh/).waitFor({ timeout: 30000 });
    const tomorrow = await night.evaluate(() =>
      JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}'));
    assert.equal(tomorrow.day, 2);
    assert.equal(tomorrow.city.stories.bonds.lan, 1);
    assert.deepEqual(errors, []);
    report.viewports.push({ width, height, result: 'PASS', savedChoice: 'team',
      nextDay: tomorrow.day, helperBond: tomorrow.city.stories.bonds.lan });
    await nightContext.close();
    await context.close();
  }
} catch (e) {
  report.errors.push(String(e.stack || e));
  process.exitCode = 1;
} finally {
  await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
