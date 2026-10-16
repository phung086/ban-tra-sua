import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const base = process.env.GAME_BROWSER_URL || 'http://127.0.0.1:5193';
const errors = [];
async function newPage(viewport) {
  const page = await browser.newPage({viewport, isMobile: viewport.width < 1000, hasTouch: viewport.width < 1000});
  page.setDefaultTimeout(90000);
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem('tiem-tra-chibi-ui-v1')) localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({renderEngine:'three',graphics:'light',coachCompleted:false,motion:false,sound:false,music:false}));
  });
  return page;
}

const sizes = [[360,800],[390,844],[844,390],[1280,800]];
try {
  for (const [width,height] of sizes) {
    const page = await newPage({width,height});
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Bỏ qua' }).click();
    await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
    await page.locator('.life-morning[data-step="awake"]').waitFor();
    await page.getByRole('button', { name: /Đi làm luôn/ }).click();
    await page.getByRole('button', { name: /Chia đôi hóa đơn với Lan/ }).click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}');
      return saved.morning?.lanMeal === 'split' && saved.cash === 155000;
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.life-lan-reply').waitFor();
    if (await page.getByRole('button', { name: /Chia đôi hóa đơn với Lan/ }).count()) throw Error('Double charge UI');
    const cash = await page.evaluate(() => JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}').cash);
    if (cash !== 155000) throw Error('Wallet changed on reload');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2)) throw Error('Horizontal overflow');
    console.log('PASS', width, height);
    await page.close();
  }
  // Separate new game: free walk must be a playable alternative on a phone.
  const walkPage = await newPage({width:390,height:844});
  await walkPage.goto(base, { waitUntil: 'domcontentloaded' });
  await walkPage.getByRole('button', { name: 'Bỏ qua' }).click();
  await walkPage.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
  await walkPage.getByRole('button', { name: /Đi làm luôn/ }).click();
  await walkPage.getByRole('button', { name: /Đi dạo công viên cùng Lan/ }).click();
  await walkPage.waitForFunction(() => {
    const save = JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}');
    return save.morning?.lanMeal === 'walk' && save.cash === 220000 && save.city?.stories?.bonds?.lan === 1;
  });
  await walkPage.reload({ waitUntil: 'domcontentloaded' });
  await walkPage.locator('.life-lan-reply').waitFor();
  if (await walkPage.getByRole('button', { name: /Đi dạo công viên cùng Lan/ }).count()) throw Error('Walk offered twice');
  console.log('PASS free Lan walk 390x844 and reload');
  await walkPage.close();
  if (errors.length) throw new Error('Browser errors: '+errors.join('; '));
} finally {
  await browser.close();
}
