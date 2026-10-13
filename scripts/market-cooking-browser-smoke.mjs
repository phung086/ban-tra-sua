// Production Chromium smoke for the playable morning market and kitchen.
// SwiftShader emulation is not a physical Android/iOS performance measurement.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.MARKET_BROWSER_URL || 'http://127.0.0.1:5192';
const out = process.env.MARKET_BROWSER_OUTPUT || 'market-browser-artifacts';
const viewports = [[360,800],[390,844],[844,390],[1280,800]];
const browser = await chromium.launch({ headless:true, args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
] });
await mkdir(out,{recursive:true});
const report = { environment:'headless Chromium / SwiftShader, not real device', passed:[], errors:[] };
try {
  for (const [width,height] of viewports) {
    const context = await browser.newContext({
      viewport:{width,height}, deviceScaleFactor:1, isMobile:width<1000, hasTouch:width<1000
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>{
      localStorage.setItem('tiem-tra-chibi-ui-v1',JSON.stringify({
        renderEngine:'three',graphics:'light',coachCompleted:true,motion:false,sound:false,music:false
      }));
    });
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForSelector('.life-morning',{timeout:120000});
    const open = page.getByRole('button',{name:/Mở cửa tiệm/});
    if (!await open.isDisabled()) throw new Error('shop should be locked before breakfast');
    await page.getByRole('button',{name:/Thức dậy bắt đầu ngày mới/}).click();
    await page.getByRole('button',{name:/Đi làm luôn/}).click();
    await page.getByRole('button',{name:/Mua rau và trứng ở chợ/}).click();
    await page.getByRole('button',{name:/Nấu canh rau tại nhà/}).click();
    await page.waitForFunction(()=>{
      try {
        const s=JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')||'{}');
        return s.cash===208000&&s.morning?.marketVisit==='basket'&&
          s.morning?.homeCooked===true&&s.morning?.satiety===50&&
          s.storyLog?.some(m=>m.customerId==='hanh');
      } catch { return false; }
    },null,{timeout:20000});
    await page.screenshot({path:path.join(out,`market-${width}x${height}.png`),animations:'disabled',timeout:90000});
    await page.reload({waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForSelector('.life-market',{timeout:120000});
    if (await page.getByRole('button',{name:/Mua rau và trứng ở chợ/}).count()) throw new Error('market replay button visible after reload');
    if (await page.getByRole('button',{name:/Nấu canh rau tại nhà/}).count()) throw new Error('cooking replay button visible after reload');
    if (!await open.isEnabled()) throw new Error('shop should be available after cooking');
    await open.click({timeout:30000});
    await page.waitForFunction(()=>{
      try { const s=JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')||'{}');
        return s.phase==='open'&&s.cash===208000&&s.morning?.homeCooked===true;
      } catch {return false;}
    },null,{timeout:20000});
    if (errors.length) throw new Error('browser pageerror: '+errors.join('; '));
    report.passed.push(`${width}x${height}: market, cooking, persisted reload and shop open`);
    await context.close();
  }
} catch (error) {
  report.errors.push(String(error.stack||error));
  process.exitCode=1;
} finally {
  await writeFile(path.join(out,'results.json'),JSON.stringify(report,null,2));
  console.log('MARKET_BROWSER_REPORT '+JSON.stringify(report));
  await browser.close();
}
