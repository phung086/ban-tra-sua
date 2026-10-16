import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseShiftPlan, completionBonus, getRushCupShortage, getRushCupRequirements, getRushCupShortageBySize, getRushOrderSize, getRushOfficeCustomerId, getRushCommuterRequest, getRushCommuterPreferredBase, getRushShiftProgress, getShiftDisplayAverage, getShiftQueueSpacingMs, targetOrdersFor } from '../src/game/shiftPlans.ts';
const state = () => ({ day: 9, phase: 'prep', cash: 220000, targetOrders: targetOrdersFor(9,0), event: { demandBonus: 0 }, shiftPlan: 'regular' });
test('day one remains the tutorial, with unchanged order count', () => {
  assert.equal(targetOrdersFor(1, 0, 'rush'), targetOrdersFor(1, 0));
  const s={...state(), day:1}; assert.equal(chooseShiftPlan(s,'rush'),s);
});
test('day 9 rush gives two extra orders, without charging for the selection', () => {
  const start=state(), after=chooseShiftPlan(start,'rush');
  assert.equal(after.targetOrders,start.targetOrders+2);
  assert.equal(after.cash,start.cash);
  assert.equal(chooseShiftPlan(after,'rush').targetOrders,after.targetOrders);
  assert.equal(chooseShiftPlan(after,'regular').targetOrders,start.targetOrders);
});
test('cannot change a shift already underway', () => {
  const s={...state(),phase:'open'}; assert.equal(chooseShiftPlan(s,'rush'),s);
});
test('quality and completion requirements gate the reward',()=>{
  assert.deepEqual(completionBonus('rush',9,7,7,560),{cash:20000,fans:2});
  assert.deepEqual(completionBonus('rush',9,7,7,559),{cash:0,fans:0});
  assert.deepEqual(completionBonus('rush',9,6,7,600),{cash:0,fans:0});
  assert.deepEqual(completionBonus('regular',9,7,7,700),{cash:0,fans:0});
  assert.deepEqual(completionBonus('rush',1,7,7,700),{cash:0,fans:0});
});
test('bonus rejects invalid score aggregates',()=>{
  for(const score of [NaN,Infinity,-Infinity])
    assert.deepEqual(completionBonus('rush',9,7,7,score),{cash:0,fans:0});
});
test('selected shift survives serialized save and does not mutate inventory', () => {
  const base={...state(),inventory:{cupsM:7},city:{goodwill:10},settings:{quality:'light'}};
  const rush=chooseShiftPlan(base,'rush');
  const restored=JSON.parse(JSON.stringify(rush));
  assert.equal(restored.shiftPlan,'rush');
  assert.equal(restored.targetOrders,targetOrdersFor(9,0,'rush'));
  assert.deepEqual(restored.inventory,base.inventory);
  assert.deepEqual(restored.city,base.city);
  assert.deepEqual(restored.settings,base.settings);
});

test('day 9 rush reveals a real shortage of cups before opening', () => {
  const selected=chooseShiftPlan({...state(),inventory:{cupsM:2,cupsL:1}},'rush');
  assert.equal(getRushCupShortage(selected),selected.targetOrders-3);
  assert.equal(getRushCupShortage({...selected,inventory:{cupsM:selected.targetOrders,cupsL:0}}),getRushCupRequirements(selected).cupsL);
  assert.equal(getRushCupShortage({...selected,shiftPlan:'regular'}),0);
});
test('shortage helper treats malformed cup counts as zero without mutating save', () => {
  const selected=chooseShiftPlan({...state(),inventory:{cupsM:NaN,cupsL:-2}},'rush');
  const before={...selected.inventory};
  assert.equal(getRushCupShortage(selected),selected.targetOrders);
  assert.deepEqual(selected.inventory,before);
});

test('rush order sizes are deterministic and match the exact M/L stock requirement', () => {
  const selected=chooseShiftPlan({...state(),inventory:{cupsM:0,cupsL:0}},'rush');
  const required=getRushCupRequirements(selected);
  const sizes=Array.from({length:selected.targetOrders},(_,index)=>getRushOrderSize(selected,index));
  assert.equal(sizes.filter(size=>size==='M').length,required.cupsM);
  assert.equal(sizes.filter(size=>size==='L').length,required.cupsL);
  assert.equal(getRushOrderSize(selected,selected.targetOrders),null);
  assert.equal(getRushOrderSize({...selected,shiftPlan:'regular'},0),null);
  assert.deepEqual(getRushCupShortageBySize({...selected,inventory:{cupsM:selected.targetOrders,cupsL:0}}),{cupsM:0,cupsL:required.cupsL});
  assert.equal(getRushCupShortage({...selected,inventory:{cupsM:required.cupsM,cupsL:required.cupsL}}),0);
});

test('rush readiness counts whole cups, and switching to regular removes the gate', () => {
  const s=chooseShiftPlan({...state(),inventory:{cupsM:1.9,cupsL:0.9}},'rush');
  assert.equal(getRushCupShortage(s),s.targetOrders-1);
  assert.equal(getRushCupShortage(chooseShiftPlan(s,'regular')),0);
});

test('rush arrival interval is 30 percent shorter, not applied to other days', () => {
  assert.equal(getShiftQueueSpacingMs({ day: 9, shiftPlan: 'rush' }, 10000), 7000);
  assert.equal(getShiftQueueSpacingMs({ day: 8, shiftPlan: 'rush' }, 10000), 10000);
  assert.equal(getShiftQueueSpacingMs({ day: 9, shiftPlan: 'regular' }, 10000), 10000);
  assert.equal(getShiftQueueSpacingMs({ day: 9, shiftPlan: 'rush' }, 1200), 1000);
});

