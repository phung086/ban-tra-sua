import type { GameState } from '../types';
import { morningActionBlock } from './morningAction';

const PREFIX = 'hanh-market-help:';
const PROMISE = PREFIX + 'promise:';
const RESOLVED = PREFIX + 'resolved:';
const POSTPONED = PREFIX + 'postponed:';

export type HanhHelpChoice = 'carry' | 'bags' | 'labels' | 'apologize';

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
  labels: {
    label: 'Viết bảng giá giúp cô',
    cost: 0, minutes: 10, energy: 1, bond: 1,
    description: 'Cô Hạnh: “Bảng giá rõ ràng thế này khách dễ chọn hơn. Cảm ơn cháu nhé!”',
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
  postponed: boolean;
}

function postponed(game: Pick<GameState, 'relationshipRewardIds'>, promisedDay: number): boolean {
  return game.relationshipRewardIds.includes(`${POSTPONED}${promisedDay}:${promisedDay + 1}`);
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
  if (day === undefined) return null;
  const moved = postponed(game, day);
  const dueDay = day + (moved ? 2 : 1);
  return { promisedDay: day, dueDay, overdue: game.day > dueDay, postponed: moved };
}

export function canPromiseHanhHelp(game: GameState): boolean {
  const latest = Math.max(0, ...promises(game));
  return game.phase === 'prep' && game.morning.day === game.day &&
    game.morning.step === 'finished' && game.morning.marketVisit === 'chat' &&
    (latest === 0 || game.day - latest >= 3) && !pendingHanhHelp(game);
}

/** Move one promise one day; persisted in save-v3 reward ledger. */
export function canPostponeHanhHelp(game: GameState): boolean {
  const pending = pendingHanhHelp(game);
  return game.phase === 'prep' && game.morning.day === game.day &&
    game.morning.step === 'finished' && pending !== null &&
    !pending.postponed && pending.dueDay === game.day &&
    [game.city.minutes, game.city.energy, game.cash].every(Number.isFinite) &&
    morningActionBlock(game, 0, 2) === null;
}

export function postponeHanhHelp(game: GameState): GameState {
  if (!canPostponeHanhHelp(game)) return game;
  const pending = pendingHanhHelp(game)!;
  const dueDay = game.day + 1;
  return {
    ...game,
    relationshipRewardIds: [...game.relationshipRewardIds,
      `${POSTPONED}${pending.promisedDay}:${game.day}`],
    city: {
      ...game.city,
      minutes: game.city.minutes + 2,
      stories: {
        ...game.city.stories,
        bonds: { ...game.city.stories.bonds,
          hanh: Math.max(0, (game.city.stories.bonds.hanh ?? 0) - 1) },
      },
      journal: [`Ngày ${game.day} · Báo cô Hạnh dời lời hẹn sang ngày ${dueDay} (2 phút, -1 thân thiết).`,
        ...game.city.journal].slice(0, 24),
    },
    notice: `Cô Hạnh: “Mai cháu ghé cũng được, cảm ơn đã báo trước. Cô chờ ngày ${dueDay} nhé.”`,
  };
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
  if (!pending || (pending.postponed && game.day < pending.dueDay)) return game;
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

/** A saved promise resolution can change the next market greeting, without new rewards. */
export function hanhHelpLastResolution(
  game: Pick<GameState, 'day' | 'relationshipRewardIds'>,
): { promisedDay: number; resolvedDay: number; choice: HanhHelpChoice; overdue: boolean; postponed: boolean } | null {
  const records = game.relationshipRewardIds.flatMap(id => {
    const match = /^hanh-market-help:resolved:(\d+):(carry|bags|labels|apologize):(\d+)$/.exec(id);
    if (!match) return [];
    const promisedDay = Number(match[1]);
    const resolvedDay = Number(match[3]);
    if (!Number.isSafeInteger(promisedDay) || !Number.isSafeInteger(resolvedDay) ||
        promisedDay < 1 || resolvedDay <= promisedDay || resolvedDay >= game.day ||
        !game.relationshipRewardIds.includes(`hanh-market-help:promise:${promisedDay}`)) return [];
    const moved = postponed(game, promisedDay);
    return [{ promisedDay, resolvedDay, choice: match[2] as HanhHelpChoice,
      overdue: resolvedDay > promisedDay + (moved ? 2 : 1), postponed: moved }];
  });
  records.sort((a, b) => b.resolvedDay - a.resolvedDay || b.promisedDay - a.promisedDay);
  return records[0] ?? null;
}

/** Read-only NPC memory; old save-v3 ledgers remain compatible. */
export function hanhHelpFollowup(game: Pick<GameState, 'day' | 'relationshipRewardIds'>): string | null {
  const last = hanhHelpLastResolution(game);
  if (!last || game.day - last.resolvedDay > 3) return null;
  if (last.choice === 'apologize')
    return 'Cô Hạnh: “Hôm trước cháu nói không giúp được. Cô hiểu, lần sau cứ báo sớm là được.”';
  if (last.overdue)
    return 'Cô Hạnh: “Cháu đến muộn nhưng vẫn quay lại giúp, cô ghi nhận điều đó.”';
  if (last.postponed)
    return 'Cô Hạnh: “Hôm trước cháu báo dời hẹn, rồi vẫn quay lại đúng ngày. Cô quý điều đó.”';
  if (last.choice === 'carry')
    return 'Cô Hạnh: “Nhờ hôm trước cháu xếp sạp, cô đỡ cuống hẳn. Hôm nay cứ thong thả chọn hàng nhé.”';
  if (last.choice === 'labels')
    return 'Cô Hạnh: “Bảng giá cháu viết hôm trước khách khen dễ đọc. Cô cảm ơn cháu!”';
  return 'Cô Hạnh: “Mấy chiếc túi giấy hôm trước dùng vừa khéo. Cô cảm ơn cháu lần nữa.”';
}

/** One-day discount for a kept promise; no reward for late help or apology. */
export function hanhFruitDiscount(
  game: Pick<GameState, 'day' | 'relationshipRewardIds'>,
): number {
  const last = hanhHelpLastResolution(game);
  if (!last || last.overdue || game.day !== last.resolvedDay + 1) return 0;
  return last.choice === 'carry' ? 2000 :
    last.choice === 'bags' || last.choice === 'labels' ? 1000 : 0;
}

export function hanhHelpResolvedToday(game: Pick<GameState, 'day' | 'relationshipRewardIds'>): boolean {
  return game.relationshipRewardIds.some(id =>
    id.startsWith(RESOLVED) && id.endsWith(':' + game.day));
}
