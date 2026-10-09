/**
 * T1-03: pure, strict validation for authored life-simulation episodes.
 * This module does not mount content in the game or mutate a save.
 */
export type EpisodeArc = 'opening' | 'friendship' | 'family' | 'responsibility' | 'recovery' | 'travel' | 'endless';
export type EpisodePhase = 'waking' | 'morning' | 'shop' | 'social' | 'street' | 'evening' | 'sleep';
export type EpisodePredicateOp = 'day-eq' | 'day-at-least' | 'day-at-most' | 'min-cash' | 'has-flag' | 'has-item' | 'trust-at-least';
export type EpisodeEffectType = 'money' | 'inventory' | 'need' | 'mood' | 'health' | 'trust' | 'flag' | 'schedule' | 'bill' | 'location' | 'unlock';

export interface EpisodePredicate {
  op: EpisodePredicateOp;
  key?: string;
  value?: number | boolean;
  quantity?: number;
}
export interface EpisodeEffect {
  type: EpisodeEffectType;
  key: string;
  ledgerKey: string;
  delta?: number;
  value?: boolean | string;
}
export interface EpisodeBeat {
  id: string;
  phase: EpisodePhase;
  timeWindow: [number, number];
  condition: EpisodePredicate[];
  localizedText: string;
  actions: string[];
  optional: boolean;
  failForward: string | null;
  exit: string | null;
  maxAttempts?: number;
}
export interface EpisodeChoice {
  id: string;
  text: string;
  condition: EpisodePredicate[];
  consequences: EpisodeEffect[];
  next: string;
}
export interface EpisodeChoiceNode {
  id: string;
  beatId: string;
  choices: EpisodeChoice[];
  fallbackNext?: string;
}
export interface EpisodeDefinition {
  schemaVersion: 1;
  id: string;
  version: number;
  title: string;
  arc: EpisodeArc;
  priority: number;
  cooldownDays: number;
  eligible: EpisodePredicate[];
  places: string[];
  characters: string[];
  beats: EpisodeBeat[];
  choices: EpisodeChoiceNode[];
  endings: string[];
  transitions: EpisodeEffect[];
  assetBundle?: string | null;
  fallback?: { id: string; reason: string };
}
export type EpisodeValidation = { ok: true; errors: []; episode: EpisodeDefinition } | { ok: false; errors: string[] };

const ARCS = new Set<string>(['opening', 'friendship', 'family', 'responsibility', 'recovery', 'travel', 'endless']);
const PHASES = new Set<string>(['waking', 'morning', 'shop', 'social', 'street', 'evening', 'sleep']);
const ACTIONS = new Set<string>(['wake', 'eat', 'cook', 'buyFood', 'buyGroceries', 'openShop', 'serve', 'travel', 'talk', 'acceptInvite', 'shareBill', 'visitClinic', 'payBill', 'sleep', 'eatOut', 'rest', 'closeShop', 'deliver']);
const OPS = new Set<string>(['day-eq', 'day-at-least', 'day-at-most', 'min-cash', 'has-flag', 'has-item', 'trust-at-least']);
const EFFECTS = new Set<string>(['money', 'inventory', 'need', 'mood', 'health', 'trust', 'flag', 'schedule', 'bill', 'location', 'unlock']);
const validEnum = (options: Set<string>, value: unknown): value is string =>
  typeof value === 'string' && options.has(value);
const NEEDS = new Set<string>(['satiety', 'energy', 'hygiene', 'mood', 'stress', 'social', 'health']);
const STABLE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/;
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const stableId = (value: unknown): value is string => typeof value === 'string' && STABLE_ID.test(value);
const label = (value: unknown, max = 400): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const integer = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;

/** Reject non-JSON objects before graph traversal or outcome fingerprinting.
 * Iterative traversal prevents circular input, getters and deep nesting from crashing validation.
 * Shared subtrees are allowed, but ancestor cycles are rejected.
 */
