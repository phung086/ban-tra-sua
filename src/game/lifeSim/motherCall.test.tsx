import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInitialState, nextDay, startDay } from '../engine';
import { hydrateCity } from '../city';
import { MorningRoutine } from '../../components/life/MorningRoutine';
import { chooseBreakfast, chooseMotherCall, hydrateMorning, motherCallDecision, motherCallMemory, motherCallPrompt, shouldOfferMotherCall, wakeMorning } from './morning';

const ready = () => chooseBreakfast(wakeMorning(createInitialState()), 'skip');

describe('playable family call with mother Mai', () => {
  it('renders three actionable family choices after breakfast on day one', () => {
    const markup = renderToStaticMarkup(<MorningRoutine game={ready()} onGame={() => {}} />);
    expect(markup).toContain('Cuộc gọi từ mẹ Mai');
    expect(markup).toContain('Nghe mẹ kể chuyện');
    expect(markup).toContain('Hẹn cuối tuần về ăn cơm');
    expect(markup).toContain('Nhắn mẹ tối gọi lại');
  });
  it('spends time, never charges money, and records the call once', () => {
    const initial = ready();
    const talked = chooseMotherCall(initial, 'listen');
    expect(talked.cash).toBe(initial.cash);
    expect(talked.city.minutes).toBe(Math.min(1260, initial.city.minutes + 10));
    expect(motherCallMemory(talked).bond).toBe(2);
    expect(talked.city.stories.choices).toContain('family-mother-mai:1:listen');
    expect(talked.city.journal[0]).toContain('Gọi mẹ Mai');
    expect(chooseMotherCall(talked, 'listen')).toBe(talked);
    expect(chooseMotherCall(talked, 'promise')).toBe(talked);
  });
  it('has a zero-cost zero-minute fallback when cash is empty', () => {
    const poor = { ...ready(), cash: 0 };
    const later = chooseMotherCall(poor, 'later');
    expect(later.cash).toBe(0);
    expect(later.city.minutes).toBe(poor.city.minutes);
    expect(later.morning.motherCall).toBe('later');
  });
  it('migrates old v3 saves and rejects double calls after hydration', () => {
    const original = ready();
    const oldMorning = { ...original.morning };
    delete oldMorning.motherCall;
    expect(hydrateMorning(oldMorning, {day:original.day,city:original.city},'prep').motherCall).toBeNull();
    const called = chooseMotherCall(original, 'promise');
    const saved = JSON.parse(JSON.stringify(called));
    const city = hydrateCity(saved.city, called.day);
    const morning = hydrateMorning(saved.morning,{day:called.day,city},'prep');
    const restored = { ...called, city, morning };
    expect(motherCallMemory(restored).promised).toBe(true);
    expect(chooseMotherCall(restored, 'listen')).toBe(restored);
    expect(renderToStaticMarkup(<MorningRoutine game={restored} onGame={()=>{}} />)).toContain('Cuối tuần');
    expect(hydrateMorning({...saved.morning,motherCall:'invalid'}, {day:called.day,city},'prep').motherCall).toBeNull();
    const partial = { ...restored, morning:{...morning,motherCall:null} };
    expect(motherCallDecision(partial)).toBe('promise');
    expect(chooseMotherCall(partial,'listen')).toBe(partial);
    expect(renderToStaticMarkup(<MorningRoutine game={partial} onGame={()=>{}} />)).not.toContain('Nghe mẹ kể chuyện');
  });
  it('remembers a promise on later days and changes dialogue', () => {
    const first = chooseMotherCall(ready(), 'promise');
    const tomorrow = nextDay(first);
    expect(tomorrow.morning.motherCall).toBeNull();
    expect(motherCallMemory(tomorrow).bond).toBe(1);
    expect(motherCallPrompt(tomorrow)).toContain('Mẹ nhớ con hẹn');
    const third = nextDay(tomorrow);
    expect(shouldOfferMotherCall(third.morning)).toBe(true);
    const called = chooseMotherCall(chooseBreakfast(wakeMorning(third),'skip'),'listen');
    expect(motherCallMemory(called).bond).toBe(3);
  });
  it('does not interrupt an active shift or allow calling before breakfast', () => {
    const initial = createInitialState();
    expect(chooseMotherCall(initial,'listen')).toBe(initial);
    expect(chooseMotherCall(wakeMorning(initial),'listen').morning.motherCall).toBeNull();
    const open = startDay(ready());
    expect(chooseMotherCall(open,'listen')).toBe(open);
  });
});
