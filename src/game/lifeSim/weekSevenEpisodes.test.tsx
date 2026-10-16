import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {PrepWorld} from '../../components/world/PrepWorld';
import {createInitialState,nextDay} from '../engine';
import {chooseBreakfast,hydrateMorning,wakeMorning} from './morning';
import {canChooseWeekSeven,chooseWeekSeven,getWeekSevenEpisode,getWeekSevenDecision,getWeekSevenCallback,getWeekSevenRecap} from './weekSevenEpisodes';
function ready(day:number){let game=createInitialState();for(let n=1;n<day;n++)game=nextDay(game);return chooseBreakfast(wakeMorning(game),'skip')}
describe('playable days 45-51',()=>{
 it('renders seven episodes in the actual preparation UI',()=>{
  const titles=new Set<string>();
  for(let day=45;day<=51;day++){
   const game=ready(day),e=getWeekSevenEpisode(game);
   expect(e).not.toBeNull();titles.add(e!.title);
   const html=renderToStaticMarkup(createElement(PrepWorld,{game,onGame:()=>undefined,onNavigate:()=>undefined}));
   expect(html).toContain(e!.title);expect(html).toContain('Câu chuyện chương bảy');
  }
  expect(titles.size).toBe(7);expect(getWeekSevenEpisode(ready(52))).toBeNull();
 });
 it('offers zero-cash zero-energy fallback even after appointments',()=>{
  for(let day=45;day<=51;day++){
   const base=ready(day),poor={...base,cash:0,city:{...base.city,energy:0,minutes:1260}};
   expect(canChooseWeekSeven(poor,'meet')).toBe(false);
   expect(canChooseWeekSeven(poor,'message')).toBe(true);
   expect(getWeekSevenDecision(chooseWeekSeven(poor,'message'))).toBe('message');
  }
 });
 it('buys actual sugar once and keeps the decision after hydration',()=>{
  const before=ready(48),after=chooseWeekSeven(before,'meet');
  expect(after.cash).toBe(before.cash-15000);
  expect(after.inventory.sugar).toBe(before.inventory.sugar+5);
  const saved=JSON.parse(JSON.stringify(after)) as typeof after;
  const loaded={...saved,morning:hydrateMorning(saved.morning,{day:saved.day,city:saved.city},saved.phase)};
  expect(getWeekSevenDecision(loaded)).toBe('meet');
  expect(chooseWeekSeven(loaded,'meet')).toBe(loaded);
  expect(getWeekSevenCallback(nextDay(loaded))).toContain('Cô Hạnh');
 });
 it('remembers last chapter and gives a real fan for listening',()=>{
  const game={...ready(45),relationshipRewardIds:['week-six-44-meet']};
  expect(getWeekSevenEpisode(game)?.prompt).toContain('Bác Bình');
  const before=ready(47);
  expect(chooseWeekSeven(before,'meet').fans).toBe(before.fans+1);
 });
 it('settles a transparent group bill without double charging',()=>{
  const before=ready(50),paid=chooseWeekSeven(before,'meet');
  expect(paid.cash).toBe(before.cash-16000);
  expect(chooseWeekSeven(paid,'meet')).toBe(paid);
  expect(chooseWeekSeven(before,'message').cash).toBe(before.cash);
 });
 it('recaps family and friends, then remembers day 51 on day 52',()=>{
  const before=ready(51),after=chooseWeekSeven(before,'message');
  expect(getWeekSevenRecap(after)).toContain('không lãng phí');
  expect(getWeekSevenCallback(nextDay(after))).toContain('Mẹ');
 });
 it('rejects actions before breakfast or after opening',()=>{
  const base=ready(49),asleep={...base,morning:{...base.morning,step:'awake' as const}},open={...base,phase:'open' as const};
  expect(chooseWeekSeven(asleep,'message')).toBe(asleep);
  expect(chooseWeekSeven(open,'meet')).toBe(open);
 });
});
