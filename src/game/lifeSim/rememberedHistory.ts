import type { GameState } from '../types';

/**
 * Compact, append-only outcomes survive the 24-entry storyLog display limit.
 * Each result belongs to a specific customer, order and game day. Existing v3
 * saves without markers still replay their visible delivery stories.
 */
const PREFIX = 'remembered-outcome:';

export function rememberedOutcomeId(
  customerId: string, orderId: string, day: number, correct: boolean,
): string {
  return PREFIX + encodeURIComponent(customerId) + ':' +
    encodeURIComponent(orderId) + ':' + day + ':' + (correct ? 'good' : 'bad');
}

export function rememberedDeliveryHistory(
  game: GameState, customerId: string,
): { day: number; correct: boolean; orderId: string }[] {
  type Entry = { day: number; correct: boolean; orderId: string; source: number; index: number };
  const marked = new Set<string>();
  const persisted: Entry[] = [];
  const customerKey = encodeURIComponent(customerId);

  // relationshipRewardIds are appended in actual delivery order, oldest first.
  for (const [index, id] of game.relationshipRewardIds.entries()) {
    if (!id.startsWith(PREFIX)) continue;
    const parts = id.slice(PREFIX.length).split(':');
    if (parts.length !== 4 || parts[0] !== customerKey || !parts[1] ||
        !/^\d+$/.test(parts[2]) || (parts[3] !== 'good' && parts[3] !== 'bad')) continue;
    const day = Number(parts[2]);
    if (!Number.isSafeInteger(day) || day < 1 || day >= game.day ||
        marked.has(parts[1])) continue;
    marked.add(parts[1]);
    persisted.push({ day, correct: parts[3] === 'good', orderId: parts[1], source: 1, index });
  }

  const legacySeen = new Set<string>();
  const legacy: Entry[] = [];
  // storyLog is newest-first; reverse before replaying same-day visits.
  for (const [index, moment] of [...game.storyLog].reverse().entries()) {
    if (moment.customerId !== customerId || !Number.isSafeInteger(moment.day) ||
        moment.day < 1 || moment.day >= game.day ||
        !moment.id.startsWith('remembered-service:') ||
        (moment.title !== 'Khách quen góp ý thêm' && moment.title !== 'Khách quen hài lòng')) continue;
    const orderId = moment.id.slice('remembered-service:'.length);
    if (!orderId || marked.has(orderId) || legacySeen.has(orderId)) continue;
    legacySeen.add(orderId);
    legacy.push({ day: moment.day, correct: moment.title === 'Khách quen hài lòng',
      orderId: encodeURIComponent(orderId), source: 0, index });
  }

  // On a migration day, legacy callbacks precede new persistent markers.
  return [...legacy, ...persisted]
    .sort((a, b) => a.day - b.day || a.source - b.source || a.index - b.index)
    .map(({ day, correct, orderId }) => ({ day, correct, orderId }));
}
