// Run against Vite preview with Playwright. Emulated Chromium is not a physical-device test.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.WARM_TEA_URL || 'http://127.0.0.1:5192';
const output = process.env.WARM_TEA_OUTPUT || 'warm-tea-artifacts';
const viewports = [[360,800],[390,844],[844,390],[1280,800]];
const report = { environment: 'Chromium SwiftShader', viewports: [] };
await mkdir(output,{recursive:true});
const browser = await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
]});
try {
  for (const [width,height] of viewports) {
    const context = await browser.newContext({viewport:{width,height},
      isMobile:width<1000,hasTouch:width<1000,deviceScaleFactor:1});
    try {
      const page = await context.newPage(), errors = [];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
      await page.addInitScript(seed=>{
        if(!localStorage.getItem('tiem-tra-chibi-save-v3'))
          localStorage.setItem('tiem-tra-chibi-save-v3',JSON.stringify(seed));
        localStorage.setItem('tiem-tra-chibi-ui-v1',JSON.stringify({
          renderEngine:'three',graphics:'light',coachCompleted:true,
          motion:false,sound:false,music:false,
        }));
      },{saveVersion:3,day:2,phase:'summary',cash:100000,
        summary:{day:2,eventName:'Ngày thường',orders:1,perfectOrders:0,
          bestCombo:0,revenue:0,ingredientCost:0,wasteCost:0,profit:0,
          averageScore:80,fansGained:0,researchGained:0},
        relationshipRewardIds:[],storyLog:[]});
      await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000});
      await page.getByRole('region',{name:'Trà ấm cuối ca'}).waitFor({timeout:90000});
      await page.waitForFunction(()=>{
        const s=JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')||'{}');
        return s.inventory?.cupsM>0 && s.city?.energy>=2;
      },null,{timeout:15000});
      const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')));
      await page.screenshot({path:path.join(output,`before-${width}x${height}.png`),
        animations:'disabled',timeout:90000});
      await page.getByRole('button',{name:/Pha trà ấm cho bác Bình/}).click({timeout:30000});
      await page.waitForFunction(()=>{
        const s=JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')||'{}');
        return s.relationshipRewardIds?.includes('evening-warm-tea-2-brew');
      },null,{timeout:15000});
      const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')));
      assert.equal(after.inventory.cupsM,before.inventory.cupsM-1);
      assert.equal(after.inventory.classicMilkTea,before.inventory.classicMilkTea-1);
      assert.equal(after.inventory.sugar,before.inventory.sugar-1);
      assert.equal(after.city.energy,before.city.energy-2);
      await page.reload({waitUntil:'domcontentloaded',timeout:90000});
      assert.equal(await page.getByRole('button',{name:/Pha trà ấm cho bác Bình/}).count(),0);
      await page.getByRole('button',{name:/Đi ngủ · sang ngày 3/}).click({timeout:30000});
      assert.equal(await page.getByText(/trà ấm tối qua/).count(),0);
      await page.getByRole('button',{name:/Thức dậy bắt đầu ngày mới/}).click({timeout:30000});
      await page.getByRole('region',{name:'Trà ấm cuối ca'})
        .getByText(/trà ấm tối qua/).waitFor({timeout:30000});
      await page.screenshot({path:path.join(output,`reply-${width}x${height}.png`),
        animations:'disabled',timeout:90000});
      await page.reload({waitUntil:'domcontentloaded',timeout:90000});
      const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')));
      assert.equal(saved.day,3);
      assert.equal(saved.relationshipRewardIds.filter(x=>x==='evening-warm-tea-2-brew').length,1);
      assert.deepEqual(errors,[]);
      report.viewports.push({width,height,status:'PASS'});
    } catch(e) {
      report.viewports.push({width,height,status:'FAIL',error:String(e.stack||e)});
      process.exitCode=1;
    } finally {await context.close();}
  }
} finally {
  await writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2));
  await browser.close();
}
