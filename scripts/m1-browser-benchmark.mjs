// Runs against built Vite preview, never dev server. Node 22 + playwright.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.M1_BASE_URL || 'http://127.0.0.1:5189';
const changed = process.env.M1_CHANGED_URL || 'http://127.0.0.1:5190';
const output = process.env.M1_OUTPUT || 'm1-artifacts';
const WARMUP_MS = 10_000, SAMPLE_MS = 30_000;
const variants = [{ name: 'before-sector-16', url: base }, {name: 'after-sector-32', url: changed}];
const viewports = [{width:360,height:800}, {width:390,height:844}, {width:844,height:390}, {width:1280,height:800}];
const percent = (values, p) => {
  const sorted=[...values].sort((a,b)=>a-b);
  return sorted.length ? sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1)] : null;
};
const mean = values => values.length ? values.reduce((a,b)=>a+b,0)/values.length : null;
const round = number => number === null ? null : Math.round(number*100)/100;
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
const browser = await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
]});
let failures = [], results = [], browsers = [];
try {
  for(const variant of variants) {
    for(const viewport of viewports) {
      const modes=viewport.width===390 ? ['light','balanced'] : ['light'];
      for(const quality of modes) {
        const context = await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce'});
        const page = await context.newPage();
        const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
        await page.addInitScript(({quality})=>{
          localStorage.setItem('tiem-tra-chibi-ui-v1',JSON.stringify({
            renderEngine:'three',graphics:quality,coachCompleted:true,motion:false,sound:false,music:false
          }));
        },{quality});
        const id=variant.name+'-'+quality+'-'+viewport.width+'x'+viewport.height;
        console.log('M1 START '+id);
        try {
          await page.goto(variant.url+'/?m1bench=1',{waitUntil:'networkidle',timeout:120000});
          await page.waitForFunction(()=>window.__m1Runtime?.renderer?.name==='Three.js',null,{timeout:90000});
          // Assert that batching preserved actual interactive NPC nodes and moving traffic.
          // This is structural smoke only; interaction and physical collision require separate tests.
          const sceneIntegrity=await page.evaluate(()=>{
            const r=window.__m1Runtime, neighbors=[...r.city.neighbors.entries()];
            return {npcCount:neighbors.length,
              missingNpc:neighbors.filter(([id,n])=>
                n.person.root.parent!==r.city.root||
                n.marker.parent!==r.city.root||
                n.person.root.userData.resident!==id).map(([id])=>id),
              trafficCount:r.city.traffic.length,
              missingTraffic:r.city.traffic.filter(v=>v.parent!==r.city.root).length};
          });
          if(sceneIntegrity.npcCount<3||sceneIntegrity.missingNpc.length||
            sceneIntegrity.trafficCount<6||sceneIntegrity.missingTraffic)
            throw new Error('Scene NPC/traffic integrity failed: '+JSON.stringify(sceneIntegrity));
          console.log('M1 SCENE INTEGRITY '+JSON.stringify({id,...sceneIntegrity}));
          if (errors.length) console.log('M1 CONSOLE '+id+': '+errors.join('; ').slice(0,500));
          const initialResources=await page.evaluate(()=>{
            const resources=performance.getEntriesByType('resource');
            const nav=performance.getEntriesByType('navigation')[0];
            return {resourceCount:resources.length,transferBytes:resources.reduce((sum,r)=>sum+(r.transferSize||0),nav?.transferSize||0),
              jsTransferBytes:resources.filter(r=>/\.js(?:$|\?)/.test(r.name)).reduce((sum,r)=>sum+r.transferSize,0)};
          });
          await page.getByRole('button',{name:/Khám phá khu phố/}).click({timeout:10000});
          await page.waitForFunction(()=>window.__m1Runtime?.input.exploring===true,null,{timeout:20000});
          await page.evaluate(()=>{
            const r=window.__m1Runtime;
            r.player={x:0,z:-7};r.path=[];r.overview=false;r.yaw=0;r.pitch=-0.23;
            r.cameraFocus.set(0,0,-7);
          });
          const measure = viewport.width===390;
          for(const mode of measure?['follow','overview']:['follow']){
            await page.evaluate(mode=>{
              const r=window.__m1Runtime;
              r.player={x:0,z:-7};r.path=[];r.overview=mode==='overview';r.yaw=0;r.pitch=-0.23;
              r.cameraFocus.set(0,0,-7);
            },mode);
            const filename=path.join(output,id+'-'+mode+'.png');
            await mkdir(path.dirname(filename),{recursive:true});
            // Headless software WebGL may take >1s for the first complete render.
            // Capture only after warm-up so an empty WebGL buffer is never used for visual approval.
            await sleep(measure ? WARMUP_MS : 3000);
            let image=null;
            try {
              if(mode==='overview') {
                // Capture the canvas immediately after its WebGL render. On software GL,
                // Playwright's page screenshot can time out while waiting for compositing.
                // Capture happens before sampling; never include PNG encoding in P95.
                await page.evaluate(()=>{
                  const r=window.__m1Runtime;
                  r.m1ScreenshotDataUrl=null;r.m1ScreenshotError=null;
                  r.m1ScreenshotPending=true;
                });
                await page.waitForFunction(()=>{
                  const r=window.__m1Runtime;
                  return !!(r?.m1ScreenshotDataUrl||r?.m1ScreenshotError);
                },null,{timeout:90000,polling:500});
                const shot=await page.evaluate(()=>{
                  const r=window.__m1Runtime;
                  const value={dataUrl:r.m1ScreenshotDataUrl,error:r.m1ScreenshotError};
                  r.m1ScreenshotDataUrl=null;
                  return value;
                });
                if(shot.error)throw new Error('WebGL capture failed: '+shot.error);
                if(!shot.dataUrl?.startsWith('data:image/png;base64,'))throw new Error('Missing WebGL PNG');
                await writeFile(filename,Buffer.from(shot.dataUrl.slice('data:image/png;base64,'.length),'base64'));
              } else {
                await page.screenshot({path:filename,animations:'disabled',timeout:20000});
              }
              image=filename;
            } catch(error) {
              failures.push({id,mode,phase:'screenshot',error:String(error)});
            }
            if(measure){
              await page.evaluate(()=>{window.__m1Runtime.m1Frames.length=0});
              await sleep(SAMPLE_MS);
              const snap=await page.evaluate(()=>({
                ...window.__m1Runtime.m1Snapshot(),
                heap:performance.memory?.usedJSHeapSize??null
              }));
              if(!snap.frames.length)throw new Error('No frame samples: '+id+' '+mode);
              const entry={variant:variant.name,quality,viewport,mode,engine:snap.engine,
                count:snap.frames.length,
                intervalP50:round(percent(snap.frames.map(f=>f.intervalMs),.5)),
                intervalP95:round(percent(snap.frames.map(f=>f.intervalMs),.95)),
                slowOver100Percent:round(snap.frames.filter(f=>f.intervalMs>100).length/snap.frames.length*100),
                simulationP50:round(percent(snap.frames.map(f=>f.simulationMs),.5)),
                simulationP95:round(percent(snap.frames.map(f=>f.simulationMs),.95)),
                submissionP50:round(percent(snap.frames.map(f=>f.submissionMs),.5)),
                submissionP95:round(percent(snap.frames.map(f=>f.submissionMs),.95)),
                drawCallsMean:round(mean(snap.frames.map(f=>f.calls))),
                trianglesMean:round(mean(snap.frames.map(f=>f.triangles))),
                memory:snap.memory,skeletons:snap.skeletons,jsHeap:snap.heap,
                initialResources,errors:[...errors],image};
              results.push(entry);
              console.log('M1 RESULT '+JSON.stringify(entry));
            }
          }
          // Behavioral viewport smoke: joystick pointer capture/release, camera, notebook.
          await page.evaluate(()=>{const r=window.__m1Runtime;r.overview=false;r.path=[];r.player={x:0,z:-7}});
          const before=await page.evaluate(()=>({position:{...window.__m1Runtime.player},yaw:window.__m1Runtime.yaw}));
          const stick=page.locator('.movement-stick');
          await stick.scrollIntoViewIfNeeded();
          const box=await stick.boundingBox();
          if(!box)throw new Error('Joystick not visible');
          const cx=box.x+box.width/2,cy=box.y+box.height/2;
          await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx+30,cy-25,{steps:4});
          await sleep(550);await page.mouse.up();
          const after=await page.evaluate(()=>({position:{...window.__m1Runtime.player},stick:{...window.__m1Runtime.stick}}));
          const moved=Math.hypot(after.position.x-before.position.x,after.position.z-before.position.z);
          if(moved<0.025)throw new Error('Joystick did not move player: '+moved);
          if(after.stick.x!==0||after.stick.y!==0)throw new Error('Joystick stuck on release');
          const canvas=page.locator('canvas[aria-label*="Không gian tiệm"]');
          const bounds=await canvas.boundingBox();
          if(!bounds)throw new Error('3D canvas not visible');
          const px=bounds.x+bounds.width/2,py=bounds.y+bounds.height/2;
          await page.mouse.move(px,py);await page.mouse.down();await page.mouse.move(px+28,py+16,{steps:3});await page.mouse.up();
          const yaw=await page.evaluate(()=>window.__m1Runtime.yaw);
          if(Math.abs(yaw-before.yaw)<.01)throw new Error('Camera yaw did not change');
          await page.getByRole('button',{name:/Mở sổ tay khu phố/}).click();
          const opened=await page.locator('.neighborhood').getAttribute('class');
          if(!opened.includes('sheet-open'))throw new Error('Notebook did not open');
          await page.getByRole('button',{name:/Thu gọn để đi phố/}).click();
          // Exercise React NPC dialogue and the runtime's actual collision solver.
          // Only the initial position is a fixture; the UI choice and movement use
          // real gameplay handlers. A structural NPC count is not sufficient.
          if(viewport.width===390 && quality==='light') {
            await page.evaluate(()=>{
              const r=window.__m1Runtime;
              r.player={x:-26,z:-9};r.path=[];r.overview=false;
              r.notify({...r.player});
            });
            await page.getByRole('button',{name:/Nói chuyện với Cô Hạnh/}).click({timeout:30000});
            const dialogue=page.locator('dialog.neighborhood-dialogue[open]');
            await dialogue.waitFor({state:'visible',timeout:30000});
            const firstSpeech=await dialogue.locator('.dialogue-speech').textContent();
            if(!firstSpeech?.trim())throw new Error('NPC dialogue speech empty');
            await dialogue.locator('.dialogue-choices button').first().click({timeout:30000});
            await page.waitForFunction(previous=>{
              const speech=document.querySelector('dialog.neighborhood-dialogue[open] .dialogue-speech');
              return !!speech?.textContent && speech.textContent!==previous;
            },firstSpeech,{timeout:30000});
            await dialogue.getByRole('button',{name:'Khép cuộc trò chuyện'}).click({timeout:30000});
            await page.waitForFunction(()=>!document.querySelector('dialog.neighborhood-dialogue[open]') &&
              !window.__m1Runtime?.input.paused,null,{timeout:30000});
            console.log('M1 NPC DIALOGUE OK '+id);
            await page.evaluate(()=>{
              const r=window.__m1Runtime;
              r.player={x:0,z:-9.6};r.path=[];r.yaw=0;r.overview=false;
              r.notify({...r.player});
              r.analog({x:0,y:-1});
            });
            try {
              await page.waitForFunction(()=>window.__m1Runtime.player.z < -9.67,null,{timeout:30000,polling:500});
              await sleep(6000);
            } finally {
              await page.evaluate(()=>window.__m1Runtime?.analog({x:0,y:0}));
            }
            const wall=await page.evaluate(()=>({...window.__m1Runtime.player}));
            // CITY_BLOCKS front edge z=-10.3, PLAYER_RADIUS=.38: center stops near -9.92.
            if(wall.z < -9.94 || wall.z > -9.67 || Math.abs(wall.x) > 0.1)
              throw new Error('City wall collision failed: '+JSON.stringify(wall));
            console.log('M1 WALL COLLISION OK '+JSON.stringify({id,position:wall}));

            // Keep the actual scooter stationary as a reproducible traffic fixture.
            // Movement still uses the runtime analog input and collision solver.
            await page.evaluate(()=>{
              const r=window.__m1Runtime, scooter=r.city.traffic[0];
              r.motion=false;
              scooter.userData.roadProgress=38;
              scooter.position.set(0,0,-22.5);
              r.player={x:0,z:-20.7};r.path=[];r.yaw=0;r.overview=false;
              r.notify({...r.player});
              r.analog({x:0,y:-1});
            });
            try {
              await page.waitForFunction(()=>window.__m1Runtime.player.z < -21.15,
                null,{timeout:30000,polling:500});
              await sleep(6000);
            } finally {
              await page.evaluate(()=>window.__m1Runtime?.analog({x:0,y:0}));
            }
            const traffic=await page.evaluate(()=>{
              const r=window.__m1Runtime;
              return {position:{...r.player},vehicle:{...r.city.trafficBodies[0]},stick:{...r.stick}};
            });
            // Scooter #0: z=-22.5, yaw=PI/2, width=.64, PLAYER_RADIUS=.38.
            if(traffic.position.z < -21.86 || traffic.position.z > -21.15 ||
              Math.abs(traffic.position.x) > .12 ||
              Math.abs(traffic.vehicle.x) > .01 || Math.abs(traffic.vehicle.z+22.5) > .01 ||
              traffic.stick.x!==0 || traffic.stick.y!==0)
              throw new Error('City traffic collision failed: '+JSON.stringify(traffic));
            console.log('M1 VEHICLE COLLISION OK '+JSON.stringify({id,...traffic}));
          }
          // Complete one genuine React gameplay loop: return -> open -> seal -> carry -> deliver.
          if(viewport.width===360) try {
            await page.getByRole('button',{name:/Về tiệm/}).click();
            await page.waitForFunction(()=>window.__m1Runtime?.input.exploring===false,null,{timeout:150000});
            console.log('M1 RETURN OK '+id);
          } catch(error) {
            failures.push({id,phase:'city-return',error:String(error)});
          } else console.log('M1 RETURN NOT CHECKED '+id);
          // A reload restores the actual shop spawn for a separate craft smoke.
          // A city-return failure above remains a benchmark failure.
          await page.reload({waitUntil:'networkidle',timeout:120000});
          await page.waitForFunction(()=>window.__m1Runtime?.renderer?.name==='Three.js',null,{timeout:90000});
          // SwiftShader can leave Playwright waiting for a navigation after a
          // successful React click. Trigger the real enabled button and assert
          // the shop UI transitions before crafting; do not bypass game rules.
          await page.evaluate(()=>{
            const button=document.querySelector('button.prep-open');
            if(!(button instanceof HTMLButtonElement)||button.disabled)
              throw new Error('Shop open button unavailable or disabled');
            button.click();
          });
          await page.waitForFunction(() =>
            !document.querySelector('button.prep-open') &&
            !!document.querySelector('.craft-stations button'),
            null,{timeout:30000,polling:250});
          await page.locator('.craft-stations button').nth(3).click();
          await page.locator('.seal-button').click();
          await page.locator('.serve-button').click();
          await page.screenshot({path:path.join(output,id+'-craft.png'),animations:'disabled'});
          await page.locator('.place-buttons button.destination').click();
          await page.waitForFunction(()=>!!document.querySelector('.delivery-tag button.primary-button:not([disabled])'),null,{timeout:90000});
          await page.locator('.delivery-tag button.primary-button').click();
          await page.waitForFunction(()=>{
            try{return JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')||'{}').served>=1}catch{return false}
          },null,{timeout:15000});
          const served=await page.evaluate(()=>JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')).served);
          await page.screenshot({path:path.join(output,id+'-delivered.png'),animations:'disabled'});
          if(errors.length)failures.push({id,errors});
          console.log('M1 SMOKE '+JSON.stringify({id,moved:round(moved),yawChanged:round(yaw-before.yaw),notebook:'ok',served,errors}));
        } catch(error){
          console.error('M1 FAIL '+id+' '+String(error.stack||error));
          failures.push({id,error:String(error.stack||error)});
        } finally {await context.close();}
      }
    }
  }
} finally {
  await mkdir(output,{recursive:true});
  await writeFile(path.join(output,'results.json'),JSON.stringify({results,failures,environment:{
    userAgent:'Chromium Playwright SwiftShader headless CI (not real mobile GPU)',
    warmupMs:WARMUP_MS,sampleMs:SAMPLE_MS,dpr:1,
    gpuTiming:'unsupported',drawCalls:'Three.js renderer.info.render.calls (main plus refreshed shadow passes)'
  }},null,2));
  await browser.close();
}
const overview = q => results.find(r=>r.variant==='before-sector-16'&&r.quality===q&&r.mode==='overview');
for(const quality of ['light','balanced']) {
  const a=overview(quality),b=results.find(r=>r.variant==='after-sector-32'&&r.quality===quality&&r.mode==='overview');
  if(a&&b) {
    const reduction=(a.drawCallsMean-b.drawCallsMean)/a.drawCallsMean*100;
    const p95Delta=(b.intervalP95-a.intervalP95)/a.intervalP95*100;
    console.log('M1 COMPARISON '+JSON.stringify({quality,drawCallReductionPercent:round(reduction),p95IntervalDeltaPercent:round(p95Delta),before:a.drawCallsMean,after:b.drawCallsMean}));
    if(quality==='light'&&(reduction<40||p95Delta>10)) {console.error('M1 GATE UNMET: light overview threshold (do not advance M2)');process.exitCode=1;}
  } else failures.push({quality,error:'Missing comparable overview samples'});
}
if(failures.length)process.exitCode=1;
