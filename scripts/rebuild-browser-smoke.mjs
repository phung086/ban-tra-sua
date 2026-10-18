import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const engine=process.env.REBUILD_ENGINE??'three';
const out=process.env.REBUILD_OUTPUT??'.impeccable/review/rebuild';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={environment:'Chromium software WebGL / emulated touch, not physical mobile',checks:[],errors:[]};
try{
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.setDefaultTimeout(90000);
page.on('pageerror',e=>report.errors.push(e.message));
await page.addInitScript(engine=>localStorage.setItem('tiem-tra-chibi-ui-v1',JSON.stringify({renderEngine:engine,graphics:'light',coachCompleted:true,motion:true,sound:false,music:false})),engine);
await page.goto('http://127.0.0.1:5188/?m1bench=1');
await page.waitForFunction(()=>!!window.__m1Runtime?.avatar.imported,null,{timeout:90000});
await page.getByRole('button',{name:/Khám phá khu phố/}).click();
await page.waitForFunction(()=>window.__m1Runtime.input.exploring);
await page.evaluate(()=>{const r=window.__m1Runtime;r.player={x:0,z:-7.9};r.path=[];r.yaw=2.65;r.avatar.root.rotation.y=2.65;r.cameraFocus.set(0,0,-7.9);r.cameraMode='';});
await page.waitForTimeout(2000);
await page.screenshot({path:out+'/street-390x844.png'});
console.log('REBUILD_STREET',JSON.stringify(await page.evaluate(()=>{const r=window.__m1Runtime;return {asset:r.avatar.root.userData.characterAsset,animation:r.avatar.imported.active,renderer:r.renderer.name,meshes:r.m1Snapshot().memory};})));
// Exercise an actual pointer drag; the setup only selects the starting camera.
const stick=page.locator('.movement-stick');const rect=await stick.boundingBox();
await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width/2+25,rect.y+rect.height/2-20);await page.waitForTimeout(1200);
const walking=await page.evaluate(()=>({clip:window.__m1Runtime.avatar.imported.active,pos:{...window.__m1Runtime.player}}));
await page.mouse.up();
if(walking.clip!=='Walk')throw new Error('Rig walk clip did not respond to joystick: '+walking.clip);
report.checks.push('bundled rig loaded; real joystick starts Walk clip');
await page.locator('.neighborhood-sheet-toggle').click();await page.screenshot({path:out+'/notebook-390x844.png'});
await page.locator('.neighborhood-sheet-toggle').click();
report.checks.push('compact notebook opens and closes');
for(const [width,height] of (engine==='babylon'?[[844,390]]:[[360,800],[844,390],[1280,800]])){
 await page.setViewportSize({width,height});await page.waitForTimeout(1000);await page.screenshot({path:out+`/street-${width}x${height}.png`});
 const layout=await page.evaluate(()=>{const r=document.querySelector('.movement-stick').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth+2,inside:r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,active:document.querySelector('.movement-stick').dataset.active};});
 if(layout.overflow||!layout.inside||layout.active==='true')throw new Error('Layout/rotation problem: '+JSON.stringify(layout));
 report.checks.push(`${width}x${height}: no overflow, joystick inside and released`);
}
await page.getByRole('button',{name:/Về tiệm/}).click();await page.waitForFunction(()=>{const r=window.__m1Runtime;return !r.input.exploring&&!r.path.length&&Math.hypot(r.player.x,r.player.z-2.15)<.2;},null,{timeout:90000});await page.getByRole('button',{name:/Thức dậy bắt đầu ngày mới/}).click();await page.getByRole('button',{name:/Đi làm luôn/}).click();await page.getByRole('button',{name:/Mở cửa tiệm/}).click();
await page.waitForFunction(()=>window.__m1Runtime.actors.size>0);await page.screenshot({path:out+'/shop-service.png'});
report.checks.push('wake, breakfast, open shop and imported customer spawn');
}catch(e){report.errors.push(String(e.stack??e));process.exitCode=1;}finally{await writeFile(out+'/results.json',JSON.stringify(report,null,2));console.log('REBUILD_REPORT',JSON.stringify(report));await browser.close();}
