import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='.impeccable/review/motion';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={environment:'Chromium emulated touch / software WebGL; not a physical mobile benchmark',checks:[],errors:[]};
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('tiem-tra-chibi-ui-v1',JSON.stringify({renderEngine:'three',graphics:'light',coachCompleted:true,motion:true,sound:false,music:false})));
 await page.goto('http://127.0.0.1:5188/?m1bench=1');
 await page.waitForFunction(()=>window.__m1Runtime?.avatar.imported,null,{timeout:90000});
 await page.getByRole('button',{name:/Khám phá khu phố/}).click();
 await page.waitForFunction(()=>window.__m1Runtime.input.exploring);
 await page.evaluate(()=>{const r=window.__m1Runtime;r.player={x:0,z:-7.9};r.path=[];r.yaw=2.65;r.cameraMode='';});
 await page.waitForTimeout(1000);
 const cdp=await page.context().newCDPSession(page);
 const rect=await page.locator('.movement-stick').boundingBox(),cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
 const touch=(type,x=cx,y=cy)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});
 const snapshot=()=>page.evaluate(()=>{const r=window.__m1Runtime,a=r.avatar.imported,clip=a.actions.get(a.active);return {x:r.player.x,z:r.player.z,phase:r.avatarPhase,clip:a.active,clipTime:clip.time,duration:clip.getClip().duration,heading:r.stickYaw,yaw:r.yaw,orbit:r.orbitYaw,held:r.held.root.visible,wrist:r.avatar.hand.parent.name};});
 for(const [name,offset] of [['gentle',12],['full',26]]){
  await touch('touchStart');await touch('touchMove',cx+offset,cy);
  await page.waitForTimeout(400);const start=await snapshot();
  const frames=[];for(let i=0;i<5;i++){await page.waitForTimeout(160);frames.push(await snapshot());if(name==='full')await page.screenshot({path:`${out}/stride-${i}.png`});}
  await touch('touchEnd');await page.waitForTimeout(350);const stop=await snapshot();await page.waitForTimeout(350);const settled=await snapshot();
  if(frames.some(f=>f.clip!=='Walk'))throw Error(name+': walk did not respond');
  if(frames.some(f=>Math.abs(f.heading-start.heading)>.00001))throw Error('Camera steered held touch');
  if(stop.clip!=='Idle'||Math.hypot(stop.x-settled.x,stop.z-settled.z)>.00001)throw Error('Release drift or frozen walk');
  if(start.wrist!=='FistR'||start.held)throw Error('Invalid item attachment/first-person item in city');
  const end=frames.at(-1),distance=Math.hypot(end.x-start.x,end.z-start.z),phase=end.phase-start.phase;
  // Sliding around an obstacle can travel farther than the endpoint chord.
  if(phase+.001<distance*3.6)throw Error('Cadence disagrees with actual distance');
  for(const frame of frames)if(Math.abs(frame.clipTime/frame.duration-((frame.phase/(2*Math.PI))%1))>.00001)throw Error('Walk phase drift');
  report.checks.push({name,start,frames,stop,distance,phase});
 }
 await page.screenshot({path:out+'/settled.png'});
}catch(e){report.errors.push(String(e.stack??e));process.exitCode=1;}
finally{await browser.close();await writeFile(out+'/results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
