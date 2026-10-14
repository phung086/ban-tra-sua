// Production-preview smoke for the late apology: interaction, sleep, reload and NPC memory.
// Run with Playwright installed and Vite preview at port 5192; this is not a device test.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.env.EVENING_HA_URL || 'http://127.0.0.1:5192';
const out = process.env.EVENING_HA_OUTPUT || 'evening-ha-repair-artifacts';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: [
  '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });
const summary = { day: 5, eventName: 'Ngày thường', orders: 1, perfectOrders: 0,
  bestCombo: 0, revenue: 0, ingredientCost: 0, wasteCost: 0, profit: 0,
  averageScore: 80, fansGained: 0, researchGained: 0 };
try {
  for (const [width, height] of [[360, 800], [390, 844], [844, 390], [1280, 800]]) {
    const context = await browser.newContext({ viewport: { width, height } });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(initial => {
        if (!localStorage.getItem('tiem-tra-chibi-save-v3')) {
          localStorage.setItem('tiem-tra-chibi-save-v3', JSON.stringify(initial));
        }
        localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
          renderEngine: 'three', graphics: 'light', coachCompleted: true,
          motion: false, sound: false, music: false,
        }));
      }, { saveVersion: 3, day: 5, phase: 'summary', cash: 0, summary,
        city: { day: 5, minutes: 1260, energy: 0, goodwill: 3 },
        relationshipRewardIds: ['evening-ha-1-help', 'evening-ha-3-postpone', 'evening-ha-4-rest'],
        storyLog: [] });
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      const panel = page.getByRole('region', { name: 'Bữa tối sau ca' });
      await panel.waitFor({ timeout: 90000 });
      await page.getByRole('button', { name: /Nhắn xin lỗi Hà vì lỡ hẹn/ }).click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}')
        .relationshipRewardIds?.includes('evening-ha-5-message'));
      await page.screenshot({ path: `${out}/apology-${width}x${height}.png`, animations: 'disabled' });
      await page.reload({ waitUntil: 'domcontentloaded' });
      assert.equal(await page.getByRole('button', { name: /Nhắn xin lỗi Hà vì lỡ hẹn/ }).count(), 0);
      await page.getByRole('button', { name: /Đi ngủ · sang ngày 6/ }).click();
      assert.equal(await page.getByRole('region', { name: 'Lời nhắn từ Hà' }).count(), 0);
      await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
      const reply = page.getByRole('region', { name: 'Lời nhắn từ Hà' });
      await reply.waitFor();
      assert.match(await reply.innerText(), /Mình nhận được lời xin lỗi/);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await reply.waitFor();
      const state = await page.evaluate(() => JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')));
      assert.equal(state.day, 6);
      assert.equal(state.relationshipRewardIds.filter(id => id === 'evening-ha-5-message').length, 1);
      assert.deepEqual(errors, []);
      await page.screenshot({ path: `${out}/reply-${width}x${height}.png`, animations: 'disabled' });
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
