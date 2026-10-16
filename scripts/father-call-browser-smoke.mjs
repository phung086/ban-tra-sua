import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: [
  '--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });
const base = process.env.SMOKE_URL || 'http://127.0.0.1:5192';
const viewports = [[360,800],[390,844],[844,390],[1280,800]];
try {
  for (const [width,height] of viewports) {
    const context = await browser.newContext({ viewport: {width,height}, isMobile: width < 1000, hasTouch: width < 1000 });
    const page = await context.newPage();
    await page.addInitScript(() => localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
      renderEngine: 'three', graphics: 'light', coachCompleted: true, motion: false, sound: false, music: false
    })));
    await page.goto(base, {waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForSelector('.life-morning', {timeout:90000});
    await page.getByRole('button',{name:/Thức dậy bắt đầu ngày mới/}).click();
    await page.getByRole('button',{name:/Đi làm luôn/}).click();
    await page.getByRole('button',{name:/Hẹn bố sửa biển hiệu/}).click();
    await page.waitForFunction(() => {
      const game = JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}');
      return game.morning?.fatherCall === 'promise'
        && game.relationshipRewardIds?.includes('family-father-quang-sign')
        && game.customerBond?.['family-father-quang'] === 2;
    },null,{timeout:20000});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForSelector('.life-morning',{timeout:90000});
    if (await page.getByRole('button',{name:/Hẹn bố sửa biển hiệu/}).count() !== 0)
      throw new Error('Duplicate father call after reload');
    if (!await page.getByRole('button',{name:/Mở cửa tiệm/}).isEnabled())
      throw new Error('Cannot open tea shop after father call');
    await page.getByRole('button',{name:/Mở cửa tiệm/}).click();
    await page.waitForSelector('.craft-stations button',{timeout:30000});
    await page.locator('.craft-stations button').nth(3).click();
    await page.locator('.seal-button').click();
    await page.locator('.serve-button').click();
    await page.waitForFunction(() => !!document.querySelector('.delivery-tag.carrying'),null,{timeout:30000});
    console.log('FATHER_SMOKE_PASS', width, height);
    await context.close();
  }
} finally {
  await browser.close();
}
