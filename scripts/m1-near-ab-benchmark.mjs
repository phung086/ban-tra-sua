// Controlled same-SHA comparison of sector 16 versus sector 12 *near the shop*.
// Uses built production previews, never a dev server or mobile-GPU claims.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Reuse the same Chromium protocol for other same-SHA geometry comparisons.
const variantNames=(process.env.M1_AB_VARIANTS||'near16,near12').split(',');
if(variantNames.length!==2||new Set(variantNames).size!==2||
   variantNames.some(name=>!/^[a-z0-9-]+$/.test(name)))
  throw new Error('M1_AB_VARIANTS must contain two distinct safe labels');
const [control,candidate]=variantNames;
const urls={
  [control]:process.env.M1_AB_CONTROL_URL||process.env.M1_NEAR16_URL||'http://127.0.0.1:5191',
  [candidate]:process.env.M1_AB_CANDIDATE_URL||process.env.M1_NEAR12_URL||'http://127.0.0.1:5192'
};
const output=process.env.M1_AB_OUTPUT||process.env.M1_NEAR_OUTPUT||'m1-near-artifacts';
const logPrefix=process.env.M1_AB_LOG_PREFIX||'M1 NEAR AB';
const comparisonKey=process.env.M1_AB_COMPARISON_KEY||'near12Vs16';
const controlDescription=process.env.M1_AB_CONTROL_DESC||'sector32 distant, near radius42 size16';
const candidateDescription=process.env.M1_AB_CANDIDATE_DESC||'sector32 distant, near radius42 size12';
const warmupMs=10_000,sampleMs=30_000;
const percentile=(values,p)=>{const sorted=[...values].sort((a,b)=>a-b);
  return sorted.length?sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1)]:null;};
const average=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
const round=n=>n===null?null:Math.round(n*100)/100;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const records=[],failures=[];
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
]});
try {
  // Alternate variant order between qualities to limit systematic warm-run bias.
  for(const quality of ['light','balanced']){
    const order=quality==='light'?[control,candidate]:[candidate,control];
    for(const variant of order){
      const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'reduce'});
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
      try {
        await page.addInitScript(q=>localStorage.setItem('tiem-tra-chibi-ui-v1',JSON.stringify({
          renderEngine:'three',graphics:q,coachCompleted:true,motion:false,sound:false,music:false
        })),quality);
        await page.goto(urls[variant]+'/?m1bench=1',{waitUntil:'networkidle',timeout:120000});
        await page.waitForFunction(()=>window.__m1Runtime?.renderer?.name==='Three.js',null,{timeout:90000});
        await page.getByRole('button',{name:/Khám phá khu phố/}).click({timeout:30000});
        await page.waitForFunction(()=>window.__m1Runtime?.input.exploring===true,null,{timeout:30000});
        const integrity=await page.evaluate(()=>{
          const r=window.__m1Runtime;
          return {npc:r.city.neighbors.size,traffic:r.city.traffic.length};
        });
        if(integrity.npc<3||integrity.traffic<6)throw new Error('NPC/traffic missing: '+JSON.stringify(integrity));
        for(const mode of ['follow','overview']){
          await page.evaluate(m=>{
            const r=window.__m1Runtime;
            r.player={x:0,z:-7};r.path=[];r.overview=m==='overview';r.yaw=0;r.pitch=-.23;
            r.cameraFocus.set(0,0,-7);r.m1Frames.length=0;
          },mode);
          await sleep(warmupMs);
          // Capture the same real WebGL render for both configurations.
          const filename=path.join(output,`${variant}-${quality}-${mode}.png`);
          await page.evaluate(()=>{
            const r=window.__m1Runtime;
            r.m1ScreenshotDataUrl=null;r.m1ScreenshotError=null;r.m1ScreenshotPending=true;
          });
          await page.waitForFunction(()=>{
            const r=window.__m1Runtime;
            return !!(r?.m1ScreenshotDataUrl||r?.m1ScreenshotError);
          },null,{timeout:90000,polling:500});
          const shot=await page.evaluate(()=>{
            const r=window.__m1Runtime;
            const data={dataUrl:r.m1ScreenshotDataUrl,error:r.m1ScreenshotError};
            r.m1ScreenshotDataUrl=null;return data;
          });
          if(shot.error||!shot.dataUrl?.startsWith('data:image/png;base64,'))
            throw new Error('WebGL capture failed '+variant+'/'+quality+'/'+mode+': '+shot.error);
          const png=Buffer.from(shot.dataUrl.slice('data:image/png;base64,'.length),'base64');
          if(png.length<100||png.toString('ascii',1,4)!=='PNG'||
             png.readUInt32BE(16)!==390||png.readUInt32BE(20)!==844)
            throw new Error('Invalid 390x844 WebGL PNG: '+variant+'/'+quality+'/'+mode);
          await writeFile(filename,png);
          await page.evaluate(()=>{window.__m1Runtime.m1Frames.length=0});
          await sleep(sampleMs);
          const snap=await page.evaluate(()=>window.__m1Runtime.m1Snapshot());
          if(snap.frames.length<5)throw new Error('Too few frames for '+variant+'/'+quality+'/'+mode);
          const row={variant,quality,mode,viewport:'390x844',dpr:1,
            frames:snap.frames.length,
            calls:round(average(snap.frames.map(f=>f.calls))),
            triangles:round(average(snap.frames.map(f=>f.triangles))),
            intervalP50:round(percentile(snap.frames.map(f=>f.intervalMs),.5)),
            intervalP95:round(percentile(snap.frames.map(f=>f.intervalMs),.95)),
            simulationP95:round(percentile(snap.frames.map(f=>f.simulationMs),.95)),
            submissionP95:round(percentile(snap.frames.map(f=>f.submissionMs),.95)),
            image:filename,errors:[...errors]};
          records.push(row);console.log(logPrefix+' RESULT '+JSON.stringify(row));
        }
        if(errors.length)throw new Error('Console errors: '+JSON.stringify(errors));
      }catch(error){
        const failure={variant,quality,error:String(error.stack||error)};
        failures.push(failure);console.error(logPrefix+' FAIL '+JSON.stringify(failure));
      }finally{await context.close()}
    }
  }
}finally{
  const comparisons=[];
  for(const quality of ['light','balanced'])for(const mode of ['follow','overview']){
    const a=records.find(r=>r.variant===control&&r.quality===quality&&r.mode===mode);
    const b=records.find(r=>r.variant===candidate&&r.quality===quality&&r.mode===mode);
    if(!a||!b){failures.push({quality,mode,error:'Missing paired samples'});continue}
    const delta=(key)=>round((b[key]-a[key])/a[key]*100);
    comparisons.push({quality,mode,[comparisonKey]:{callsPercent:delta('calls'),trianglesPercent:delta('triangles'),p95Percent:delta('intervalP95')},
      controlFrames:a.frames,candidateFrames:b.frames});
  }
  console.log(logPrefix+' COMPARISONS '+JSON.stringify(comparisons));
  await writeFile(path.join(output,'results.json'),JSON.stringify({records,comparisons,failures,
    environment:{browser:'Playwright Chromium SwiftShader software WebGL Ubuntu',viewport:'390x844',dpr:1,
      warmupMs,sampleMs,scene:'player (0,-7), yaw 0, pitch -0.23',
      control:controlDescription,candidate:candidateDescription,sourceSha:process.env.GITHUB_SHA||null,
      gpuTiming:'unsupported',device:'CI, not a real Android or iPhone',
      drawCalls:'renderer.info.render.calls includes refreshed shadow passes'}},null,2));
  await browser.close();
}
if(failures.length)process.exitCode=1;
