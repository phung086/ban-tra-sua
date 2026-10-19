import type { GameState } from '../types';
import { morningActionBlock } from './morningAction';

const PREFIX = 'hanh-market-help:';
const PROMISE = PREFIX + 'promise:';
const RESOLVED = PREFIX + 'resolved:';

export type HanhHelpChoice = 'carry' | 'bags' | 'apologize';

export const HANH_HELP_OPTIONS = {
  carry: {
    label: 'Phụ cô Hạnh xếp sạp',
    cost: 0, minutes: 14, energy: 7, bond: 2,
    description: 'Cô Hạnh: “Có cháu phụ nên cô kịp mở hàng. Cảm ơn nhé!”',
  },
  bags: {
    label: 'Mua túi giấy giúp cô',
    cost: 9000, minutes: 6, energy: 0, bond: 1,
    description: 'Cô Hạnh: “Đúng thứ cô đang thiếu. Để cô nhớ phần tốt cho cháu!”',
  },
  apologize: {
    label: 'Nói thật hôm nay không giúp được',
    cost: 0, minutes: 0, energy: 0, bond: -1,
    description: 'Cô Hạnh: “Không sao, lần sau đừng hứa vội nhé.”',
  },
} as const;

export interface HanhHelpPromise {
  promisedDay: number;
  dueDay: number;
  overdue: boolean;
}

function promises(game: Pick<GameState, 'relationshipRewardIds'>): number[] {
  return game.relationshipRewardIds
    .filter(id => id.startsWith(PROMISE))
    .map(id => Number(id.slice(PROMISE.length)))
    .filter(day => Number.isSafeInteger(day) && day > 0);
}

function resolved(game: Pick<GameState, 'relationshipRewardIds'>, day: number): boolean {
  return game.relationshipRewardIds.some(id => id.startsWith(RESOLVED + day + ':'));
}

/** Ledger survives sleep and v3 save/reload without a new save field. */
export function pendingHanhHelp(game: Pick<GameState, 'day' | 'relationshipRewardIds'>): HanhHelpPromise | null {
  const day = promises(game).filter(value => value < game.day && !resolved(game, value)).sort((a, b) => a - b)[0];
  return day === undefined ? null : { promisedDay: day, dueDay: day + 1, overdue: game.day > day + 1 };
}

export function canPromiseHanhHelp(game: GameState): boolean {
  const latest = Math.max(0, ...promises(game));
  return game.phase === 'prep' && game.morning.day === game.day &&
    game.morning.step === 'finished' && game.morning.marketVisit === 'chat' &&
    (latest === 0 || game.day - latest >= 3) && !pendingHanhHelp(game);
}

export function promiseHanhHelp(game: GameState): GameState {
  if (!canPromiseHanhHelp(game)) return game;
  const reply = 'Cô Hạnh: “Mai cháu rảnh thì ghé phụ cô xếp sạp nhé. Bận cứ nói thật, cô không giận.”';
  return {
    ...game,
    relationshipRewardIds: [...game.relationshipRewardIds, PROMISE + game.day],
    city: {
      ...game.city,
      journal: [`Ngày ${game.day} · Hẹn mai phụ cô Hạnh xếp sạp.`, ...game.city.journal].slice(0, 24),
    },
    notice: reply,
  };
}

export function hanhHelpBlock(game: GameState, choice: HanhHelpChoice): string | null {
  const option = HANH_HELP_OPTIONS[choice];
  if (!option) return 'Lựa chọn không hợp lệ.';
  return morningActionBlock(game, option.cost, option.minutes, option.energy);
}

export function resolveHanhHelp(game: GameState, choice: HanhHelpChoice): GameState {
  if (game.phase !== 'prep' || game.morning.day !== game.day ||
      game.morning.step !== 'finished') return game;
  const pending = pendingHanhHelp(game);
  if (!pending) return game;
  const option = HANH_HELP_OPTIONS[choice];
  if (!option) return game;
  if (![game.cash, game.city.minutes, game.city.energy].every(Number.isFinite)) return game;
  const blocked = hanhHelpBlock(game, choice);
  if (blocked) return { ...game, notice: blocked };
  const bond = Math.max(0, Math.min(1000, (game.city.stories.bonds.hanh ?? 0) + option.bond));
  const reply = pending.overdue
    ? 'Cô Hạnh: “Cô tưởng cháu quên lời hẹn rồi.” ' + option.description
    : option.description;
  return {
    ...game,
    cash: game.cash - option.cost,
    relationshipRewardIds: [
      ...game.relationshipRewardIds,
      `${RESOLVED}${pending.promisedDay}:${choice}:${game.day}`,
    ],
    city: {
      ...game.city,
      minutes: game.city.minutes + option.minutes,
      energy: game.city.energy - option.energy,
      stories: {
        ...game.city.stories,
        bonds: { ...game.city.stories.bonds, hanh: bond },
      },
      journal: [
        `Ngày ${game.day} · Lời hẹn cô Hạnh: ${option.label} (${option.cost.toLocaleString('vi-VN')} ₫).`,
        ...game.city.journal,
      ].slice(0, 24),
    },
    notice: reply,
  };
}

export function hanhHelpResolvedToday(game: Pick<GameState, 'day' | 'relationshipRewardIds'>): boolean {
  return game.relationshipRewardIds.some(id =>
    id.startsWith(RESOLVED) && id.endsWith(':' + game.day));
}
