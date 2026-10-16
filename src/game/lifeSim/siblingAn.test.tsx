import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MorningRoutine } from '../../components/life/MorningRoutine';
import { createInitialState, nextDay, startDay } from '../engine';
import { chooseBreakfast, wakeMorning } from './morning';
import { loadGame, saveGame } from '../storage';
import { answerAnCall, canAnswerAnCall, canChooseAnCall, getAnCallMemory, getAnCallReply } from './siblingAn';

const ready = () => chooseBreakfast(wakeMorning(nextDay(createInitialState())), 'skip');

describe('playable sibling An bus call', () => {
  const storage = new Map<string, string>();
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('appears only after breakfast in the actual pre-shop UI, with a free fallback', () => {
    const day2 = nextDay(createInitialState());
    expect(canAnswerAnCall(day2)).toBe(false);
    expect(renderToStaticMarkup(<MorningRoutine game={day2} onGame={() => {}} />)).not.toContain('Chỉ An chuyến xe kế tiếp');
    const game = chooseBreakfast(wakeMorning(day2), 'skip');
    const html = renderToStaticMarkup(<MorningRoutine game={game} onGame={() => {}} />);
    expect(html).toContain('Chỉ An chuyến xe kế tiếp');
    expect(html).toContain('Nhắn sẽ hỏi thăm sau ca');
    expect(html).not.toContain('Mở cửa tiệm');
  });

  it('deducts money and minutes exactly once and remembers An across the next day', () => {
    const game = ready();
    const result = answerAnCall(game, 'fare');
    expect(result.cash).toBe(game.cash - 12000);
    expect(result.city.minutes).toBe(game.city.minutes + 5);
    expect(result.customerBond['family-sibling-an']).toBe(2);
    expect(result.city.journal[0]).toContain('An');
    expect(getAnCallMemory(result)).toEqual({ day: 2, choice: 'fare' });
    expect(answerAnCall(result, 'fare')).toBe(result);
    const tomorrow = nextDay(result);
    expect(tomorrow.day).toBe(3);
    expect(getAnCallReply(tomorrow)).toContain('kịp tiết học');
    expect(canAnswerAnCall(tomorrow)).toBe(false);
  });

  it('offers a free guidance option with energy cost and a distinct callback', () => {
    const game = ready();
    const result = answerAnCall(game, 'guide');
    expect(result.cash).toBe(game.cash);
    expect(result.city.energy).toBe(game.city.energy - 1);
    expect(result.city.minutes).toBe(game.city.minutes + 10);
    expect(result.customerBond['family-sibling-an']).toBe(1);
    expect(getAnCallReply(nextDay(result))).toContain('tuyến mới');
  });

  it('cannot overspend, cannot exceed the city clock and always has a no-cost exit', () => {
    const broke = { ...ready(), cash: 0, city: { ...ready().city, energy: 0, minutes: 1260 } };
    expect(canChooseAnCall(broke, 'fare')).toBe(false);
    expect(canChooseAnCall(broke, 'guide')).toBe(false);
    expect(canChooseAnCall(broke, 'later')).toBe(true);
    const blocked = answerAnCall(broke, 'fare');
    expect(blocked.cash).toBe(0);
    expect(getAnCallMemory(blocked)).toBeNull();
    const later = answerAnCall(blocked, 'later');
    expect(later.cash).toBe(0);
    expect(later.city.minutes).toBe(1260);
    expect(later.city.energy).toBe(0);
    expect(getAnCallReply(nextDay(later))).toContain('tự tìm được đường');
  });

  it('survives v3 save/load without replaying reward or payment', () => {
    const result = answerAnCall(ready(), 'fare');
    saveGame(result);
    const loaded = loadGame();
    expect(getAnCallMemory(loaded)).toEqual({ day: 2, choice: 'fare' });
    expect(loaded.cash).toBe(result.cash);
    expect(loaded.customerBond['family-sibling-an']).toBe(2);
    expect(answerAnCall(loaded, 'fare')).toBe(loaded);
    const tomorrow = nextDay(loaded);
    const afterBreakfast = chooseBreakfast(wakeMorning(tomorrow), 'skip');
    const html = renderToStaticMarkup(<MorningRoutine game={afterBreakfast} onGame={() => {}} />);
    expect(html).toContain('kịp tiết học');
    expect(html).not.toContain('Gửi An tiền xe buýt');
  });

  it('does not interrupt the tea shift or repeat on later days', () => {
    const game = ready();
    const open = startDay(game);
    expect(answerAnCall(open, 'later')).toBe(open);
    const chosen = answerAnCall(game, 'later');
    const late = nextDay(nextDay(chosen));
    expect(getAnCallReply(late)).toBeNull();
    expect(canAnswerAnCall(late)).toBe(false);
    expect(answerAnCall(late, 'fare')).toBe(late);
  });
});
