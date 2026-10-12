import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:390,height:844}});
try {
  await page.goto('http://127.0.0.1:5192');
  await page.getByRole('button',{name:/Thức dậy bắt đầu ngày mới/}).click();
  await page.getByRole('button',{name:/Mua bánh mì đầu ngõ/}).click();
  await page.getByRole('button',{name:/Mua trái cây cô Hạnh/}).click();
  await page.getByText('Đã ghé chợ hôm nay').waitFor();
} finally { await browser.close(); }
