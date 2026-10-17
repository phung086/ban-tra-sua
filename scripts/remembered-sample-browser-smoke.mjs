// Browser E2E: voluntary sample costs cash immediately; trust follows real delivery only.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const KEY = 'tiem-tra-chibi-save-v3';
const url = process.env.PREVIEW_URL ?? 'http://127.0.0.1:5193';
const output = 'artifacts/remembered-sample';
await mkdir(output, { recursive: true });
const report = { passed: [], errors: [], environment: 'Chromium SwiftShader; not physical devices' };
const browser = await chromium.launch({ headless: true, args: [
  '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] });
try {
  for (const [width, height] of [[390, 844], [1280, 800]]) {
    const page = await browser.newPage({ viewport: { width, height },
      isMobile: width < 1000, hasTouch: width < 1000 });
    page.setDefaultTimeout(90000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    try {
      await page.addInitScript(() => localStorage.setItem('tiem-tra-chibi-ui-v1',
        JSON.stringify({ renderEngine: 'three', graphics: 'light',
          coachCompleted: true, motion: false, sound: false, music: false })));
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(key => Boolean(localStorage.getItem(key)), KEY);
      const fixture = await page.evaluate(key => {
        const s = JSON.parse(localStorage.getItem(key));
        s.day = 4; s.city.day = 4; s.city.minutes = 850; s.city.energy = 50;
        s.phase = 'open'; s.targetOrders = 1; s.cash = 210000;
        s.morning.day = 4; s.morning.plan.day = 4; s.morning.step = 'finished';
        s.reviews = [{ id: 'sample-e2e-review', customerId: 'miu',
          customerName: 'Miu', day: 1, stars: 2, score: 45,
          text: 'Topping chưa đúng đơn', replyStyle: 'sweet', replyText: 'Xin lỗi nhé' }];
        s.relationshipRewardIds = [
          'review-care:sample-e2e-review:1:message',
          'review-followup:sample-e2e-review:remember',
          'remembered-service:sample-e2e-prior',
        ];
        s.storyLog = [{ id: 'remembered-service:sample-e2e-prior',
          customerId: 'miu', customerName: 'Miu', title: 'Khách quen góp ý thêm',
          text: 'Miu: Topping chưa đúng đơn.', day: 3, rewardFans: 0 }];
        s.currentOrder = { id: 'sample-e2e-day4', customerId: 'miu',
          size: 'M', base: 'classic-milk-tea', sugar: 25, ice: 50,
          topping: 'none', targetFill: 80, targetShake: 60, price: 20000 };
        s.draft = { ...s.draft, base: 'classic-milk-tea', size: 'M',
          topping: 'none', sugar: 25, ice: 50, fill: 80, shake: 60, sealed: false };
        s.currentOrderQueuedAt = Date.now(); s.customerQueue = [];
        return s;
      }, KEY);
      await page.addInitScript(({ key, fixture }) => {
        if (sessionStorage.getItem('sample-seeded')) return;
        localStorage.setItem(key, JSON.stringify(fixture));
        sessionStorage.setItem('sample-seeded', '1');
      }, { key: KEY, fixture });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /Chào khách quen/ }).click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('remembered-greeting:sample-e2e-day4'), KEY);
      const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      await page.getByRole('button', { name: /Mời khách thử trà mẫu/ }).click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('remembered-sample:sample-e2e-day4'), KEY);
      const offered = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (offered.cash !== before.cash - 3000 ||
          offered.city.minutes !== before.city.minutes + 3 ||
          offered.city.energy !== before.city.energy - 1 ||
          offered.city.goodwill !== before.city.goodwill ||
          offered.customerBond.miu !== before.customerBond.miu)
        throw new Error('Sample cost or premature reward incorrect');
      await page.screenshot({ path: `${output}/offered-${width}x${height}.png`,
        fullPage: true, animations: 'disabled' });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByText(/Đã mời thử trà mẫu/).waitFor();
      if (await page.getByRole('button', { name: /Mời khách thử trà mẫu/ }).count())
        throw new Error('Sample repeat after reload');
      await page.locator('.craft-stations button').nth(3).click();
      await page.locator('.seal-button').click();
      await page.locator('.serve-button').click();
      await page.locator('.place-buttons button.destination').click();
      await page.waitForSelector('.delivery-tag button.primary-button:not([disabled])');
      await page.locator('.delivery-tag button.primary-button').click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('remembered-service:sample-e2e-day4'), KEY);
      const delivered = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      // The ordinary sale awards bond for its stars and customer patience.
      // A correctly delivered sample adds exactly one *extra* trust point.
      const saleBond = delivered.lastScore >= 93 ? 3
        : delivered.lastScore >= 80 ? 2
        : delivered.lastScore >= 65 ? 1 : 0;
      const patiencePenalty = delivered.lastService?.mood === 'upset' ? 2
        : delivered.lastService?.mood === 'restless' ? 1 : 0;
      const expectedBondGain = Math.max(0, saleBond - patiencePenalty) + 1;
      const actualBondGain = delivered.customerBond.miu - offered.customerBond.miu;
      if (delivered.city.goodwill !== offered.city.goodwill + 1 ||
          actualBondGain !== expectedBondGain ||
          !delivered.storyLog[0]?.text.includes('trà mẫu') ||
          delivered.cash < offered.cash)
        throw new Error('Sample delivery reward mismatch: ' + JSON.stringify({
          score: delivered.lastScore, mood: delivered.lastService?.mood,
          expectedBondGain, actualBondGain,
          goodwillGain: delivered.city.goodwill - offered.city.goodwill,
          cashGain: delivered.cash - offered.cash,
          callback: delivered.storyLog[0]?.text,
        }));
      await page.reload({ waitUntil: 'domcontentloaded' });
      const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (saved.city.goodwill !== delivered.city.goodwill ||
          saved.customerBond.miu !== delivered.customerBond.miu ||
          saved.cash !== delivered.cash)
        throw new Error('Reload lost trust or cash');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2))
        throw new Error('Horizontal overflow');
      if (errors.length) throw new Error('Console: ' + errors.join(' | '));
      await page.screenshot({ path: `${output}/delivered-${width}x${height}.png`,
        fullPage: true, animations: 'disabled' });
      report.passed.push(`${width}x${height}: sample → cost → reload → real delivery → trust`);

      // A second real scenario: two consecutive bad deliveries change NPC choices.
      // Recovery takes TWO actual correct deliveries on successive visits, not a greeting.
      const repeatedFixture = {
        ...fixture, day: 5, city: { ...fixture.city, day: 5 },
        morning: { ...fixture.morning, day: 5,
          plan: { ...fixture.morning.plan, day: 5 } },
        currentOrder: { ...fixture.currentOrder, id: 'sample-repeat-day5' },
        relationshipRewardIds: [
          'review-care:sample-e2e-review:1:message',
          'review-followup:sample-e2e-review:remember',
          'remembered-service:repeat-day4',
          'remembered-service:repeat-day3',
        ],
        storyLog: [
          { id: 'remembered-service:repeat-day4', customerId: 'miu',
            customerName: 'Miu', title: 'Khách quen góp ý thêm',
            text: 'Ly hôm qua sai topping.', day: 4, rewardFans: 0 },
          { id: 'remembered-service:repeat-day3', customerId: 'miu',
            customerName: 'Miu', title: 'Khách quen góp ý thêm',
            text: 'Ly hôm trước sai đá.', day: 3, rewardFans: 0 },
        ],
      };
      await page.addInitScript(({ key, value }) => {
        if (sessionStorage.getItem('sample-repeat-seeded')) return;
        localStorage.setItem(key, JSON.stringify(value));
        sessionStorage.setItem('sample-repeat-seeded', '1');
      }, { key: KEY, value: repeatedFixture });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByText(/Khách còn dè chừng/).waitFor();
      const guardedBefore = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      await page.getByRole('button', { name: /Chào khách quen.*chưa tăng thân thiết/ }).click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('remembered-greeting:sample-repeat-day5'), KEY);
      const guardedGreet = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (guardedGreet.city.goodwill !== guardedBefore.city.goodwill ||
          (guardedGreet.customerBond.miu ?? 0) !== (guardedBefore.customerBond.miu ?? 0))
        throw new Error('Guarded greeting awarded trust without a real delivery');
      await page.getByText(/Mình vẫn nhớ hai ly trước đều sai/).waitFor();
      await page.getByText(/hai ly sai liên tiếp/).first().waitFor();
      if (await page.getByRole('button', { name: /Mời khách thử trà mẫu/ }).count())
        throw new Error('NPC still accepted samples after two bad deliveries');
      await page.getByRole('button', { name: /Hỏi kỹ lỗi lần trước.*chưa tăng thân thiết/ }).click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('remembered-clarify:sample-repeat-day5'), KEY);
      const guardedAsked = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (guardedAsked.city.goodwill !== guardedBefore.city.goodwill ||
          (guardedAsked.customerBond.miu ?? 0) !== (guardedBefore.customerBond.miu ?? 0))
        throw new Error('Guarded clarification awarded trust without a real delivery');
      await page.getByText(/chưa muốn nghe lời hứa kiểm tra mới/).waitFor();
      if (await page.getByRole('button', { name: /Hứa kiểm tra kỹ/ }).count())
        throw new Error('NPC still accepted a third verbal promise');
      await page.locator('.craft-stations button').nth(3).click();
      await page.locator('.seal-button').click();
      await page.locator('.serve-button').click();
      await page.locator('.place-buttons button.destination').click();
      await page.waitForSelector('.delivery-tag button.primary-button:not([disabled])');
      await page.locator('.delivery-tag button.primary-button').click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('remembered-service:sample-repeat-day5'), KEY);
      const repeatDelivered = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (repeatDelivered.storyLog[0]?.title !== 'Khách quen hài lòng' ||
          !repeatDelivered.storyLog[0]?.text.includes('Hai lần trước ly đều sai') ||
          (repeatDelivered.customerBond.miu ?? 0) <= (guardedAsked.customerBond.miu ?? 0))
        throw new Error('First correct delivery did not begin recovery');
      await page.reload({ waitUntil: 'domcontentloaded' });
      const repeatSaved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (repeatSaved.storyLog[0]?.id !== 'remembered-service:sample-repeat-day5' ||
          repeatSaved.relationshipRewardIds.filter(id =>
            id === 'remembered-service:sample-repeat-day5').length !== 1)
        throw new Error('Repeat-complaint resolution did not survive reload');
      await page.screenshot({ path: `${output}/repeated-first-correct-${width}x${height}.png`,
        fullPage: true, animations: 'disabled' });

      // The day transition is a deterministic saved-state fixture, NOT a UI sleep test.
      // Each drink, greeting, and delivery below is performed through the actual UI.
      const nextVisit = (saved, day, id) => ({
        ...saved, day, phase: 'open', served: 0, targetOrders: 1,
        city: { ...saved.city, day, minutes: 850, energy: 50 },
        morning: { ...saved.morning, day, step: 'finished',
          plan: { ...saved.morning.plan, day } },
        currentOrder: { ...repeatedFixture.currentOrder, id },
        currentOrderQueuedAt: Date.now(), customerQueue: [],
        draft: { ...repeatedFixture.draft, sealed: false },
      });
      const nextDay = async (saved, day, id) => {
        const value = nextVisit(saved, day, id);
        await page.addInitScript(({ key, value, day }) => {
          if (sessionStorage.getItem('sample-day-' + day)) return;
          localStorage.setItem(key, JSON.stringify(value));
          sessionStorage.setItem('sample-day-' + day, '1');
        }, { key: KEY, value, day });
        await page.reload({ waitUntil: 'domcontentloaded' });
      };

      await nextDay(repeatSaved, 6, 'sample-repeat-day6');
      await page.getByText(/Khách ghi nhận ly đúng đầu tiên/).waitFor();
      if (await page.locator('.customer-heading').getAttribute('data-trust') !== 'recovering')
        throw new Error('First correct cup prematurely unlocked trust');
      const recoveringBefore = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      await page.getByRole('button', { name: /Chào khách quen.*chưa tăng thân thiết/ }).click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('remembered-greeting:sample-repeat-day6'), KEY);
      const recoveringGreet = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (recoveringGreet.city.goodwill !== recoveringBefore.city.goodwill ||
          (recoveringGreet.customerBond.miu ?? 0) !== (recoveringBefore.customerBond.miu ?? 0))
        throw new Error('Recovery greeting gave unearned trust');
      if (await page.getByRole('button', { name: /Mời khách thử trà mẫu/ }).count())
        throw new Error('Recovery prematurely unlocked sample offer');
      await page.screenshot({ path: `${output}/recovering-day6-${width}x${height}.png`,
        fullPage: true, animations: 'disabled' });
      await page.locator('.craft-stations button').nth(3).click();
      await page.locator('.seal-button').click();
      await page.locator('.serve-button').click();
      await page.locator('.place-buttons button.destination').click();
      await page.waitForSelector('.delivery-tag button.primary-button:not([disabled])');
      await page.locator('.delivery-tag button.primary-button').click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('remembered-service:sample-repeat-day6'), KEY);
      const secondDelivered = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (secondDelivered.storyLog[0]?.title !== 'Khách quen hài lòng' ||
          !secondDelivered.storyLog[0]?.text.includes('Ly thứ hai đúng rồi'))
        throw new Error('Second correct delivery failed to rebuild NPC trust');
      await page.reload({ waitUntil: 'domcontentloaded' });
      const secondSaved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (secondSaved.relationshipRewardIds.filter(id =>
            id === 'remembered-service:sample-repeat-day6').length !== 1 ||
          secondSaved.customerBond.miu !== secondDelivered.customerBond.miu)
        throw new Error('Second delivery was lost or duplicated after reload');
      await nextDay(secondSaved, 7, 'sample-repeat-day7');
      if (await page.locator('.customer-heading').getAttribute('data-trust') !== 'open')
        throw new Error('Two correct deliveries failed to reopen trust');
      const reopenedBefore = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      await page.getByRole('button', { name: /Chào khách quen.*[+]1 thân thiết/ }).click();
      await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}')
        .relationshipRewardIds?.includes('remembered-greeting:sample-repeat-day7'), KEY);
      const reopened = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (reopened.city.goodwill !== reopenedBefore.city.goodwill + 1 ||
          (reopened.customerBond.miu ?? 0) !== (reopenedBefore.customerBond.miu ?? 0) + 1)
        throw new Error('Reopened trust did not restore ordinary greeting reward');
      await page.reload({ waitUntil: 'domcontentloaded' });
      const reopenedSaved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      if (reopenedSaved.city.goodwill !== reopened.city.goodwill ||
          reopenedSaved.relationshipRewardIds.filter(id =>
            id === 'remembered-greeting:sample-repeat-day7').length !== 1)
        throw new Error('Reopened greeting duplicated or vanished after reload');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2))
        throw new Error('Horizontal overflow during trust recovery');
      if (errors.length) throw new Error('Console: ' + errors.join(' | '));
      await page.screenshot({ path: `${output}/reopened-day7-${width}x${height}.png`,
        fullPage: true, animations: 'disabled' });
      report.passed.push(`${width}x${height}: two wrong cups → two real correct deliveries → trust reopens → reload (fixture day changes)`);
    } catch (e) {
      report.errors.push(`${width}x${height}: ${String(e.stack || e)}`);
      await page.screenshot({ path: `${output}/FAIL-${width}x${height}.png`,
        fullPage: true }).catch(() => {});
    } finally { await page.close(); }
  }
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
console.log('REMEMBERED_SAMPLE_BROWSER_REPORT ' + JSON.stringify(report));
if (report.errors.length) process.exitCode = 1;