test('rush opening brings two familiar commuters, not a random clone', () => {
  const rush = { day: 9, shiftPlan: 'rush', targetOrders: 12 };
  assert.equal(getRushOfficeCustomerId(rush, 0), 'bo');
  assert.equal(getRushOfficeCustomerId(rush, 1), 'duc');
  assert.equal(getRushOfficeCustomerId(rush, 2), null);
  assert.equal(getRushOfficeCustomerId({ ...rush, day: 10 }, 0), 'duc');
  assert.equal(getRushOfficeCustomerId({ ...rush, shiftPlan: 'regular' }, 0), null);
  assert.equal(getRushOfficeCustomerId({ ...rush, day: 8 }, 0), null);
});

test('commuter favorites respect progression and regular shifts', () => {
  const rush = { day: 9, shiftPlan: 'rush', targetOrders: 12 };
  assert.equal(getRushCommuterPreferredBase(rush, 0, 'classic-milk-tea', ['classic-milk-tea']), 'classic-milk-tea');
  assert.equal(getRushCommuterPreferredBase(rush, 1, 'cocoa-milk', ['classic-milk-tea']), null);
  assert.equal(getRushCommuterPreferredBase(rush, 1, 'cocoa-milk', ['classic-milk-tea', 'cocoa-milk']), 'cocoa-milk');
  assert.equal(getRushCommuterPreferredBase({ ...rush, shiftPlan: 'regular' }, 0, 'classic-milk-tea', ['classic-milk-tea']), null);
});

test('live rush progress uses the same 80-point completion threshold as payout', () => {
  const rush = {day:9,shiftPlan:'rush',targetOrders:10,served:4,dailyScoreTotal:332};
  assert.deepEqual(getRushShiftProgress(rush), {served:4,remaining:6,average:83,requiredAverage:78,bonusEarned:false});
  assert.equal(getRushShiftProgress({...rush,served:10,dailyScoreTotal:800}).bonusEarned,true);
  assert.equal(getRushShiftProgress({...rush,served:10,dailyScoreTotal:799}).bonusEarned,false);
  assert.equal(getRushShiftProgress({...rush,shiftPlan:'regular'}),null);
  assert.equal(getRushShiftProgress({...rush,day:8}),null);
});

test('quality target stays honest at 79.5 and calculates recovery needed', () => {
  const partial = { day:9,shiftPlan:'rush',targetOrders:10,served:4,dailyScoreTotal:318 };
  const progress = getRushShiftProgress(partial);
  assert.equal(progress.average,79.5);
  assert.equal(progress.requiredAverage,81);
  assert.equal(progress.bonusEarned,false);
  const impossible = getRushShiftProgress({...partial,served:9,dailyScoreTotal:600});
  assert.equal(impossible.requiredAverage,200);
  assert.equal(getRushShiftProgress({...partial,served:10,dailyScoreTotal:799.5}).bonusEarned,false);
  assert.equal(getRushShiftProgress({...partial,served:10,dailyScoreTotal:800}).bonusEarned,true);
});

test('rush quality outcome is actually mounted in the day-summary UI', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /game\.phase === "summary" && game\.summary && \([\s\S]{0,250}<RushShiftProgress game=\{game\} \/>/);
});

test('summary and rush progress agree with the bonus on a 79.9 score', () => {
  const total = 959, served = 12;
  assert.equal(getShiftDisplayAverage('rush', 9, served, total), 79.9);
  assert.equal(getRushShiftProgress({ day: 9, shiftPlan: 'rush', served, targetOrders: served, dailyScoreTotal: total }).average, 79.9);
  assert.equal(completionBonus('rush', 9, served, served, total).cash, 0);
  assert.equal(getShiftDisplayAverage('regular', 9, served, total), 80);
  assert.equal(getShiftDisplayAverage('rush', 8, served, total), 80);
  assert.equal(getShiftDisplayAverage('rush', 9, served, 960), 80);
  assert.equal(completionBonus('rush', 9, served, served, 960).cash, 20000);
});


test('rush commuters bring stable personalized sugar/ice requests into each order', () => {
  const rush = {day:9,shiftPlan:'rush',targetOrders:12};
  assert.deepEqual(getRushCommuterRequest(rush,0), {customerId:'bo',sugar:30,hint:'Bơ: 30% đường'});
  assert.deepEqual(getRushCommuterRequest(rush,1), {customerId:'duc',ice:0,hint:'Đức: không đá'});
  assert.equal(getRushCommuterRequest(rush,2),null);
  assert.deepEqual(getRushCommuterRequest({...rush,day:10},0), {customerId:'duc',ice:0,hint:'Đức: không đá'});
  assert.equal(getRushCommuterRequest({...rush,shiftPlan:'regular'},0),null);
  assert.equal(getRushCommuterRequest({...rush,day:8},0),null);
  assert.deepEqual(JSON.parse(JSON.stringify(getRushCommuterRequest(rush,0))),getRushCommuterRequest(rush,0));
});

test('real order generator wiring applies the requested sugar and ice', () => {
  const engine = readFileSync(new URL('../src/game/engine.ts',import.meta.url),'utf8');
  assert.match(engine,/const commuterRequest = getRushCommuterRequest\(state, orderIndex\)/);
  assert.match(engine,/const sugar = commuterRequest\?\.sugar \?\? pick\(PERCENT_OPTIONS\)/);
  assert.match(engine,/const ice = commuterRequest\?\.ice \?\? pick\(PERCENT_OPTIONS\)/);
});
