// A/B evidence from built Vite previews. Software WebGL is not a phone test.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const beforeUrl = process.env.BASELINE_URL || 'http://127.0.0.1:5196';
const afterUrl = process.env.CANDIDATE_URL || 'http://127.0.0.1:5197';
const output = process.env.OUTPUT || 'chibi-greeting-artifacts';
const viewports = [[360,800],[390,844],[844,390],[1280,800]];
const report = { environment:'Built Vite previews, headless Chromium SwiftShader; NOT physical Android/iPhone', cases:[], failures:[] };
await mkdir(output,{recursive:true});
const browser = await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
]});

async function captureCanvas(page,file) {
  await page.evaluate(()=>{
    const r=window.__m1Runtime;
    r.m1ScreenshotDataUrl=null;r.m1ScreenshotError=null;r.m1ScreenshotPending=true;
  });
  await page.waitForFunction(()=>window.__m1Runtime?.m1ScreenshotDataUrl || window.__m1Runtime?.m1ScreenshotError,
    null,{timeout:90000,polling:250});
  const result=await page.evaluate(()=>{
    const r=window.__m1Runtime;
    const value={data:r.m1ScreenshotDataUrl,error:r.m1ScreenshotError};
    r.m1ScreenshotDataUrl=null;return value;
  });
  if(result.error)throw Error('WebGL capture: '+result.error);
  if(!result.data?.startsWith('data:image/png;base64,'))throw Error('No PNG canvas data');
  await writeFile(file,Buffer.from(result.data.split(',')[1],'base64'));
}
try {
  for(const [width,height] of viewports) for(const [variant,url] of [['baseline',beforeUrl],['candidate',afterUrl]]) {
    const id=variant+'-'+width+'x'+height;
    const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'no-preference'});
    const page=await ctx.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    try {
      await page.addInitScript(()=>localStorage.setItem('tiem-tra-chibi-ui-v1',JSON.stringify({
        renderEngine:'three',graphics:'light',coachCompleted:true,motion:true,sound:false,music:false,
      })));
      await page.goto(url+'/?m1bench=1',{waitUntil:'domcontentloaded',timeout:120000});
      await page.waitForFunction(()=>window.__m1Runtime?.renderer?.name==='Three.js',null,{timeout:90000});
      await page.getByRole('button',{name:/Khám phá khu phố/}).click({timeout:30000});
      await page.waitForFunction(()=>window.__m1Runtime?.input.exploring===true,null,{timeout:30000});
      const setup=await page.evaluate(()=>{
        const r=window.__m1Runtime, person=[...r.city.neighbors.values()][0]?.person;
        if(!person)throw Error('No neighbor actor');
        const {x,z}=person.root.position;
        r.player={x:x+1.7,z:z+1.7};r.path=[];r.overview=false;
        r.yaw=0;r.pitch=-0.18;r.cameraFocus.set(x+1.7,0,z+1.7);
        r.city.clock=20;
        person.root.userData.greetingState={near:true,startedAt:0};
        return {resident:person.root.userData.resident,x,z};
      });
      await page.waitForTimeout(900);
      const initial=await page.evaluate(()=>{
        const p=[...window.__m1Runtime.city.neighbors.values()][0].person;
        return {headTilt:p.head.rotation.z,wrist:p.hand.rotation.z};
      });
      await captureCanvas(page,path.join(output,id+'-idle.png'));
      await page.evaluate(()=>{
        const r=window.__m1Runtime,p=[...r.city.neighbors.values()][0].person;
        r.city.clock=30;
        p.root.userData.greetingState={near:true,startedAt:29.6};
      });
      await page.waitForTimeout(500);
      const wave=await page.evaluate(()=>{
        const p=[...window.__m1Runtime.city.neighbors.values()][0].person;
        return {headTilt:p.head.rotation.z,wrist:p.hand.rotation.z,arm:p.rightArm.rotation.z};
      });
      await captureCanvas(page,path.join(output,id+'-greeting.png'));
      if(variant==='candidate' && !(wave.headTilt>0.04 && wave.arm<-.08))
        throw Error('Greeting not observable in actual scene: '+JSON.stringify(wave));
      if(variant==='baseline' && Math.abs(wave.headTilt)>0.001)
        throw Error('Baseline already tilts head: '+JSON.stringify(wave));
      if(errors.length)throw Error('Page errors: '+errors.join('; '));
      report.cases.push({id,setup,initial,wave,viewport:{width,height},render:'canvas PNG'});
    } catch(e) { report.failures.push(id+': '+String(e)); }
    finally { await ctx.close(); }
  }
} finally {
  await browser.close();
  await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
}
console.log(JSON.stringify(report,null,2));
if(report.failures.length || report.cases.length!==viewports.length*2)process.exitCode=1;
