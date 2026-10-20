import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:390,height:844}});
try {
  await page.addInitScript(()=>localStorage.setItem('tiem-tra-chibi-ui-v1',JSON.stringify({renderEngine:'three',graphics:'light',coachCompleted:true,motion:false,sound:false,music:false})));
  await page.goto('http://127.0.0.1:5192');
  for(const [width,height] of [[360,800],[390,844],[844,390],[1280,800]]){
    await page.setViewportSize({width,height});
    await page.screenshot({path:'market-'+width+'x'+height+'.png'});
  }
  await page.getByRole('button',{name:/Thức dậy bắt đầu ngày mới/}).click();
  await page.getByRole('button',{name:/Mua bánh mì đầu ngõ/}).click();
  await page.getByRole('button',{name:/Mua trái cây cô Hạnh/}).click();
  await page.getByText('Đã ghé chợ hôm nay').waitFor();
} finally { await browser.close(); }

// PR #43 regression: the market's live promise callback and next-day fruit
// price must pass in the same four-viewport browser job, not just unit tests.
await import('./hanh-followup-browser-smoke.mjs');
