// Production-preview regression. Requires Playwright on the runner.
// Run: npm run preview -- --port 5193 & node scripts/remembered-customer-browser-smoke.mjs
import { chromium } from 'playwright';

const base = process.env.PREVIEW_URL ?? 'http://127.0.0.1:5193';
const key = 'tiem-tra-chibi-save-v3';
const browser = await chromium.launch({ headless: true });
let failed = false;
try {
  for (const [width, height] of [[360,800],[390,844],[844,390],[1280,800]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(key => !!localStorage.getItem(key), key);
      const state = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
      state.day = 2;
      state.city.minutes = 850;
      state.city.energy = 50;
      state.phase = 'open';
      state.morning.day = 2;
      state.morning.plan.day = 2;
      state.morning.step = 'finished';
      state.reviews = [{
        id:'returning',customerId:'miu',customerName:'Miu',day:1,
        stars:2,score:45,text:'Trà hơi ngọt',replyStyle:'sweet',replyText:'Mình xin hỏi thêm!'
      }];
      state.relationshipRewardIds = ['review-care:returning:1:message','review-followup:returning:remember'];
      state.currentOrder = {
        id:'returning-order',customerId:'miu',size:'M',base:'classic-milk-tea',
        sugar:25,ice:50,topping:'none',targetFill:80,targetShake:60,price:20000
      };
      await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key, state });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByText('Nhớ khách thích ít ngọt').waitFor();
      await page.getByRole('button', { name: /Chào khách quen/ }).click();
      await page.getByText('Đã chào khách theo sở thích.').waitFor();
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByText('Đã chào khách theo sở thích.').waitFor();
      if (await page.getByRole('button', { name: /Chào khách quen/ }).count()) throw Error('Duplicate reward');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2)) throw Error('Horizontal overflow');
      if (errors.length) throw Error(errors.join(' | '));
      console.log('PASS', width, height);
    } catch (error) {
      failed = true;
      console.error('FAIL', width, height, error);
    } finally { await page.close(); }
  }
} finally { await browser.close(); }
if (failed) process.exitCode = 1;
