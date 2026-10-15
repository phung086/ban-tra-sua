import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReviewsRoom } from '../../components/world/ReviewsRoom';
import { createInitialState, nextDay, replyToReview } from '../engine';
import { loadGame, saveGame } from '../storage';
import type { GameState, Review } from '../types';
import { canChooseReviewCare, chooseReviewCare, getReviewCareCallbacks, getReviewCareDecision } from './reviewCare';

const complaint: Review = {
  id: 'care-review-1', customerId: 'miu', customerName: 'Miu', day: 1,
  stars: 2, score: 50, text: 'Trà hơi ngọt',
  replyStyle: 'sweet', replyText: 'Mình xin ghi nhận nhé!',
};
function fixture(): GameState {
  const game = createInitialState();
  return { ...game, phase: 'summary', reviews: [complaint], city: { ...game.city, minutes: 900, energy: 50 } };
}
const render = (game: GameState) => renderToStaticMarkup(createElement(ReviewsRoom, {
  game, onGame: () => {}, onReset: () => {},
}));
afterEach(() => vi.unstubAllGlobals());

describe('live review care and next-day memory', () => {
  it('renders actionable review care inside the real review room', () => {
    const start = fixture();
    expect(render(start)).toContain('Hoàn lại 10.000');
    const done = chooseReviewCare(start, complaint.id, 'refund');
    expect(render(done)).toContain('Đã xử lý góp ý ngày 1');
    expect(render(done)).not.toContain('Hoàn lại 10.000');
  });

  it('unlocks follow-up only after an actual review reply', () => {
    const unanswered = { ...fixture(), reviews: [{ ...complaint, replyStyle: undefined, replyText: undefined }] };
    expect(render(unanswered)).not.toContain('Hoàn lại 10.000');
    const replied = replyToReview(unanswered, complaint.id, 'sweet');
    expect(render(replied)).toContain('Hoàn lại 10.000');
    expect(chooseReviewCare(replied, complaint.id, 'message').cash).toBe(replied.cash);
  });

  it('charges once, advances clock and records relationship effects', () => {
    const start = fixture();
    const done = chooseReviewCare(start, complaint.id, 'refund');
    expect(done.cash).toBe(start.cash - 10000);
    expect(done.city.minutes).toBe(start.city.minutes + 5);
    expect(done.city.energy).toBe(start.city.energy - 1);
    expect(done.city.goodwill).toBe(start.city.goodwill + 1);
    expect(done.customerBond.miu).toBe(start.customerBond.miu + 2);
    expect(getReviewCareDecision(done, complaint.id)).toEqual({ day: 1, choice: 'refund' });
    expect(chooseReviewCare(done, complaint.id, 'refund')).toBe(done);
    expect(chooseReviewCare(done, complaint.id, 'message')).toBe(done);
  });

  it('keeps a free, zero-time fallback when money/time/energy are depleted', () => {
    const game = fixture();
    const start = { ...game, cash: 0, city: { ...game.city, minutes: 1260, energy: 0 } };
    expect(canChooseReviewCare(start, complaint.id, 'refund')).toBe(false);
    expect(canChooseReviewCare(start, complaint.id, 'message')).toBe(false);
    expect(canChooseReviewCare(start, complaint.id, 'space')).toBe(true);
    const done = chooseReviewCare(start, complaint.id, 'space');
    expect(done.cash).toBe(0);
    expect(done.city.minutes).toBe(1260);
  });

  it('rejects open shifts, unanswered reviews and positive feedback', () => {
    const start = fixture();
    const open = { ...start, phase: 'open' as const };
    expect(chooseReviewCare(open, complaint.id, 'message')).toBe(open);
    const unanswered = { ...start, reviews: [{ ...complaint, replyText: undefined }] };
    expect(chooseReviewCare(unanswered, complaint.id, 'message')).toBe(unanswered);
    const positive = { ...start, reviews: [{ ...complaint, stars: 5 }] };
    expect(canChooseReviewCare(positive, complaint.id, 'message')).toBe(false);
  });

  it('preserves the decision through save/reload and shows next-day callback', () => {
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); },
      removeItem: (key: string) => { data.delete(key); },
    });
    const resolved = chooseReviewCare(fixture(), complaint.id, 'message');
    saveGame(resolved);
    const reloaded = loadGame();
    expect(chooseReviewCare(reloaded, complaint.id, 'refund')).toBe(reloaded);
    const tomorrow = nextDay(reloaded);
    expect(getReviewCareCallbacks(tomorrow)[0]?.name).toBe('Miu');
    expect(render(tomorrow)).toContain('Tin nhắn khách ngày mới');
    expect(render(tomorrow)).toContain('role="region"');
    expect(render(tomorrow)).toContain('Khách nhắn lại sáng nay');
    saveGame(tomorrow);
    expect(render(loadGame())).toContain('Tin nhắn khách ngày mới');
    expect(getReviewCareCallbacks(nextDay(tomorrow))).toHaveLength(0);
  });
});
