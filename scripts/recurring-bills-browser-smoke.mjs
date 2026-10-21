import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const errors = [];
const consoleErrors = [];
const prefs = {
  renderEngine: 'three',
  graphics: 'light',
  coachCompleted: true,
  motion: false,
  sound: false,
  music: false,
};

async function makeFixture(page, day, cash) {
  return page.evaluate(async ({ day, cash }) => {
    const { createInitialState } = await import('/src/game/engine.ts');
    const { createMorning } = await import('/src/game/lifeSim/morning.ts');
    const base = createInitialState();
    const city = { ...base.city, day, minutes: 1260 };
    const morning = createMorning({ day, city }, base.morning.worldSeed);
    const summary = {
      day,
      eventName: base.event.name,
      orders: 0,
      perfectOrders: 0,
      bestCombo: 0,
      revenue: 0,
      ingredientCost: 0,
      wasteCost: 0,
      profit: 0,
      averageScore: 0,
      fansGained: 0,
      researchGained: 0,
    };
    return JSON.stringify({ ...base, day, city, morning, phase: 'summary', summary, cash });
  }, { day, cash });
}

async function openSeededPage(day, cash) {
  const seedPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await seedPage.goto('http://127.0.0.1:5192');
  await seedPage.waitForTimeout(700);
  const fixture = await makeFixture(seedPage, day, cash);
  await seedPage.close();

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.addInitScript(({ fixture, prefs }) => {
    localStorage.setItem('tiem-tra-chibi-save-v3', fixture);
    localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify(prefs));
  }, { fixture, prefs });
  await page.goto('http://127.0.0.1:5192');
  await page.getByRole('heading', { name: 'Hóa đơn điện nước' }).waitFor();
  return page;
}

try {
  const page = await openSeededPage(1, 200000);
  for (const [width, height] of [[360, 800], [390, 844], [844, 390], [1280, 800]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(150);
    await page.screenshot({ path: 'artifacts/utilities-' + width + 'x' + height + '.png', fullPage: true });
  }
  await page.getByRole('button', { name: /Để dành 5\.000.*hôm nay/ }).click();
  await page.getByRole('status', { name: /Đã để dành hôm nay/ }).waitFor();
  await page.reload();
  await page.getByRole('status', { name: /Đã để dành hôm nay/ }).waitFor();

  const duePage = await openSeededPage(30, 0);
  await duePage.getByRole('button', { name: 'Xin gia hạn miễn phí' }).click();
  await duePage.getByRole('status', { name: /Đã xin gia hạn kỳ 1/ }).waitFor();
  await duePage.reload();
  await duePage.getByRole('status', { name: /Đã xin gia hạn kỳ 1/ }).waitFor();
  await duePage.setViewportSize({ width: 360, height: 800 });
  await duePage.screenshot({ path: 'artifacts/utilities-due-360x800.png', fullPage: true });

  if (errors.length) throw new Error('Browser page errors: ' + errors.join(' | '));
  if (consoleErrors.length) throw new Error('Browser console errors: ' + consoleErrors.join(' | '));
  await page.close();
  await duePage.close();
} finally {
  await browser.close();
}
