import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const origin=process.env.STREET_ORIGIN??'http://127.0.0.1:5188';
const out=process.env.STREET_OUTPUT??'street-physics-artifacts';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={environment:'Chromium software WebGL; emulated mobile, not physical device performance',checks:[],errors:[]};
const assert=(value,message)=>{if(!value)throw new Error(message);};
try{
for(const engine of ['three','babylon']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();page.setDefaultTimeout(90000);
  page.on('pageerror',e=>report.errors.push(engine+': '+e.message));
  await page.addInitScript(engine=>localStorage.setItem('tiem-tra-chibi-ui-v1',JSON.stringify({renderEngine:engine,graphics:'light',coachCompleted:true,motion:true,sound:false,music:false})),engine);
  await page.goto(origin+'/?m1bench=1');
  await page.waitForFunction(()=>!!window.__m1Runtime?.avatar.imported);
  await page.getByRole('button',{name:/Khám phá khu phố/}).click();
  await page.waitForFunction(()=>window.__m1Runtime?.input.exploring&&window.__m1Runtime.city.walkers.length===10);
  // Fixture puts a moving scooter 10cm from a pedestrian. The actual scene
  // sweep emits impact; no health callback or game reducer is invoked by test.
  await page.evaluate(()=>{
    const r=window.__m1Runtime;r.path=[];r.keys.clear();r.analog({x:0,y:0});
    r.player={x:1.45,z:-22.5};r.notify({...r.player});
    r.city.road=r.city.road.map(v=>({...v,speed:0}));
    Object.assign(r.city.road[0],{x:0,speed:3.8,held:false});
  });
  await page.waitForFunction(()=>window.__m1Runtime.input.game.city.street?.severity>0);
  const injured=await page.evaluate(()=>{const r=window.__m1Runtime;return {street:{...r.input.game.city.street},minutes:r.input.game.city.minutes,energy:r.input.game.city.energy};});
  assert(injured.energy<100,engine+': impact did not reduce energy');
  const rest=page.getByRole('button',{name:/Nghỉ và chăm sóc/});
  assert(await rest.isDisabled(),engine+': road treatment should require a safe pavement');
  await page.evaluate(()=>{const r=window.__m1Runtime;r.player={x:5,z:-19};r.path=[];r.notify({...r.player});});
  await page.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Nghỉ và chăm sóc'));return b&&!b.disabled;});
  await rest.click();
  await page.waitForFunction(until=>window.__m1Runtime.input.game.city.street.injuryUntil<until,injured.street.injuryUntil);
  assert(await page.evaluate(min=>window.__m1Runtime.input.game.city.minutes>=min+20,injured.minutes),engine+': treatment did not cost time');
  await page.waitForFunction(()=>!!JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')??'{}').city?.street?.severity);
  await page.reload();await page.waitForFunction(()=>!!window.__m1Runtime?.avatar.imported);
  assert(await page.evaluate(()=>window.__m1Runtime.input.game.city.street?.severity>0),engine+': injury lost on reload');
  await page.getByRole('button',{name:/Khám phá khu phố/}).click();await page.waitForFunction(()=>window.__m1Runtime.input.exploring);
  report.checks.push(engine+': real collision -> injury/energy -> free treatment/time -> saved reload');
  await page.evaluate(()=>{const r=window.__m1Runtime;r.player={x:0,z:-7.9};r.path=[];r.yaw=2.65;r.cameraFocus.set(0,0,-7.9);r.notify({...r.player});});
  // A real pointer gesture verifies the public joystick, not a test-only action.
  const stick=page.locator('.movement-stick'),rect=await stick.boundingBox();
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();
  await page.mouse.move(rect.x+rect.width/2+28,rect.y+rect.height/2-20);await page.waitForTimeout(900);
  const walk=await page.evaluate(()=>{const r=window.__m1Runtime;return {clip:r.avatar.imported.active,rate:r.avatar.imported.actions.get('Walk').getEffectiveTimeScale(),position:{...r.player}};});
  await page.mouse.up();
  assert(walk.clip==='Walk'&&walk.rate>0&&walk.rate<3,engine+': real joystick did not drive skeleton cadence '+JSON.stringify(walk));
  await page.locator('.neighborhood-sheet-toggle').click();await page.waitForFunction(()=>window.__m1Runtime.input.paused);
  const paused=await page.evaluate(()=>window.__m1Runtime.city.road.map(v=>v.x));
  await page.waitForTimeout(450);
  assert(await page.evaluate(xs=>window.__m1Runtime.city.road.every((v,i)=>v.x===xs[i]),paused),engine+': paused traffic moved');
  await page.locator('.neighborhood-sheet-toggle').click();await page.waitForFunction(()=>!window.__m1Runtime.input.paused);
  report.checks.push(engine+': real joystick drives Walk; notebook pause freezes traffic');
  for(const [width,height] of [[360,800],[390,844],[844,390],[1280,800]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(350);
    const boxes=await page.evaluate(()=>{const r=document.querySelector('.movement-stick').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth+2,stick:r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight};});
    assert(!boxes.overflow&&boxes.stick,engine+': viewport overflow '+width+'x'+height);
    await page.screenshot({path:out+'/'+engine+'-'+width+'x'+height+'.png',timeout:60000});
    report.checks.push(engine+': '+width+'x'+height+' screenshot and layout');
  }
  await context.close();
}
assert(report.errors.length===0,'Browser console errors: '+report.errors.join('; '));
}catch(error){report.errors.push(String(error.stack??error));process.exitCode=1;}
finally{await writeFile(out+'/results.json',JSON.stringify(report,null,2));console.log('STREET_PHYSICS_REPORT',JSON.stringify(report));await browser.close();}
