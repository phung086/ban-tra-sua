import { describe, expect, it } from 'vitest';
import { isLowSugarFeedback } from './reviewCare';
import type { Review } from '../types';

const review: Review = {
  id: 'feedback-test', customerId: 'miu', customerName: 'Miu',
  day: 1, stars: 2, score: 50, text: 'Trà hơi ngọt',
};

describe('customer feedback context', () => {
  it('only learns low sugar from an explicit sweetness complaint', () => {
    expect(isLowSugarFeedback(review)).toBe(true);
    expect(isLowSugarFeedback({ ...review, text: 'Topping chưa đúng đơn' })).toBe(false);
    expect(isLowSugarFeedback({ ...review, text: 'Trà không đủ ngọt' })).toBe(false);
  });
});
