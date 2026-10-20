import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
]});
const page = await browser.newPage({viewport:{width:390,height:844}});
const browserErrors=[];
page.on('pageerror',error=>browserErrors.push(error.message));
page.on('console',message=>{
  if(message.type()==='error')browserErrors.push(message.text());
});
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

  // Hanh postponement: real UI click and persisted ledger, synthetic day-2 fixture.
  // Reuse the existing tab instead of keeping two live WebGL scenes on CI.
  // Seed a clean day-1 save before React initializes on the next navigation;
  // deleting storage before unload risks the old page writing its save back.
  const p = page;
  await p.setViewportSize({width:390,height:844});
  await p.addInitScript(()=>{
    if(!sessionStorage.getItem('__market_clean_start')){
      localStorage.removeItem('tiem-tra-chibi-save-v3');
      sessionStorage.setItem('__market_clean_start','1');
    }
  });
  await p.reload();
  try {
    await p.addInitScript(()=>localStorage.setItem('tiem-tra-chibi-ui-v1',JSON.stringify({
      renderEngine:'three',graphics:'light',coachCompleted:true,motion:false,sound:false,music:false
    })));
    await p.getByRole('button',{name:/Thức dậy bắt đầu ngày mới/}).click();
    await p.getByRole('button',{name:/Đi làm luôn/}).click();
    await p.getByRole('button',{name:/Hỏi thăm cô Hạnh/}).click();
    await p.getByRole('button',{name:/Hẹn mai phụ cô Hạnh/}).click();
    await p.waitForFunction(()=>JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')||'{}')
      .relationshipRewardIds?.includes('hanh-market-help:promise:1'));
    const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')));
    saved.day=2;saved.phase='prep';saved.city.day=2;saved.city.minutes=480;
    saved.morning.day=2;saved.morning.step='asleep';saved.morning.breakfast=null;
    saved.morning.marketVisit=null;saved.morning.plan.day=2;saved.morning.plan.wakeMinute=480;
    await p.addInitScript(game=>{
      if(!sessionStorage.getItem('__postpone_day2')){
        localStorage.setItem('tiem-tra-chibi-save-v3',JSON.stringify(game));
        sessionStorage.setItem('__postpone_day2','1');
      }
    },saved);
    await p.reload();
    await p.getByRole('button',{name:/Thức dậy bắt đầu ngày mới/}).click();
    await p.getByRole('button',{name:/Đi làm luôn/}).click();
    await p.getByRole('button',{name:/Báo cô Hạnh dời hẹn sang ngày 3/}).click();
    await p.waitForFunction(()=>JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')||'{}')
      .relationshipRewardIds?.includes('hanh-market-help:postponed:1:2'));
    for(const [width,height] of [[360,800],[390,844],[844,390],[1280,800]]){
      await p.setViewportSize({width,height});
      await p.getByText(/Cô Hạnh chờ ngày 3/).waitFor();
      if(await p.getByRole('button',{name:/Phụ xếp sạp/}).count())
        throw Error('Hanh help unlocked before due day');
      await p.screenshot({path:'hanh-postpone-'+width+'x'+height+'.png'});
    }
    await p.reload();
    await p.getByText(/Cô Hạnh chờ ngày 3/).waitFor();
    if(await p.getByRole('button',{name:/Báo cô Hạnh dời hẹn/}).count())
      throw Error('Duplicate Hanh postponement after reload');
  } finally {
    // Shared page is owned by the outer browser; do not close it here.
  }
} catch(error) {
  await page.screenshot({path:'market-failure.png'}).catch(()=>{});
  console.error('Market browser diagnostics:',browserErrors.join(' | ')||'no page/console errors captured');
  throw error;
} finally { await browser.close(); }

// PR #43 regression: the market's live promise callback and next-day fruit
// price must pass in the same four-viewport browser job, not just unit tests.
await import('./hanh-followup-browser-smoke.mjs');
