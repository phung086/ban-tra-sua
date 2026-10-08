// Production browser regression for phone rotation/autofit. Uses Chromium touch
// emulation and SwiftShader on CI; NOT a real Android/iOS device test.
import {chromium} from 'playwright';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

const output = process.env.MOBILE_LAYOUT_OUTPUT || 'mobile-layout-artifacts';
const base = process.env.MOBILE_LAYOUT_URL || 'http://127.0.0.1:5192';
const sizes = [
  [320,568],[360,800],[390,844],[844,390],[932,430],[667,375],[568,320],[1024,480],[1280,800]
];
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
const browser=await chromium.launch({headless:true,args:[
 '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
 '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
]});
await mkdir(output,{recursive:true});
const report={environment:'Chromium headless touch emulation, software WebGL; not real mobile hardware',
 sizes:[],city:[],errors:[],passes:[]};
function assert(ok,message){if(!ok)throw new Error(message);}
async function initPage(context){
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push('pageerror: '+e.message));
  await page.addInitScript(()=>{
    localStorage.setItem('tiem-tra-chibi-ui-v1',JSON.stringify({
      renderEngine:'three',graphics:'light',coachCompleted:true,motion:false,sound:false,music:false
    }));
  });
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('.street-world canvas',{timeout:120000});
  return page;
}
async function layoutSnapshot(page,phase) {
  return await page.evaluate(phase=>{
    const rect=(selector)=>{
      const el=document.querySelector(selector);if(!el)return null;
      const r=el.getBoundingClientRect();
      return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),
        height:Math.round(r.height),right:Math.round(r.right),bottom:Math.round(r.bottom)};
    };
    const main=document.querySelector('main');
    const viewport=document.querySelector('.world-viewport');
    return {phase,layout:main?.dataset.playLayout,exploring:main?.classList.contains('exploring-city'),
      width:window.innerWidth,height:window.innerHeight,
      viewportHeight:window.visualViewport?.height,
      documentWidth:document.documentElement.scrollWidth,
      transform:getComputedStyle(main).transform,
      scene:rect('.street-world'),canvas:rect('.world-viewport canvas'),
      content:rect('#game-content'),joystick:rect('.movement-stick'),
      notebook:rect('.neighborhood'),contextActions:rect('.city-context-actions'),
      sheetOpen:!!document.querySelector('.neighborhood.sheet-open'),
      canvasEngine:document.querySelector('.world-viewport canvas')?.dataset.engine,
      visualViewportHeight:window.visualViewport?.height,
      contentScrollable:document.querySelector('#game-content')?.scrollHeight > document.querySelector('#game-content')?.clientHeight + 3
    };
  },phase);
}
function inside(box,width,height){return box && box.x>=-2&&box.right<=width+2&&box.y>=-2&&box.bottom<=height+2;}
function validate(info,expected){
  assert(info.layout===expected,'Layout '+info.width+'x'+info.height+': '+info.layout+' expected '+expected);
  assert(info.documentWidth<=info.width+2,'Horizontal overflow '+info.documentWidth+' vs '+info.width);
  assert(info.transform==='none','Do not zoom/scale hitboxes');
  assert(info.canvas && info.canvas.width>120 && info.canvas.height>120,'3D canvas collapsed');
  if(expected==='landscape'&&!info.exploring){
    assert(info.scene && inside(info.scene,info.width,info.height),'Scene off-screen in landscape');
    assert(info.content && inside(info.content,info.width,info.height),'Craft/service panel off-screen');
    assert(info.content.width>=200,'Service panel too narrow');
    assert(info.joystick && inside(info.joystick,info.width,info.height),'Joystick clipped in landscape');
    assert(info.joystick.width>=70,'Joystick touch target too small');
  }
  if(info.exploring){
    assert(info.scene && inside(info.scene,info.width,info.height),'City scene off-screen');
    assert(info.joystick && inside(info.joystick,info.width,info.height),'City joystick outside viewport');
    if(info.sheetOpen)assert(inside(info.notebook,info.width,info.height),'Notebook outside viewport');
  }
}
try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await initPage(ctx);
  const canvasHandle=await page.locator('.world-viewport canvas').elementHandle();
  for(const [width,height] of sizes){
    await page.setViewportSize({width,height});
    const expected=width>height&&height<=650&&width<=1180?'landscape':width<=900?'portrait':'desktop';
    await page.waitForFunction(expected=>document.querySelector('main')?.dataset.playLayout===expected,expected,{timeout:12000});
    await sleep(320);
    const info=await layoutSnapshot(page,'shop-prep');
    validate(info,expected);
    const same=await page.evaluate(old=>old===document.querySelector('.world-viewport canvas'),canvasHandle);
    assert(same,'WebGL canvas remounted after rotating '+width+'x'+height);
    info.canvasPreserved=same;
    report.sizes.push(info);
    await page.screenshot({path:path.join(output,'shop-'+width+'x'+height+'.png'),animations:'disabled',timeout:90000});
    console.log('MOBILE_LAYOUT '+JSON.stringify(info));
  }
  await page.setViewportSize({width:844,height:390});
  await page.waitForFunction(()=>document.querySelector('main')?.dataset.playLayout==='landscape');
  await page.waitForFunction(()=>window.__m1Runtime || document.querySelector('.world-viewport canvas'));
  // Begin dragging, rotate before pointerup, and verify that the controls release.
  const joystick=page.locator('.movement-stick');
  const joyRect=await joystick.boundingBox();
  assert(!!joyRect,'Joystick missing before rotation');
  await page.mouse.move(joyRect.x+joyRect.width/2,joyRect.y+joyRect.height/2);
  await page.mouse.down();
  await page.mouse.move(joyRect.x+joyRect.width*.8,joyRect.y+joyRect.height*.3);
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>document.querySelector('main')?.dataset.playLayout==='portrait');
  await page.waitForFunction(()=>document.querySelector('.movement-stick')?.dataset.active==='false',null,{timeout:10000});
  await page.mouse.up();
  report.passes.push('joystick pointer released during orientation change');
  await page.setViewportSize({width:844,height:390});
  await page.waitForFunction(()=>document.querySelector('main')?.dataset.playLayout==='landscape');
  await page.getByRole('button',{name:/Mở cửa tiệm/}).click({timeout:30000});
  await page.locator('.craft-stations button').nth(3).click({timeout:20000});
  await page.locator('.seal-button').click({timeout:20000});
  await page.screenshot({path:path.join(output,'landscape-crafting-844x390.png'),animations:'disabled'});
  const craft=await page.evaluate(()=>({
    scrollContainer:getComputedStyle(document.querySelector('#game-content')).overflowY,
    hasSeal:!!document.querySelector('.seal-button'),
    hasJoystick:!!document.querySelector('.movement-stick')
  }));
  assert(craft.hasSeal&&craft.hasJoystick&&craft.scrollContainer==='auto','Craft/joystick not independently accessible');
  report.passes.push('landscape craft workflow and independent panel scrolling');
  await ctx.close();

  const cityCtx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const city=await initPage(cityCtx);
  await city.getByRole('button',{name:/Khám phá khu phố/}).click({timeout:20000});
  await city.waitForSelector('main.exploring-city',{timeout:12000});
  for(const [width,height] of [[390,844],[844,390],[932,430],[667,375]]){
    await city.setViewportSize({width,height});
    const expected=height>width?'portrait':'landscape';
    await city.waitForFunction(expected=>document.querySelector('main')?.dataset.playLayout===expected,expected,{timeout:12000});
    await sleep(350);
    let snap=await layoutSnapshot(city,'city-closed');
    validate(snap,expected);
    assert(inside(snap.notebook,width,height),'Closed notebook outside screen');
    report.city.push(snap);
    await city.screenshot({path:path.join(output,'city-'+width+'x'+height+'.png'),animations:'disabled',timeout:90000});
    await city.locator('.neighborhood-sheet-toggle').click({timeout:12000});
    snap=await layoutSnapshot(city,'city-open');
    validate(snap,expected);
    report.city.push(snap);
    await city.screenshot({path:path.join(output,'city-sheet-'+width+'x'+height+'.png'),animations:'disabled',timeout:90000});
    await city.locator('.neighborhood-sheet-toggle').click({timeout:12000});
  }
  report.passes.push('city sheet reopen after orientation change; canvas preserved and joystick visible');
  await cityCtx.close();
  assert(!report.errors.length,'Uncaught browser errors: '+report.errors.join('; '));
} catch(error){
  report.errors.push(String(error.stack||error));
  console.error('MOBILE_LAYOUT_FAIL '+String(error.stack||error));
  process.exitCode=1;
} finally {
  await writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2));
  await browser.close();
}
