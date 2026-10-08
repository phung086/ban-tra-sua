# SIMULATION CONTRACTS — Hợp đồng kỹ thuật để nhiều AI làm song song

## Module boundaries (không sửa code ngay)

```text
src/game/lifeSim/
  ids.ts, types.ts             # ID schema, unions, version
  rng.ts                       # deterministic seeded PRNG
  calendar.ts                  # clock, wake, sleep, recurring due dates
  dayPlanner.ts                # conditions + scheduling + weighted events
  reducer.ts                   # pure commands -> state + journal
  economy.ts                   # transactions & VND price book
  needs.ts                     # hunger/energy/health and recovery
  relationships.ts             # promises, bond, group meetups
  validation.ts                # graph, economy, content guards
  migrations.ts                # save v3 -> v4
src/content/days/
  day-001.json ... day-030.json, procedural-pools.json
src/world/
  districts.ts, chunkStream.ts, nav.ts, portals.ts
src/scene/
  lifelikeAnimation.ts          # animation state machine only
```

**Bắt buộc adapter với mã cũ**: `GameState.day` và `city.minutes` vẫn là nguồn số ngày/giờ trước migration. Không tạo bản sao `day` và `minutes` bất đồng. `phase=prep/open/summary` là pha kinh doanh; **đời sống có lifePhase riêng**, không thay nghĩa `phase`. Đưa scheduler vào `advanceDay` hoặc adapter không đổi API cũ, sau đó mới migrate save.

## Save version / data

V4 khi sẵn sàng phải upgrade idempotent từ `tiem-tra-chibi-save-v3` và tương thích không mất cash/xp/inventory/relationships/quests. **Không** thay v3 key ngay khi mới thêm kế hoạch. Đề xuất:
```ts
interface LifeState {
  schemaVersion: 1;
  worldSeed: string;                   // created once, persisted
  dayIndex: number;                    // equal GameState.day
  lifePhase: 'asleep'|'waking'|'active'|'evening'|'sleep-confirm';
  clockMinute: number;                 // synced from city.minutes
  needs: { satiety:number; energy:number; hygiene:number; mood:number; stress:number; social:number; health:number };
  moneyLedger: Transaction[];
  household: { homeId:string; members:string[]; recurringBills:Bill[] };
  relationships: Record<string, RelationshipMemory>;
  groupInvites: InviteState[];
  world: { currentDistrict:string; unlockedDistricts:string[]; currentPlace:string };
  episode: { id:string; variantId:string; contentVersion:number; generatedFromSeed:string; completedBeats:string[] };
  eventLedger: string[];               // IDs of actions applied exactly once
  history: CompletedDayDigest[];       // cap, compact after 30 days
}
```
Do not store renderer meshes, WebGL handles or giant NPC per-frame positions in save. Keep save JSON structuredClone-safe, transactional, validate malformed input, snapshot backup before migration, handle unknown legacy IDs gracefully.

## Day content contract

```ts
interface DayDefinition {
  id: string;                    // "day-001" or "arc-family-03"; stable
  version: number;
  title: string;
  arc: 'opening'|'friendship'|'family'|'responsibility'|'recovery'|'travel'|'endless';
  eligible: Predicate[];         // typed JSON, no eval or JavaScript in JSON
  priority: number;              // deterministic ties by ID
  cooldownDays: number;
  places: string[];              // IDs from validated district registry
  characters: string[];          // IDs; unavailable NPC cannot be required
  beats: DayBeat[];              // wake, breakfast, store, incident, evening, sleep
  choices: ChoiceNode[];
  endings: string[];             // at least one reachable or safe fallback
  transitions: TransitionEffect[];  // ledgerKey + bounded deltas
  assetBundle?: string;          // optional, only when asset published
}
```
`DayBeat`: id, phase, timeWindow, condition, localizedText, actions, optional, failForward, exit, maxAttempts. `ChoiceNode`: id, 2–4 choices, stable choiceId, condition, consequence, next, fallbackNext. Effects enum: money, inventory, mood, health, trust, flag, schedule, bill, location, unlock. **No arbitrary code execution**.

## Event and time guarantee

Given identical `saveSnapshot`, `contentVersion` and `actionSequence`, planner and reducer produce bit-for-bit same next state. PRNG seed e.g. `hash32(worldSeed|dayIndex|subsystem|slot)` with explicit algorithm version; separate streams (weather, visitor, dinner, traffic) so adding new random car doesn't change episode outcome. Resolve the whole `DayPlan` exactly once at `wake` and persist it; **reload may never re-roll** the random payer/customer.

`dispatch(command)` validates payload and state, checks ledger key `day:beat:choice/effect`, atomically writes a single canonical log + result; on duplicate returns unchanged. Caps: cash ≥0 unless modeled debt, health 0..100, invites/groups limited, clock monotonic until sleep.

## Economy ledger

`Transaction` includes id, day, timestampInGame, amount integer VND (negative for cost), category, counterparty, referenceId; enforce `cash = openingCash + sum(delta)` for each day and no negative input spending unless debt/credit was explicitly selected. Billing dedupe by `billId:period`. Use integer VND; balance adjustments via ledger only, not React/UI. Price book is versioned and values are **fictional calibration**, not live Hanoi retail quotes.

## Generator rules

Planner order: hard calendar/health obligations > authored story beat > shop and friendship invitations > small flavor events. Constraint solving should guarantee at least one route (relaxed schedule, fallback choice). Prevent scheduling clinic and mandatory full-day outing simultaneously; reserve travel/time budget. New NPC variants cannot overwrite canonical identities or promises.

## Test contracts

- Same seed/state/action -> same plan and same game state.
- Different seeds -> diverse visitors/encounters over aggregate trials; no unfair forced charges.
- Reload/reopen -> same wake/event/payee; double-click does not double charge/reward.
- Save v3 fixture migration retains money/inventory/quest/relationships; rollback path documented.
- Each day graph: unique IDs, existent neighbors, reachable end/sleep, no infinite loops/unpayable mandatory costs, no unobtainable required item.
- No implicit city travel through walls; path graph and collider data verified independently of render assets.
- P95/heap/calls gates measured on CI browser and real low-end mobile before spatial features merge.

## Version and compatibility

`worldState.schemaVersion`, `contentVersion` per episode, `pricingVersion`, `districtVersion`; pinned for in-progress saves. Removed content ID gets an explicit alias or safe closure that refunds/returns consumed items. There is a quarantine fallback for corrupt episode state; it **never resets legacy shop state silently**.