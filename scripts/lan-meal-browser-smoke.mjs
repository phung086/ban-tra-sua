import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const sizes = [[360,800],[390,844],[844,390],[1280,800]];
try {
  for (const [width,height] of sizes) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto('http://127.0.0.1:5193', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Bỏ qua' }).click();
    await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click();
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
} finally {
  await browser.close();
}
