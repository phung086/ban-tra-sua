import { chromium } from 'playwright';

const browser = await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--no-sandbox']});
const viewports = [[360,800],[390,844],[844,390],[1280,800]];
try {
  for (const [width,height] of viewports) {
    const page = await browser.newPage({viewport:{width,height}});
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:5193',{waitUntil:'domcontentloaded'});
    const skip = page.getByRole('button',{name:'Bỏ qua'});
    if (await skip.isVisible()) await skip.click();
    await page.getByRole('button',{name:/Thức dậy bắt đầu ngày mới/}).click({timeout:30000});
    await page.getByRole('button',{name:/Đi làm luôn/}).click({timeout:15000});
    await page.getByText('Mẹ Mai: Con lại bỏ bữa sáng à? Nhớ ăn gì đó khi rảnh nhé.').waitFor({timeout:15000});
    await page.getByRole('button',{name:/Nghe mẹ kể chuyện/}).click({timeout:15000});
    await page.waitForFunction(()=>{
      const save=JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')||'{}');
      return save.morning?.motherCall==='listen' && save.cash===220000 &&
        save.city?.stories?.choices?.includes('family-mother-mai:1:listen');
    },null,{timeout:10000});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('.life-mother-reply').waitFor({timeout:15000});
    await page.getByText('Gắn kết gia đình: 2 điểm').waitFor({timeout:15000});
    if (await page.getByRole('button',{name:/Nghe mẹ kể chuyện/}).count()) throw Error('Call offered twice');
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')||'{}'));
    if (saved.cash!==220000||saved.morning.motherCall!=='listen') throw Error('Reload changed state');
    if (await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)) throw Error('Horizontal overflow');
    if (errors.length) throw Error(errors.join('; '));
    console.log('PASS mother call and reload',width,height);
    await page.close();
  }
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('http://127.0.0.1:5193',{waitUntil:'domcontentloaded'});
  const skip=page.getByRole('button',{name:'Bỏ qua'});
  if (await skip.isVisible()) await skip.click();
  await page.getByRole('button',{name:/Thức dậy bắt đầu ngày mới/}).click();
  await page.getByRole('button',{name:/Đi làm luôn/}).click();
  await page.getByRole('button',{name:/Nhắn mẹ tối gọi lại/}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')||'{}').morning?.motherCall==='later');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/Mở cửa tiệm/}).click({timeout:30000});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')||'{}').phase==='open');
  console.log('PASS postponement, reload and existing shop opening');
  await page.close();
  const photoPage=await browser.newPage({viewport:{width:390,height:844}});
  await photoPage.goto('http://127.0.0.1:5193',{waitUntil:'domcontentloaded'});
  const photoSkip=photoPage.getByRole('button',{name:'Bỏ qua'});
  if(await photoSkip.isVisible()) await photoSkip.click();
  await photoPage.getByRole('button',{name:/Thức dậy bắt đầu ngày mới/}).click();
  await photoPage.getByRole('button',{name:/Nấu cơm trứng ở nhà/}).click();
  await photoPage.getByText('Mẹ Mai: Nghe con tự nấu cơm sáng mẹ vui lắm. Giữ sức khỏe nhé!').waitFor();
  await photoPage.getByRole('button',{name:/Gửi ảnh tiệm cho mẹ/}).click();
  await photoPage.waitForFunction(()=>{
    const s=JSON.parse(localStorage.getItem('tiem-tra-chibi-save-v3')||'{}');
    return s.morning?.motherCall==='photo'&&s.city?.stories?.choices?.includes('family-mother-mai:1:photo');
  });
  await photoPage.reload({waitUntil:'domcontentloaded'});
  await photoPage.getByText(/Mẹ xem ảnh tiệm rồi/).waitFor();
  if(await photoPage.getByRole('button',{name:/Gửi ảnh tiệm cho mẹ/}).count()) throw Error('Photo decision offered twice');
  console.log('PASS photo, breakfast reaction and reload');
  await photoPage.close();
} finally {await browser.close();}