function nonJsonReason(root: unknown): string | null {
  const pending: Array<{ value: unknown; depth: number; exit?: boolean }> = [{ value: root, depth: 0 }];
  const active = new WeakSet<object>();
  let nodes = 0;
  try {
    while (pending.length) {
      const { value, depth, exit } = pending.pop()!;
      if (exit) { if (typeof value === 'object' && value !== null) active.delete(value); continue; }
      if (depth > 48) return 'nesting exceeds 48 levels';
      if (value === null || typeof value === 'boolean') continue;
      if (typeof value === 'string') {
        if (value.length > 16000) return 'text exceeds 16000 characters';
        continue;
      }
      if (typeof value === 'number') {
        if (!Number.isFinite(value)) return 'non-finite number';
        continue;
      }
      if (typeof value !== 'object') return 'non-JSON value';
      if (active.has(value)) return 'cyclic object reference';
      active.add(value);
      pending.push({ value, depth, exit: true });
      if (++nodes > 10000) return 'object tree exceeds 10000 nodes';
      if (!Array.isArray(value)) {
        const prototype = Object.getPrototypeOf(value);
        if (prototype !== Object.prototype && prototype !== null) return 'non-plain object';
      }
      const descriptors = Object.getOwnPropertyDescriptors(value);
      const isArray = Array.isArray(value);
      // JSON arrays must be dense and have no named properties. Checking only
      // Object.keys(...).length can miss a hole hidden by an extra property.
      if (isArray && Object.keys(value).length !== value.length)
        return 'sparse or extended array';
      for (const key of Reflect.ownKeys(descriptors)) {
        if (typeof key !== 'string') return 'symbol property';
        const descriptor = descriptors[key];
        if (!('value' in descriptor)) return 'accessor property';
        if (isArray) {
          if (key === 'length') continue; // intrinsic non-enumerable array length
          const index = Number(key);
          if (!Number.isSafeInteger(index) || index < 0 || index >= value.length || String(index) !== key)
            return 'non-index array property';
        } else if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return 'unsafe object key';
        }
        // JSON round-trips discard hidden properties; reject them rather than
        // validating a different object from the one the reducer would receive.
        if (!descriptor.enumerable) return 'non-enumerable property';
        pending.push({ value: descriptor.value, depth: depth + 1 });
      }
    }
    return null;
  } catch {
    return 'uninspectable input';
  }
}

