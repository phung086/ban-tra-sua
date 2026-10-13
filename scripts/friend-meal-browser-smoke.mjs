import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: [
  '--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });
const base = process.env.SMOKE_URL || 'http://127.0.0.1:5195';
const viewports = [[360,800],[390,844],[844,390],[1280,800]];
try {
  for (const [width,height] of viewports) {
    const context = await browser.newContext({
      viewport: {width,height}, isMobile: width < 1000, hasTouch: width < 1000,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
      renderEngine:'three',graphics:'light',coachCompleted:true,motion:false,sound:false,music:false,
    })));
    await page.goto(base, {waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForSelector('.life-morning', {timeout:90000});
    await page.getByRole('button',{name:/Thức dậy bắt đầu ngày mới/}).click({timeout:30000});
    await page.getByRole('button',{name:/Đi làm luôn/}).click({timeout:15000});
    await page.getByRole('button',{name:/Chia đôi hóa đơn với Thảo/}).click({timeout:15000});
    await page.waitForFunction(() => {
      const save = JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}');
      return save.cash === 194000 && save.customerBond?.['friend-thao'] === 1
        && save.relationshipRewardIds?.includes('friend-thao-meal:1:split');
    }, null, {timeout:20000});
    await page.reload({waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForSelector('.life-friend-meal', {timeout:90000});
    if (await page.getByRole('button',{name:/Chia đôi hóa đơn với Thảo/}).count() !== 0)
      throw new Error('Bill can be paid twice after reload');
    if (!await page.getByRole('button',{name:/Mở cửa tiệm/}).isEnabled())
      throw new Error('Shop should open after friend meal');
    await page.getByRole('button',{name:/Mở cửa tiệm/}).click({timeout:30000});
    await page.locator('.craft-stations button').nth(3).click({timeout:20000});
    await page.locator('.seal-button').click({timeout:20000});
    await page.locator('.serve-button').click({timeout:20000});
    await page.waitForFunction(() => !!document.querySelector('.delivery-tag.carrying'),
      null,{timeout:30000});
    if (errors.length) throw new Error('Browser errors: '+errors.join('; '));
    console.log('FRIEND_MEAL_SMOKE_PASS',width,height);
    await context.close();
  }
} finally {
  await browser.close();
}
