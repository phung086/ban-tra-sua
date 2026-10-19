import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInitialState, nextDay, startDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { chooseHa, haChoice, haYesterdayReply } from './neighborHa';
import { NeighborHaPanel } from '../../components/life/NeighborHaPanel';
import { loadGame, saveGame } from '../storage';

const ready = () => chooseBreakfast(wakeMorning(createInitialState()), 'skip');

afterEach(() => vi.unstubAllGlobals());

describe('neighbor Ha low-cash breakfast vertical slice', () => {
  it('gives a real meal after help, with exact time/energy/goodwill cost, never cash', () => {
    const initial = { ...ready(), cash: 0 };
    const next = chooseHa(initial, 'help');
    expect(next.cash).toBe(0);
    expect(next.city.minutes).toBe(initial.city.minutes + 12);
    expect(next.city.energy).toBe(initial.city.energy - 3);
    expect(next.city.goodwill).toBe(initial.city.goodwill + 1);
    expect(next.morning.satiety).toBe(initial.morning.satiety + 25);
    expect(next.customerBond['neighbor-ha']).toBe(1);
    expect(haChoice(next)).toBe('help');
    expect(chooseHa(next, 'help')).toBe(next);
    expect(chooseHa(next, 'chat')).toBe(next);
  });

  it('offers a no-cost chat fallback when too tired, and blocks after opening', () => {
    const tired = { ...ready(), city: { ...ready().city, energy: 0 } };
    expect(chooseHa(tired, 'help').city.energy).toBe(0);
    expect(haChoice(chooseHa(tired, 'help'))).toBeNull();
    const chat = chooseHa(tired, 'chat');
    expect(chat.city.minutes).toBe(tired.city.minutes + 4);
    expect(chat.morning.satiety).toBe(tired.morning.satiety);
    expect(chat.cash).toBe(tired.cash);
    expect(haChoice(chat)).toBe('chat');
    expect(chooseHa(startDay(ready()), 'help').city.stories.choices).not.toContain('neighbor-ha:1:help');
  });

  it('guards time budget, breakfast prerequisites and non-hungry mornings', () => {
    const initial = createInitialState();
    expect(chooseHa(initial, 'help')).toBe(initial);
    const late = { ...ready(), city: { ...ready().city, minutes: 1255 } };
    expect(haChoice(chooseHa(late, 'help'))).toBeNull();
    const fed = chooseBreakfast(wakeMorning(createInitialState()), 'street');
    expect(chooseHa(fed, 'help')).toBe(fed);
  });

  it('survives actual v3 save/reload and remembers the choice on the next day', () => {
    const memory = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
      removeItem: (key: string) => { memory.delete(key); },
    });
    const helped = chooseHa(ready(), 'help');
    saveGame(helped);
    const restored = loadGame();
    expect(haChoice(restored)).toBe('help');
    expect(restored.morning.satiety).toBe(helped.morning.satiety);
    expect(restored.city.energy).toBe(helped.city.energy);
    expect(chooseHa(restored, 'help')).toBe(restored);
    const tomorrow = nextDay(restored);
    expect(tomorrow.day).toBe(restored.day + 1);
    expect(haYesterdayReply(tomorrow)).toContain('nhớ hôm qua');
    expect(haChoice(tomorrow)).toBeNull();
    const nextMorning = chooseBreakfast(wakeMorning(tomorrow), 'skip');
    expect(chooseHa(nextMorning, 'chat').city.stories.choices).toContain(`neighbor-ha:${tomorrow.day}:chat`);
  });

  it('renders reachable buttons and a persisted response in the morning UI', () => {
    const before = renderToStaticMarkup(<NeighborHaPanel game={ready()} onGame={() => {}} />);
    expect(before).toContain('Bữa cơm của chị Hà');
    expect(before).toContain('Phụ chị Hà chuyển thùng rau');
    expect(before).toContain('Ngồi trò chuyện một chút');
    const after = renderToStaticMarkup(<NeighborHaPanel game={chooseHa(ready(), 'help')} onGame={() => {}} />);
    expect(after).toContain('Đã lưu, không nhận hai lần');
    expect(after).not.toContain('Phụ chị Hà chuyển thùng rau');
  });
});
