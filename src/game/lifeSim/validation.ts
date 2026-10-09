/** T1-03: pure authored episode validator; never mutates a save or executes content. */
export type EpisodeValidation = { ok: true; errors: []; episode: Record<string, unknown> } | { ok: false; errors: string[] };
type Obj = Record<string, unknown>;
const obj = (x: unknown): x is Obj => x !== null && typeof x === 'object' && !Array.isArray(x);
const stableId = (x: unknown): x is string => typeof x === 'string' && /^[a-z0-9][a-z0-9._:-]{0,127}$/.test(x);
const integer = (x: unknown, min: number, max: number): x is number => typeof x === 'number' && Number.isSafeInteger(x) && x >= min && x <= max;
const label = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0 && x.length <= 400;
const oneOf = (x: unknown, values: readonly string[]): x is string => typeof x === 'string' && values.includes(x);
const phases = ['waking','morning','shop','social','street','evening','sleep'];
const actions = ['wake','eat','cook','buyFood','buyGroceries','openShop','serve','travel','talk','acceptInvite','shareBill','visitClinic','payBill','sleep','eatOut','rest','closeShop','deliver'];
const arcs = ['opening','friendship','family','responsibility','recovery','travel','endless'];
const operations = ['day-eq','day-at-least','day-at-most','min-cash','has-flag','has-item','trust-at-least'];
const effectTypes = ['money','inventory','need','mood','health','trust','flag','schedule','bill','location','unlock'];
const needs = ['satiety','energy','hygiene','mood','stress','social','health'];

/** A structural gate only: a validated design is not a playable/released day. */
export function validateEpisode(raw: unknown): EpisodeValidation {
  const errors: string[] = [];
  const fail = (path: string, reason: string) => { errors.push(path + ': ' + reason); };
  if (!obj(raw)) return { ok: false, errors: ['episode: expected object'] };
  if (raw.schemaVersion !== 1) fail('schemaVersion','unsupported version');
  if (!stableId(raw.id)) fail('id','invalid stable ID');
  if (!integer(raw.version,1,100000)) fail('version','invalid version');
  if (!label(raw.title)) fail('title','missing title');
  if (!oneOf(raw.arc,arcs)) fail('arc','unknown arc');
  if (!integer(raw.priority,0,100000)) fail('priority','invalid priority');
  if (!integer(raw.cooldownDays,0,100000)) fail('cooldownDays','invalid cooldown');
  if (raw.assetBundle != null && !stableId(raw.assetBundle)) fail('assetBundle','invalid asset ID');
  if (raw.fallback !== undefined && (!obj(raw.fallback) || !stableId(raw.fallback.id) || !label(raw.fallback.reason)))
    fail('fallback','invalid fallback');
  const ids = (input: unknown, path: string, allowEmpty = false) => {
    if (!Array.isArray(input) || input.length > 128 || (!allowEmpty && input.length === 0)) { fail(path,'invalid ID list'); return; }
    const seen = new Set<string>();
    for (const entry of input) {
      if (!stableId(entry)) fail(path,'invalid ID');
      else if (seen.has(entry)) fail(path,'duplicate ID ' + entry);
      else seen.add(entry);
    }
  };
  const predicates = (input: unknown, path: string) => {
    if (!Array.isArray(input) || input.length > 128) { fail(path,'invalid predicate list'); return; }
    input.forEach((p: unknown, n: number) => {
      const at = path + '[' + n + ']';
      if (!obj(p) || !oneOf(p.op,operations)) { fail(at,'unknown predicate'); return; }
      if (['day-eq','day-at-least','day-at-most'].includes(p.op) && !integer(p.value,1,Number.MAX_SAFE_INTEGER)) fail(at,'invalid day predicate');
      if (p.op === 'min-cash' && !integer(p.value,0,1_000_000_000)) fail(at,'invalid cash threshold');
      if (p.op === 'has-flag' && (!stableId(p.key) || typeof p.value !== 'boolean')) fail(at,'invalid flag predicate');
      if (p.op === 'has-item' && (!stableId(p.key) || !integer(p.quantity,1,100000))) fail(at,'invalid item predicate');
      if (p.op === 'trust-at-least' && (!stableId(p.key) || !integer(p.value,-100,100))) fail(at,'invalid trust predicate');
    });
  };
  predicates(raw.eligible,'eligible');
  ids(raw.places,'places');
  ids(raw.characters,'characters',true);
  const ledger = new Set<string>();
  const effects = (input: unknown, path: string) => {
    if (!Array.isArray(input) || input.length > 128) { fail(path,'invalid effects list'); return; }
    input.forEach((e: unknown, n: number) => {
      const at = path + '[' + n + ']';
      if (!obj(e) || !oneOf(e.type,effectTypes)) { fail(at,'unknown effect'); return; }
      if (!stableId(e.key)) fail(at,'invalid effect key');
      if (!stableId(e.ledgerKey)) fail(at,'invalid ledger key');
      else if (ledger.has(e.ledgerKey)) fail(at,'duplicate ledgerKey ' + e.ledgerKey);
      else ledger.add(e.ledgerKey);
      if (['money','inventory','need','mood','health','trust'].includes(e.type) && !integer(e.delta,-1_000_000_000,1_000_000_000))
        fail(at,'invalid effect delta');
      if (e.type === 'money' && e.key !== 'cash') fail(at,'money must target cash');
      if (e.type === 'need' && !oneOf(e.key,needs)) fail(at,'unknown need');
      if (['flag','schedule','bill','unlock'].includes(e.type) && typeof e.value !== 'boolean') fail(at,'effect requires boolean');
      if (e.type === 'location' && !stableId(e.value)) fail(at,'effect requires location ID');
    });
  };
  effects(raw.transitions,'transitions');
  const beats = new Map<string, Obj>();
  const edges = new Map<string, Set<string>>();
  if (!Array.isArray(raw.beats) || raw.beats.length < 3 || raw.beats.length > 128)
    fail('beats','requires 3..128 beats');
  // VALIDATOR_NEXT
  return errors.length ? { ok: false, errors } : { ok: true, errors: [], episode: raw };
}
