import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createInitialState} from '../engine';
import {chooseBreakfast,wakeMorning,visitMorningMarket as vegetables,cookMarketMeal} from './morning';
import {visitMorningMarket as fruit} from './marketEncounter';
import {MorningMarket} from '../../components/life/MorningMarket';
import {PrepWorld} from '../../components/world/PrepWorld';
const ready=()=>chooseBreakfast(wakeMorning(createInitialState()),'skip');
describe('one coherent morning market',()=>{
  it('offers a single visit with one chat choice and both shopping paths',()=>{
    const html=renderToStaticMarkup(<MorningMarket game={ready()} onGame={()=>{}}/>);
    expect(html.match(/<button/g)).toHaveLength(4);
    expect(html.match(/Hỏi thăm cô Hạnh/g)).toHaveLength(1);
    expect(html).toContain('Mua trái cây');expect(html).toContain('Mua rau và trứng');
  });
  it('rejects a purchase without energy or time, preserving money and the daily choice',()=>{
    for(const city of [{energy:1,minutes:500},{energy:20,minutes:1255}]){
      const base=ready(),before={...base,city:{...base.city,...city}};
      const after=vegetables(before,'basket');
      expect(after.cash).toBe(before.cash);expect(after.city).toEqual(before.city);
      expect(after.morning).toEqual(before.morning);
      const html=renderToStaticMarkup(<MorningMarket game={before} onGame={()=>{}}/>);
      expect(html).toMatch(/disabled=""[^>]*><span[^>]*>🥬/);
    }
  });
  it('never grants food or finishes cooking by clamping the clock at closing time',()=>{
    const base=ready(),late={...base,city:{...base.city,minutes:1258}};
    expect(fruit(late,'fruit').cash).toBe(late.cash);
    expect(fruit(late,'fruit').morning).toEqual(late.morning);
    const bought=vegetables(base,'basket'),before={...bought,city:{...bought.city,minutes:1250}};
    expect(cookMarketMeal(before).morning.homeCooked).toBe(false);
    expect(cookMarketMeal(before).city).toEqual(before.city);
    expect(fruit(late,'leave').morning.marketVisit).toBe('leave');
  });
  it('puts opening the shop ahead of optional family calls, once only',()=>{
    const html=renderToStaticMarkup(<PrepWorld game={ready()} onGame={()=>{}} onNavigate={()=>{}}/>);
    expect(html.match(/Mở cửa tiệm/g)).toHaveLength(1);
    expect(html.indexOf('Mở cửa tiệm')).toBeLessThan(html.indexOf('Gọi bố Quang'));
  });
});
