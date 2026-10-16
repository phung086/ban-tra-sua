// Production Chromium SwiftShader smoke; not physical device FPS evidence.
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
]});
const base=process.env.SMOKE_URL || 'http://127.0.0.1:5192';
try {
  for(const [width,height] of [[360,800],[390,844],[844,390],[1280,800]]){
    const mobile=width<1000;
    const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
    const page=await context.newPage();
    await page.addInitScript(()=>localStorage.setItem('tiem-tra-chibi-ui-v1',JSON.stringify({
      renderEngine:'three',graphics:'light',coachCompleted:true,motion:false,sound:false,music:false
    })));
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForSelector('.life-morning',{timeout:90000});
    await page.getByRole('button',{name:/Thức dậy bắt đầu ngày mới/}).click();
    await page.getByRole('button',{name:/Đi làm luôn/}).click();
    await page.getByRole('button',{name:/Tưới cây trước hiên/}).click();
    await page.waitForFunction(()=>{
      const saved=JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')||'{}');
      return saved.morning?.plantCare==='water' && saved.city?.goodwill===1;
    },null,{timeout:20000});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForSelector('.life-plant-care',{timeout:90000});
    if(await page.getByRole('button',{name:/Tưới cây trước hiên/}).count()!==0)
      throw new Error('Plant care duplicated after reload');
    const open=page.getByRole('button',{name:/Mở cửa tiệm/});
    if(!await open.isEnabled())throw new Error('Plant care blocked shop opening');
    await open.click();
    await page.waitForSelector('.craft-stations button',{timeout:30000});
    await page.locator('.craft-stations button').nth(3).click();
    await page.locator('.seal-button').click();
    await page.locator('.serve-button').click();
    await page.waitForSelector('.delivery-tag.carrying',{timeout:30000});
    if(await page.locator('.movement-stick').count()===0)throw new Error('Joystick missing');
    console.log('PLANT_CARE_SMOKE_PASS',width,height);
    await context.close();
  }
} finally {await browser.close();}
