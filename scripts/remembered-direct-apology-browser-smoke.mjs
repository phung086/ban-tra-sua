// Browser E2E: apologize for a remembered wrong cup, serve a correct cup, reload.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const KEY='tiem-tra-chibi-save-v3', OUT='artifacts/remembered-direct-apology';
const report={passed:[],errors:[],environment:'Chromium/SwiftShader (not physical phones)'};
await mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 for(const [width,height] of [[360,800],[390,844],[844,390],[1280,800]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});
  page.setDefaultTimeout(90000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{
   if(!localStorage.getItem('tiem-tra-chibi-ui-v1'))
    localStorage.setItem('tiem-tra-chibi-ui-v1',JSON.stringify({renderEngine:'three',graphics:'light',coachCompleted:true,motion:false,sound:false,music:false}));
  });
  try{
   await page.goto(process.env.PREVIEW_URL??'http://127.0.0.1:5193',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(k=>!!localStorage.getItem(k),KEY);
   const fixture=await page.evaluate(k=>{
    const s=JSON.parse(localStorage.getItem(k));
    s.day=4;s.phase='open';s.cash=210000;
    s.city={...s.city,day:4,minutes:850,energy:50};
    s.morning={...s.morning,day:4,step:'finished',plan:{...s.morning.plan,day:4}};
    s.reviews=[{id:'apology-review',customerId:'miu',customerName:'Miu',day:1,stars:2,score:45,text:'Trà hơi ngọt',replyStyle:'sweet',replyText:'Đã ghi nhận'}];
    s.relationshipRewardIds=['review-care:apology-review:1:message','review-followup:apology-review:remember','remembered-outcome:miu:wrong-day3:3:bad'];
    s.storyLog=[];
    s.currentOrder={id:'apology-day4',customerId:'miu',size:'M',base:'classic-milk-tea',sugar:25,ice:50,topping:'none',targetFill:80,targetShake:60,price:20000};
    s.draft={...s.draft,size:'M',base:'classic-milk-tea',sugar:25,ice:50,topping:'none',fill:80,shake:60,sealed:false};
    s.currentOrderQueuedAt=Date.now();s.customerQueue=[];
    return s;
   },KEY);
   // Old document's pagehide writes the old React state. Seed before new hydration.
   await page.addInitScript(({key,fixture})=>{
    if(sessionStorage.getItem('apology-seeded'))return;
    localStorage.setItem(key,JSON.stringify(fixture));
    sessionStorage.setItem('apology-seeded','1');
   },{key:KEY,fixture});
   await page.reload({waitUntil:'domcontentloaded'});
   await page.getByRole('note').filter({hasText:'Ly chưa đúng đơn'}).waitFor();
   await page.getByRole('button',{name:/Xin lỗi vì ly giao sai/}).click();
   const apology='remembered-quiet-apology:apology-day4';
   await page.waitForFunction(({key,id})=>JSON.parse(localStorage.getItem(key)||'{}').relationshipRewardIds?.includes(id),{key:KEY,id:apology});
   const after=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
   if(after.city.minutes!==852||after.city.energy!==49||after.cash!==210000||after.currentOrder.sugar!==25||after.relationshipRewardIds.includes('remembered-greeting:apology-day4'))
    throw Error('Apology cost or recipe regression');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.getByText(/Đã nhận lỗi. Hãy giao đúng ly thật/).waitFor();
   if(await page.getByRole('button',{name:/Xin lỗi vì ly giao sai/}).count())throw Error('Duplicate apology action');
   await page.locator('.craft-stations button').nth(3).click();
   await page.locator('.seal-button').click();
   await page.locator('.serve-button').click();
   await page.locator('.place-buttons button.destination').click();
   await page.waitForSelector('.delivery-tag button.primary-button:not([disabled])');
   await page.locator('.delivery-tag button.primary-button').click();
   const callback='remembered-service:apology-day4';
   await page.waitForFunction(({key,id})=>JSON.parse(localStorage.getItem(key)||'{}').relationshipRewardIds?.includes(id),{key:KEY,id:callback});
   const delivered=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
   if(!delivered.storyLog.some(x=>x.id===callback&&x.text.includes('Khách ghi nhận lời xin lỗi và ly trà được sửa đúng đơn.')))
    throw Error('NPC did not acknowledge repaired delivery');
   await page.reload({waitUntil:'domcontentloaded'});
   const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
   for(const id of [apology,callback,'remembered-outcome:miu:apology-day4:4:good'])
    if(saved.relationshipRewardIds.filter(x=>x===id).length!==1)throw Error('Missing/duplicate '+id);
   if(saved.served!==delivered.served||saved.city.minutes!==delivered.city.minutes)throw Error('Reload state changed');
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2))throw Error('Horizontal overflow');
   if(errors.length)throw Error('Console: '+errors.join(' | '));
   await page.screenshot({path:`${OUT}/${width}x${height}.png`,fullPage:true,animations:'disabled'});
   report.passed.push(`${width}x${height}: apology/delivery/reload`);
  }catch(e){
   report.errors.push(`${width}x${height}: ${String(e.stack||e)}`);
   await page.screenshot({path:`${OUT}/FAIL-${width}x${height}.png`,fullPage:true}).catch(()=>{});
  }finally{await page.close();}
 }
}finally{
 await writeFile(`${OUT}/results.json`,JSON.stringify(report,null,2));
 console.log('DIRECT_APOLOGY_BROWSER_REPORT '+JSON.stringify(report));
 await browser.close();
}
if(report.errors.length)process.exitCode=1;
