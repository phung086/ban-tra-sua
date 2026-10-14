import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrepWorld } from '../../components/world/PrepWorld';
import { createInitialState } from '../engine';
import { wakeMorning } from './morning';
import { beginBreakfastCooking, finishBreakfastCooking } from './breakfastCooking';

const html = (game: ReturnType<typeof createInitialState>) =>
  renderToStaticMarkup(createElement(PrepWorld, {
    game, onGame: () => undefined, onNavigate: () => undefined,
  }));

describe('breakfast cooking mounted in playable PrepWorld', () => {
  it('shows the preparation action after waking up', () => {
    const game = wakeMorning(createInitialState());
    expect(html(game)).toContain('Bếp sáng tại nhà');
    expect(html(game)).toContain('Vo gạo, chuẩn bị chảo');
    expect(html(game)).toContain('Mở cửa tiệm');
  });

  it('offers two real heat choices after preparation', () => {
    const game = beginBreakfastCooking(wakeMorning(createInitialState()));
    const screen = html(game);
    expect(screen).toContain('Chọn lửa nấu');
    expect(screen).toContain('Lửa nhỏ');
    expect(screen).toContain('Lửa vừa');
    expect(screen).toContain('Tiến độ nấu bữa sáng');
  });

  it('returns to the shop-opening flow after cooking and keeps satiety visible', () => {
    const game = finishBreakfastCooking(beginBreakfastCooking(wakeMorning(createInitialState())), 'gentle');
    const screen = html(game);
    expect(screen).not.toContain('Bếp sáng tại nhà');
    expect(screen).toContain('Độ no 90/100');
    expect(screen).toContain('Mở cửa tiệm');
  });
});
