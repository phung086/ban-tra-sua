import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.MOBILE_LAYOUT_URL || 'http://127.0.0.1:5192';
const output = process.env.MARKET_SMOKE_OUTPUT || 'market-browser-artifacts';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({headless: true, args: [
  '--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
]});
const report = { viewport: [], assertions: [], errors: [] };
const assert = (value, message) => { if (!value) throw Error(message); report.assertions.push(message); };
try {
  const context = await browser.newContext({ viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
      renderEngine: 'three', graphics: 'light', coachCompleted: true,
      motion: false, sound: false, music: false,
    }));
  });
  await page.goto(base, {waitUntil: 'domcontentloaded', timeout: 90000});
  await page.waitForSelector('.street-world canvas', {timeout: 120000});
  const sizes = [[360,800], [390,844], [844,390], [1280,800]];
  for (const [width, height] of sizes) {
    await page.setViewportSize({width,height});
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert(overflow <= 2, `no horizontal overflow at ${width}x${height}`);
    await page.screenshot({path: path.join(output, `before-${width}x${height}.png`), animations: 'disabled'});
    report.viewport.push({width,height,overflow});
  }
  await page.setViewportSize({width:390,height:844});
  const open = page.getByRole('button',{name:/Mở cửa tiệm/});
  assert(await open.isDisabled(), 'shop locked until morning completed');
  await page.getByRole('button',{name:/Thức dậy bắt đầu ngày mới/}).click();
  await page.getByRole('button',{name:/Mua bánh mì đầu ngõ/}).click();
  assert(await page.getByRole('button',{name:/Mua trái cây cô Hạnh/}).isVisible(), 'market available after breakfast');
  await page.getByRole('button',{name:/Mua trái cây cô Hạnh/}).click();
  await page.waitForFunction(() => {
    try {
      const save = JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3') || '{}');
      return save.cash === 188000 && save.morning?.marketVisit === 'fruit' &&
        save.morning?.satiety === 82;
    } catch { return false; }
  },null,{timeout:15000});
  assert(await page.getByText('Đã ghé chợ hôm nay').isVisible(), 'market outcome shown');
  await page.screenshot({path:path.join(output,'market-result-390x844.png'),animations:'disabled'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('.street-world canvas',{timeout:120000});
  assert(await page.getByText('Đã ghé chợ hôm nay').isVisible(), 'market choice survives reload');
  assert(await open.isEnabled(), 'shop opens after breakfast');
  await open.click();
  await page.setViewportSize({width:844,height:390});
  await page.waitForSelector('.movement-stick',{timeout:30000});
  assert(await page.locator('.movement-stick').count() > 0, 'landscape joystick remains mounted');
  assert(await page.locator('.craft-stations button').count() === 4, 'tea workbench remains interactive');
  await page.locator('.craft-stations button').nth(3).click();
  await page.locator('.seal-button').click();
  assert(await page.locator('.serve-button').count() === 1, 'delivery action remains available');
  assert(report.errors.length === 0, 'no browser JavaScript exceptions');
  await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
} finally {
  await browser.close();
}
