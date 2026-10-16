import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
// Camera fixtures review the live scene; gameplay is covered by mobile-layout-smoke.
const output=process.env.VISUAL_OUTPUT ?? 'artifacts/visual-cohesion';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:800}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>localStorage.setItem('tiem-tra-chibi-ui-v1',JSON.stringify({renderEngine:'three',graphics:'light',coachCompleted:true,motion:true,sound:false,music:false})));
await page.goto((process.env.PREVIEW_URL ?? 'http://127.0.0.1:5188')+'/?m1bench=1');
await page.waitForFunction(()=>window.__m1Runtime?.renderer?.name==='Three.js',null,{timeout:90000});
await page.screenshot({path:output+'/shop.png'});
await page.getByRole('button',{name:/Khám phá khu phố/}).click();
await page.waitForFunction(()=>window.__m1Runtime?.input.exploring);
// Camera-only fixtures for reviewing the real scene, without changing saves.
for(const [name,x,z,yaw,overview] of [['face',0,-8,0,false],['street',0,-8,2.6,false],['city',0,-7,0,true]]){
 await page.evaluate(({x,z,yaw,overview})=>{const r=window.__m1Runtime;r.player={x,z};r.path=[];r.yaw=yaw;r.overview=overview;r.cameraFocus.set(x,0,z);},{x,z,yaw,overview});
 await page.waitForTimeout(2500);await page.screenshot({path:output+'/'+name+'.png'});
}
await writeFile(output+'/results.json',JSON.stringify({errors},null,2));await browser.close();if(errors.length)process.exitCode=1;
