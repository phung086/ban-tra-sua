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
  // VALIDATOR_NEXT
  return errors.length ? { ok: false, errors } : { ok: true, errors: [], episode: raw };
}
