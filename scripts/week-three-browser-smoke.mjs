// Production Chromium/SwiftShader gameplay smoke. Simulated mobile sizes,
// not a claim about Android/iOS performance or physical-device M1 acceptance.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.MOBILE_LAYOUT_URL || 'http://127.0.0.1:5192';
const dir = process.env.MOBILE_LAYOUT_OUTPUT || 'mobile-layout-artifacts';
const saveKey = 'tiem-tra-chibi-save-v3';
const viewports = [[360, 800], [390, 844], [844, 390], [1280, 800]];
const report = { cases: [], errors: [], environment: 'Chromium SwiftShader simulated mobile and desktop' };
const assert = (value, message) => { if (!value) throw new Error(message); };
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: [
  '--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
      renderEngine: 'three', graphics: 'light', coachCompleted: true,
      motion: false, sound: false, music: false,
    }));
  });
  // App saves on pagehide; queue fixtures in sessionStorage and apply them
  // before React initializes on the next navigation, avoiding stale-save overwrite.
  await page.addInitScript(({ key, pendingKey }) => {
    const pending = sessionStorage.getItem(pendingKey);
    if (pending) {
      localStorage.setItem(key, pending);
      sessionStorage.removeItem(pendingKey);
    }
  }, { key: saveKey, pendingKey: 'tiem-tra-smoke-fixture' });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('.street-world canvas', { timeout: 120000 });
  await page.getByRole('button', { name: /Thức dậy bắt đầu ngày mới/ }).click({ timeout: 30000 });
  await page.getByRole('button', { name: /Đi làm luôn/ }).click({ timeout: 30000 });
  await page.waitForFunction(key => {
    try { return JSON.parse(localStorage.getItem(key) || '{}').morning?.step === 'finished'; }
    catch { return false; }
  }, saveKey, { timeout: 20000 });
  const initial = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);

  async function fixture(day, data = initial, panelName = 'Câu chuyện tuần ba') {
    await page.evaluate(({ day, data, key }) => {
      const game = structuredClone(data);
      game.day = day;
      game.phase = 'prep';
      game.city.day = day;
      game.morning.day = day;
      game.morning.plan.day = day;
      game.morning.step = 'finished';
      game.morning.breakfast = 'skip';
      game.morning.satiety = 30;
      sessionStorage.setItem('tiem-tra-smoke-fixture', JSON.stringify(game));
    }, { day, data, key: saveKey });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.getByRole('region', { name: panelName }).waitFor({ timeout: 45000 });
  }

  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await fixture(15);
    const panel = page.getByRole('region', { name: 'Câu chuyện tuần ba' });
    assert(await panel.getByText('Cơn mỏi vai').isVisible(), 'Day 15 panel missing at ' + width + 'x' + height);
    const care = panel.getByRole('button', { name: /Nghỉ ngơi 30 phút/ });
    assert(await care.isEnabled(), 'Rest action disabled at ' + width + 'x' + height);
    await care.click({ timeout: 45000 });
    await page.waitForFunction(key => {
      try { return JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes('week-three-15-care'); }
      catch { return false; }
    }, saveKey, { timeout: 20000 });
    const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
    assert(after.city.energy <= 100, 'Rest exceeded energy cap');
    assert(after.city.minutes >= initial.city.minutes + 30, 'Rest did not advance game time');
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await panel.getByText(/Đã lưu quyết định/).waitFor({ timeout: 30000 });
    assert(await panel.getByRole('button').count() === 0, 'Reload allowed duplicate action');
    await page.screenshot({ path: path.join(dir, 'week-three-' + width + 'x' + height + '.png'), animations: 'disabled', timeout: 90000 });
    report.cases.push('day15 rest/save/reload ' + width + 'x' + height);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await fixture(20);
  const beforeIce = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).inventory.ice, saveKey);
  await page.getByRole('region', { name: 'Câu chuyện tuần ba' })
    .getByRole('button', { name: /Nhờ bố mua đá dự phòng/ }).click({ timeout: 45000 });
  await page.waitForFunction(key => {
    try { return JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes('week-three-20-care'); }
    catch { return false; }
  }, saveKey, { timeout: 20000 });
  const afterDay20 = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  assert(afterDay20.inventory.ice === beforeIce + 4, 'Ice restock was not applied once');
  await fixture(21, afterDay20);
  const callback = page.getByRole('region', { name: 'Câu chuyện tuần ba' });
  assert(await callback.getByText(/Bố Quang hỏi thùng đá/).isVisible(), 'NPC did not remember day 20 on day 21');
  report.cases.push('day20 reserve ice -> day21 father callback');
  // Chapter IV: interact with the real React UI, persist once, and check NPC memory.
  await page.setViewportSize({ width: 390, height: 844 });
  await fixture(22, initial, 'Câu chuyện tuần bốn');
  const weekFour = page.getByRole('region', { name: 'Câu chuyện tuần bốn' });
  assert(await weekFour.getByText('Con đường ra ngoại ô').isVisible(), 'Day 22 episode missing');
  await weekFour.getByRole('button', { name: /Hẹn ở trạm xe/ }).click({ timeout: 45000 });
  await page.waitForFunction(key => {
    try { return JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes('week-four-22-takeTime'); }
    catch { return false; }
  }, saveKey, { timeout: 20000 });
  const day22 = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  assert(day22.cash === initial.cash - 6000, 'Day 22 transport charge incorrect');
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await weekFour.getByText(/Đã lưu quyết định/).waitFor({ timeout: 30000 });
  assert(await weekFour.getByRole('button').count() === 0, 'Day 22 reload duplicated choices');
  report.cases.push('day22 transport and once-only save/reload');

  await fixture(23, day22, 'Câu chuyện tuần bốn');
  assert(await weekFour.getByText(/Bác Minh đã báo điểm hẹn/).isVisible(), 'Day 23 NPC memory missing');
  await fixture(23, { ...day22, cash: 0 }, 'Câu chuyện tuần bốn');
  assert(!await weekFour.getByRole('button', { name: /Thanh toán 38.000đ/ }).isEnabled(), 'Unaffordable bill should be disabled');
  await weekFour.getByRole('button', { name: /Cùng mẹ rà soát/ }).click({ timeout: 45000 });
  await page.waitForFunction(key => {
    try { return JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes('week-four-23-keepSimple'); }
    catch { return false; }
  }, saveKey, { timeout: 20000 });
  const day23 = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  assert(day23.cash === 0, 'Free bill review charged cash');
  report.cases.push('day23 zero-cash fallback and NPC callback');

  await page.setViewportSize({ width: 1280, height: 800 });
  await fixture(24, initial, 'Câu chuyện tuần bốn');
  const beforeDay24 = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  await weekFour.getByRole('button', { name: /Đi chợ và nấu canh/ }).click({ timeout: 45000 });
  await page.waitForFunction(key => {
    try { return JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes('week-four-24-takeTime'); }
    catch { return false; }
  }, saveKey, { timeout: 20000 });
  const day24 = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  assert(day24.cash === beforeDay24.cash - 26000, 'Cooking cost incorrect');
  assert(day24.morning.satiety > beforeDay24.morning.satiety, 'Cooking did not restore satiety');
  await fixture(25, day24, 'Câu chuyện tuần bốn');
  assert(await weekFour.getByText(/Mẹ Mai hỏi có muốn nấu/).isVisible(), 'Day 25 cooking callback missing');
  report.cases.push('day24 cook -> day25 callback on desktop');

  // New chapter-four choices must be available in the same production UI.
  await page.setViewportSize({ width: 390, height: 844 });
  await fixture(25, initial, 'Câu chuyện tuần bốn');
  await weekFour.getByRole('button', { name: /Hẹn lại cả nhóm/ }).click({ timeout: 45000 });
  await page.waitForFunction(key => {
    try { return JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes('week-four-25-keepSimple'); }
    catch { return false; }
  }, saveKey, { timeout: 20000 });
  const day25 = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  await fixture(26, day25, 'Câu chuyện tuần bốn');
  assert(await weekFour.getByText(/Lan đã nhắn Thảo/).isVisible(), 'Day 26 missing Lan callback');
  await weekFour.getByRole('button', { name: /Hủy giao xa, hẹn tại tiệm/ }).click({ timeout: 45000 });
  await page.waitForFunction(key => {
    try { return JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes('week-four-26-keepSimple'); }
    catch { return false; }
  }, saveKey, { timeout: 20000 });
  const day26 = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  await fixture(27, day26, 'Câu chuyện tuần bốn');
  assert(await weekFour.getByText(/Bác Minh báo nhóm bạn/).isVisible(), 'Day 27 missing Minh callback');
  await weekFour.getByRole('button', { name: /Viết thiệp tay/ }).click({ timeout: 45000 });
  await page.waitForFunction(key => {
    try { return JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes('week-four-27-keepSimple'); }
    catch { return false; }
  }, saveKey, { timeout: 20000 });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await weekFour.getByText(/Đã lưu quyết định/).waitFor({ timeout: 30000 });
  assert(await weekFour.getByRole('button').count() === 0, 'Day 27 duplicated choice after reload');
  report.cases.push('day25–27 friends, safe delivery, birthday and reload');


  // Days 28-30: recovery, safe travel planning, chapter milestone and save persistence.
  await page.setViewportSize({ width: 390, height: 844 });
  await fixture(28, initial, 'Câu chuyện tuần bốn');
  await weekFour.getByRole('button', { name: /Gọi cho mẹ và nghỉ ngơi/ }).click({ timeout: 45000 });
  await page.waitForFunction(key => {
    try { return JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes('week-four-28-takeTime'); }
    catch { return false; }
  }, saveKey, { timeout: 20000 });
  const day28 = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await weekFour.getByText(/Đã lưu quyết định/).waitFor({ timeout: 30000 });
  assert(await weekFour.getByRole('button').count() === 0, 'Day 28 duplicated after reload');
  await fixture(29, day28, 'Câu chuyện tuần bốn');
  assert(await weekFour.getByText(/Mẹ Mai nhớ cuộc gọi/).isVisible(), 'Day 29 family callback missing');
  await weekFour.getByRole('button', { name: /Hẹn nhóm bàn sau/ }).click({ timeout: 45000 });
  await page.waitForFunction(key => {
    try { return JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes('week-four-29-keepSimple'); }
    catch { return false; }
  }, saveKey, { timeout: 20000 });
  const day29 = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  await fixture(30, day29, 'Câu chuyện tuần bốn');
  assert(await weekFour.getByText('💌 Lan nhắn lịch mới cho cả nhóm.', { exact: true }).isVisible(), 'Day 30 friend callback missing');
  assert(await weekFour.getByText(/Tổng kết tháng đầu/).isVisible(), 'Day 30 milestone missing');
  await weekFour.getByRole('button', { name: /Viết lời cảm ơn/ }).click({ timeout: 45000 });
  await page.waitForFunction(key => {
    try { return JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes('week-four-30-keepSimple'); }
    catch { return false; }
  }, saveKey, { timeout: 20000 });
  const day30 = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  await fixture(31, day30, 'Câu chuyện tuần bốn');
  assert(await weekFour.getByText(/Cô Hạnh giữ lại lời nhắn/).isVisible(), 'Day 31 chapter callback missing');
  report.cases.push('day28-30 recovery, planning, milestone and day31 memory');

  // Chapter VI: mobile stock purchase, reload and next-day memory.
  await page.setViewportSize({ width: 390, height: 844 });
  await fixture(40, initial, 'Câu chuyện chương sáu');
  const chapterSix = page.getByRole('region', { name: 'Câu chuyện chương sáu' });
  const sugarBefore = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).inventory.sugar, saveKey);
  await chapterSix.getByRole('button', { name: /Mua 4 phần đường/ }).click({ timeout: 45000 });
  await page.waitForFunction(key => {
    try { return JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes('week-six-40-meet'); }
    catch { return false; }
  }, saveKey, { timeout: 20000 });
  const day40 = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  assert(day40.inventory.sugar === sugarBefore + 4, 'Day 40 stock mismatch');
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await chapterSix.getByText(/Đã lưu quyết định/).waitFor({ timeout: 30000 });
  assert(await chapterSix.getByRole('button').count() === 0, 'Day 40 duplicated after reload');
  await fixture(41, day40, 'Câu chuyện chương sáu');
  assert(await chapterSix.getByText(/Cô Hạnh nhớ bạn đã thanh toán/).isVisible(), 'Day 41 NPC callback missing');
  report.cases.push('day40 sugar purchase and day41 callback on mobile');

  // Chapter VI: desktop community event, fan reward and week recap.
  await page.setViewportSize({ width: 1280, height: 800 });
  await fixture(44, initial, 'Câu chuyện chương sáu');
  await chapterSix.getByRole('button', { name: /Cùng dọn góc phố/ }).click({ timeout: 45000 });
  await page.waitForFunction(key => {
    try { return JSON.parse(localStorage.getItem(key) || '{}').relationshipRewardIds?.includes('week-six-44-meet'); }
    catch { return false; }
  }, saveKey, { timeout: 20000 });
  const day44 = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  assert(day44.fans === initial.fans + 2, 'Day 44 fans mismatch');
  await chapterSix.getByText(/Tổng kết tuần/).waitFor({ timeout: 30000 });
  await fixture(45, day44, 'Câu chuyện chương sáu');
  assert(await chapterSix.getByText(/Bác Bình kể với cô Hạnh/).isVisible(), 'Day 45 callback missing');
  report.cases.push('day44 community reward and day45 callback on desktop');

  assert(report.errors.length === 0, 'Uncaught browser errors: ' + report.errors.join('; '));
  await context.close();
} catch (error) {
  report.errors.push(String(error.stack || error));
  console.error('STORY_BROWSER_FAIL ' + String(error.stack || error));
  process.exitCode = 1;
} finally {
  await writeFile(path.join(dir, 'week-three-results.json'), JSON.stringify(report, null, 2));
  console.log('STORY_BROWSER_REPORT ' + JSON.stringify(report));
  await browser.close();
}