/** Validates unknown JSON without eval, mutation, or throwing on malformed input. */
export function validateEpisode(input: unknown): EpisodeValidation {
  const errors: string[] = [];
  const fail = (path: string, message: string) => { errors.push(`${path}: ${message}`); };
  if (!record(input)) return { ok: false, errors: ['episode: expected object'] };
  const nonJson = nonJsonReason(input);
  if (nonJson) return { ok: false, errors: ['episode: invalid JSON tree (' + nonJson + ')'] };

  if (input.schemaVersion !== 1) fail('schemaVersion', 'unsupported version');
  if (!stableId(input.id)) fail('id', 'invalid stable ID');
  if (!integer(input.version, 1, 100000)) fail('version', 'expected positive integer');
  if (!label(input.title, 120)) fail('title', 'missing localized title');
  if (!validEnum(ARCS, input.arc)) fail('arc', 'unknown arc');
  if (!integer(input.priority, 0, 100000)) fail('priority', 'invalid priority');
  if (!integer(input.cooldownDays, 0, 100000)) fail('cooldownDays', 'invalid cooldown');
  if (input.assetBundle != null && !stableId(input.assetBundle)) fail('assetBundle', 'invalid manifest ID');
  if (input.fallback !== undefined &&
      (!record(input.fallback) || !stableId(input.fallback.id) || !label(input.fallback.reason)))
    fail('fallback', 'expected safe fallback ID and reason');

  const predicates = (value: unknown, path: string) => {
    if (!Array.isArray(value)) { fail(path, 'expected predicate array'); return; }
    if (value.length > 128) { fail(path, 'exceeds 128 entries'); return; }
    value.forEach((item: unknown, i: number) => {
      const at = `${path}[${i}]`;
      if (!record(item) || !validEnum(OPS, item.op)) { fail(at, 'unknown predicate'); return; }
      if (['day-eq', 'day-at-least', 'day-at-most'].includes(String(item.op)) &&
          !integer(item.value, 1, Number.MAX_SAFE_INTEGER)) fail(at, 'day must be positive integer');
      if (item.op === 'min-cash' && !integer(item.value, 0, 1_000_000_000)) fail(at, 'invalid VND threshold');
      if (item.op === 'has-flag' && (!stableId(item.key) || typeof item.value !== 'boolean'))
        fail(at, 'flag requires key and boolean');
      if (item.op === 'has-item' && (!stableId(item.key) || !integer(item.quantity, 1, 100000)))
        fail(at, 'item requires key and quantity');
      if (item.op === 'trust-at-least' && (!stableId(item.key) || !integer(item.value, -100, 100)))
        fail(at, 'trust requires key and bounded value');
    });
  };
  const idArray = (value: unknown, path: string, allowEmpty = false) => {
    if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
      fail(path, 'expected ID array'); return;
    }
    if (value.length > 128) { fail(path, 'exceeds 128 IDs'); return; }
    const seen = new Set<string>();
    for (const item of value) {
      if (!stableId(item)) fail(path, 'invalid ID');
      else if (seen.has(item)) fail(path, `duplicate ID ${item}`);
      else seen.add(item);
    }
  };
  predicates(input.eligible, 'eligible');
  idArray(input.places, 'places');
  idArray(input.characters, 'characters', true);

  const ledgerKeys = new Set<string>();
  const effects = (value: unknown, path: string) => {
    if (!Array.isArray(value)) { fail(path, 'expected effects array'); return; }
    if (value.length > 128) { fail(path, 'exceeds 128 entries'); return; }
    value.forEach((item: unknown, i: number) => {
      const at = `${path}[${i}]`;
      if (!record(item) || !validEnum(EFFECTS, item.type)) { fail(at, 'unknown effect'); return; }
      if (!stableId(item.key)) fail(at, 'invalid effect key');
      if (!stableId(item.ledgerKey)) fail(at, 'invalid ledgerKey');
      else if (ledgerKeys.has(item.ledgerKey)) fail(at, `duplicate ledgerKey ${item.ledgerKey}`);
      else ledgerKeys.add(item.ledgerKey);
      if (['money', 'inventory', 'need', 'mood', 'health', 'trust'].includes(String(item.type)) &&
          !integer(item.delta, -1_000_000_000, 1_000_000_000)) fail(at, 'delta must be bounded integer');
      if (item.type === 'money' && item.key !== 'cash') fail(at, 'money must target cash ledger');
      if (item.type === 'need' && !validEnum(NEEDS, item.key)) fail(at, 'unknown need');
      if (['flag', 'schedule', 'bill', 'unlock'].includes(String(item.type)) && typeof item.value !== 'boolean')
        fail(at, 'requires explicit boolean value');
      if (item.type === 'location' && !stableId(item.value)) fail(at, 'requires place ID');
    });
  };
  effects(input.transitions, 'transitions');
  // Day-level effects run without a player choice. Never charge a save or
  // consume ingredients here: the player needs an explicit affordability gate.
  if (Array.isArray(input.transitions)) {
    input.transitions.forEach((effect: unknown, i: number) => {
      if (record(effect) && (effect.type === 'money' || effect.type === 'inventory') &&
          typeof effect.delta === 'number' && effect.delta < 0)
        fail(`transitions[${i}]`, 'unconditional spending requires a guarded choice');
    });
  }

  const beats = new Map<string, Record<string, unknown>>();
  const links = new Map<string, Set<string>>();
  if (!Array.isArray(input.beats) || input.beats.length < 3) fail('beats', 'requires at least 3 beats');
  else if (input.beats.length > 128) return { ok: false, errors: ['beats: exceeds 128 beats per episode'] };
  else input.beats.forEach((item: unknown, i: number) => {
    const at = `beats[${i}]`;
    if (!record(item) || !stableId(item.id)) { fail(at, 'invalid beat'); return; }
    if (beats.has(item.id)) { fail(at, 'duplicate beat ID'); return; }
    beats.set(item.id, item);
    links.set(item.id, new Set());
    if (!validEnum(PHASES, item.phase)) fail(at, 'unknown phase');
    if (!Array.isArray(item.timeWindow) || item.timeWindow.length !== 2 ||
        !integer(item.timeWindow[0], 0, 1440) || !integer(item.timeWindow[1], 0, 1440) ||
        item.timeWindow[0] > item.timeWindow[1]) fail(at, 'invalid timeWindow');
    predicates(item.condition, `${at}.condition`);
    // A mandatory conditional beat must have an explicit fail-forward route.
    if (Array.isArray(item.condition) && item.condition.length > 0 &&
        item.optional === false && !stableId(item.failForward))
      fail(at, 'mandatory conditional beat needs failForward');
    if (!label(item.localizedText)) fail(at, 'missing localizedText');
    if (!Array.isArray(item.actions) || item.actions.length === 0 ||
        item.actions.some((action: unknown) => !validEnum(ACTIONS, action))) fail(at, 'invalid actions');
    if (typeof item.optional !== 'boolean') fail(at, 'optional must be boolean');
    if (item.maxAttempts !== undefined && !integer(item.maxAttempts, 1, 10)) fail(at, 'invalid maxAttempts');
    for (const field of ['exit', 'failForward']) {
      const destination = item[field];
      if (destination !== null && !stableId(destination)) fail(`${at}.${field}`, 'expected beat ID or null');
      else if (stableId(destination)) links.get(item.id)?.add(destination);
    }
  });

  const nodeIds = new Set<string>();
  const choiceIds = new Set<string>();
  const nodesByBeat = new Set<string>();
  if (!Array.isArray(input.choices) || input.choices.length === 0) fail('choices', 'requires at least one meaningful choice node');
  else if (input.choices.length > 128) return { ok: false, errors: ['choices: exceeds 128 choice nodes per episode'] };
  else input.choices.forEach((node: unknown, i: number) => {
    const at = `choices[${i}]`;
    if (!record(node)) { fail(at, 'invalid choice node'); return; }
    if (!stableId(node.id) || nodeIds.has(node.id)) fail(at, 'duplicate/invalid node ID');
    else nodeIds.add(node.id);
    if (!stableId(node.beatId) || !beats.has(node.beatId)) fail(at, 'missing source beat');
    else if (nodesByBeat.has(node.beatId)) fail(at, 'multiple nodes on one beat');
    else nodesByBeat.add(node.beatId);
    if (!Array.isArray(node.choices) || node.choices.length < 2 || node.choices.length > 4) {
      fail(at, 'requires 2..4 choices'); return;
    }
    let freeRoute = false;
    const distinctOutcomes = new Set<string>();
    node.choices.forEach((choice: unknown, j: number) => {
      const where = `${at}.choices[${j}]`;
      if (!record(choice)) { fail(where, 'invalid choice'); return; }
      if (!stableId(choice.id) || choiceIds.has(choice.id)) fail(where, 'duplicate/invalid choice ID');
      else choiceIds.add(choice.id);
      if (!label(choice.text, 300)) fail(where, 'missing choice text');
      predicates(choice.condition, `${where}.condition`);
      effects(choice.consequences, `${where}.consequences`);
      // A priced choice must declare the minimum balance and item quantities
      // before it can be selected. A free alternative alone cannot prevent
      // overdrafts when a player selects an unaffordable paid option.
      if (Array.isArray(choice.consequences)) {
        let cashCost = 0;
        const itemCosts = new Map<string, number>();
        for (const effect of choice.consequences) {
          if (!record(effect) || typeof effect.delta !== 'number' ||
              !Number.isSafeInteger(effect.delta) || effect.delta >= 0) continue;
          if (effect.type === 'money' && effect.key === 'cash') cashCost += -effect.delta;
          if (effect.type === 'inventory' && stableId(effect.key))
            itemCosts.set(effect.key, (itemCosts.get(effect.key) ?? 0) - effect.delta);
        }
        const guards = Array.isArray(choice.condition) ? choice.condition : [];
        if (cashCost > 0 && !guards.some((guard: unknown) => record(guard) &&
            guard.op === 'min-cash' && typeof guard.value === 'number' && guard.value >= cashCost))
          fail(where, `unaffordable money effect: min-cash >= ${cashCost} required`);
        for (const [key, quantity] of itemCosts) {
          if (!guards.some((guard: unknown) => record(guard) && guard.op === 'has-item' &&
              guard.key === key && typeof guard.quantity === 'number' && guard.quantity >= quantity))
            fail(where, `unaffordable inventory effect: has-item ${key} >= ${quantity} required`);
        }
      }
      // Ledger identifiers encode event identity, not a different gameplay consequence.
      const semanticEffects = Array.isArray(choice.consequences)
        ? choice.consequences.map((effect: unknown) => {
          if (!record(effect)) return effect;
          const { ledgerKey: _ignored, ...meaning } = effect;
          return meaning;
        }) : choice.consequences;
      distinctOutcomes.add(JSON.stringify([choice.next, semanticEffects]));
      if (!stableId(choice.next)) fail(where, 'invalid destination');
      else if (stableId(node.beatId)) links.get(node.beatId)?.add(choice.next);
      if (Array.isArray(choice.condition) && choice.condition.length === 0 &&
          Array.isArray(choice.consequences) &&
          !choice.consequences.some((effect: unknown) => record(effect) &&
            (effect.type === 'money' || effect.type === 'inventory') &&
            typeof effect.delta === 'number' && effect.delta < 0)) freeRoute = true;
    });
    if (distinctOutcomes.size < 2) fail(at, 'choices must have distinct consequences or destinations');
    if (node.fallbackNext !== undefined) {
      if (!stableId(node.fallbackNext)) fail(at, 'invalid fallbackNext');
      else if (stableId(node.beatId)) links.get(node.beatId)?.add(node.fallbackNext);
    }
    if (!freeRoute && node.fallbackNext === undefined)
      fail(at, 'cash-zero softlock: needs free unconditional option or fallbackNext');
  });

  idArray(input.endings, 'endings');
  const endings = new Set<string>(Array.isArray(input.endings) ? input.endings.filter(stableId) : []);
  for (const end of endings) {
    if (!beats.has(end)) fail('endings', `unknown ending ${end}`);
    else if (beats.get(end)?.phase !== 'sleep') fail('endings', `ending is not sleep: ${end}`);
    else {
      const actions = beats.get(end)?.actions;
      if (!Array.isArray(actions) || !actions.includes('sleep'))
        fail('endings', `sleep ending must offer sleep action: ${end}`);
    }
  }
  const first = Array.isArray(input.beats) && record(input.beats[0]) ? input.beats[0].id : null;
  if (!stableId(first) || beats.get(first)?.phase !== 'waking') fail('beats', 'first beat must be waking');
  else {
    const actions = beats.get(first)?.actions;
    if (!Array.isArray(actions) || !actions.includes('wake'))
      fail('beats', 'waking entry must offer wake action');
  }
  if (![...beats.values()].some(beat => {
    const actions = beat.actions;
    return beat.phase === 'shop' && Array.isArray(actions) &&
      actions.some(action => action === 'serve' || action === 'openShop');
  })) fail('beats', 'episode needs a tea shop interaction');
  for (const [from, destinations] of links) {
    if (!endings.has(from) && destinations.size === 0) fail('graph', `dead end at ${from}`);
    if (endings.has(from) && destinations.size > 0) fail('graph', `sleep ending has outgoing link: ${from}`);
    for (const to of destinations) {
      if (!beats.has(to)) fail('graph', `dangling ${from} -> ${to}`);
      else {
        const a = beats.get(from)?.timeWindow, b = beats.get(to)?.timeWindow;
        if (Array.isArray(a) && Array.isArray(b) && typeof a[0] === 'number' && typeof b[1] === 'number' && a[0] > b[1])
          fail('graph', `time-reversed ${from} -> ${to}`);
      }
    }
  }
  // DFS from entry: v1 disallows cycles until a bounded-loop interpreter exists.
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const memo = new Map<string, boolean>();
  const finishable = (current: string): boolean => {
    if (visiting.has(current)) { fail('graph', `cycle at ${current}`); return false; }
    if (memo.has(current)) return memo.get(current) === true;
    visiting.add(current);
    visited.add(current);
    const next = [...(links.get(current) ?? [])].filter(dest => beats.has(dest));
    // Evaluate every successor even if one is invalid, so diagnostics are complete.
    const outcomes = next.map(finishable);
    const safe = endings.has(current) || (next.length > 0 && outcomes.every(Boolean));
    visiting.delete(current);
    memo.set(current, safe);
    return safe;
  };
  if (stableId(first) && beats.has(first) && !finishable(first))
    fail('graph', 'some entry routes cannot reach sleep');
  for (const beatId of beats.keys()) if (!visited.has(beatId)) fail('graph', `unreachable ${beatId}`);
  if (![...endings].some(end => visited.has(end))) fail('graph', 'no reachable sleep ending');
  return errors.length > 0 ? { ok: false, errors } :
    { ok: true, errors: [], episode: input as unknown as EpisodeDefinition };
}
