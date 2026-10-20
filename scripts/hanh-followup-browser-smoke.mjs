import { chromium } from 'playwright';

const SAVE = 'tiem-tra-chibi-save-v3';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text());
});

try {
  await page.addInitScript(() => localStorage.setItem('tiem-tra-chibi-ui-v1',
    JSON.stringify({ renderEngine: 'three', graphics: 'light',
      coachCompleted: true, motion: false, sound: false, music: false })));
  await page.goto('http://127.0.0.1:5192');
  await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
  await page.getByRole('button', { name: /Đi làm luôn/ }).click();
  await page.getByRole('button', { name: /Hỏi thăm cô Hạnh/ }).click();
  await page.getByRole('button', { name: /Hẹn mai phụ cô Hạnh/ }).click();
  await page.waitForTimeout(650);
  const promised = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE);
  if (!promised.relationshipRewardIds.includes('hanh-market-help:promise:1'))
    throw new Error('Promise was not saved');

  // Synthetic valid v3 day-2 fixture. This does NOT replace a full sleep E2E.
  const save = structuredClone(promised);
  save.day = 2;
  save.phase = 'prep';
  save.city.day = 2;
  save.city.minutes = 480;
  save.morning.day = 2;
  save.morning.step = 'asleep';
  save.morning.breakfast = null;
  save.morning.marketVisit = null;
  save.morning.plan.day = 2;
  save.morning.plan.wakeMinute = 480;
  // Seed after pagehide has finished writing day 1; seed only once.
  await page.addInitScript(fixture => {
    if (!sessionStorage.getItem('__hanh_fixture_loaded')) {
      localStorage.setItem('tiem-tra-chibi-save-v3', JSON.stringify(fixture));
      sessionStorage.setItem('__hanh_fixture_loaded', '1');
    }
  }, save);
  await page.reload();
  await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
  await page.getByRole('button', { name: /Đi làm luôn/ }).click();
  for (const [width, height] of [[360, 800], [390, 844], [844, 390], [1280, 800]]) {
    await page.setViewportSize({ width, height });
    await page.getByRole('button', { name: /Phụ xếp sạp/ }).waitFor();
    await page.screenshot({ path: `hanh-help-${width}x${height}.png` });
  }
  await page.getByRole('button', { name: /Phụ xếp sạp/ }).click();
  await page.waitForTimeout(650);
  await page.reload();
  await page.getByText(/Đã giải quyết lời hẹn hôm nay/).waitFor();
  const resolved = await page.evaluate(key => JSON.parse(localStorage.getItem(key))
    .relationshipRewardIds.filter(id => id.startsWith('hanh-market-help:resolved:')), SAVE);
  if (resolved.length !== 1) throw new Error('Hanh resolution duplicated or missing');

  // Day-three fixture is synthetic. It verifies saved callback UI, NOT sleep E2E.
  const savedDayTwo = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE);
  const dayThree = structuredClone(savedDayTwo);
  dayThree.day = 3;
  dayThree.phase = 'prep';
  dayThree.city.day = 3;
  dayThree.city.minutes = 480;
  dayThree.morning.day = 3;
  dayThree.morning.step = 'asleep';
  dayThree.morning.breakfast = null;
  dayThree.morning.marketVisit = null;
  dayThree.morning.plan.day = 3;
  dayThree.morning.plan.wakeMinute = 480;
  await page.addInitScript(fixture => {
    if (!sessionStorage.getItem('__hanh_day3_loaded')) {
      localStorage.setItem('tiem-tra-chibi-save-v3', JSON.stringify(fixture));
      sessionStorage.setItem('__hanh_day3_loaded', '1');
    }
  }, dayThree);
  await page.reload();
  await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
  await page.getByRole('button', { name: /Đi làm luôn/ }).click();
  for (const [width, height] of [[360, 800], [390, 844], [844, 390], [1280, 800]]) {
    await page.setViewportSize({ width, height });
    await page.getByLabel('Cô Hạnh nhớ lời hẹn').waitFor();
    await page.getByText(/Nhờ hôm trước cháu xếp sạp/).waitFor();
    await page.screenshot({ path: `hanh-followup-${width}x${height}.png` });
  }
  const savedDayThree = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE);
  if (savedDayThree.relationshipRewardIds.filter(id => id.startsWith('hanh-market-help:resolved:')).length !== 1)
    throw new Error('Hanh callback duplicated resolution reward');
  if (errors.length) throw new Error('Browser console/page errors: ' + errors.join(' | '));
  console.log('Hanh callback browser smoke: four viewports, synthetic day 3, once-only resolution');
} finally {
  await browser.close();
}
