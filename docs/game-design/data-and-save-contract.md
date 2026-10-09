# Hợp đồng nội dung, trạng thái, save và replay cho game nhiều ngày

> **Đề xuất API/Schema; chưa triển khai.** Cần kiểm tra `src/game/types.ts`, `storage.ts`, `engine.ts`, `cityEpisodes.ts` trước khi viết code để **không thay đổi hoặc phá save v3**. [Game Bible](README.md), [Story](story-and-days.md).

## 1. Ranh giới module và nguồn sự thật

Không hardcode day/line thoại/item trong React hoặc renderer. Một hệ thống có kiểu ở `src/game`, nội dung đọc từ catalog/lazy import + manifest:
- `/content/worlds/*/world.manifest.json`: world → districts → zones → entrances/nav/assets.
- `/content/chapters/*/chapter.json`: unlock, days, arc, endings, prerequisites.
- `/content/days/*/day.json`: 1 ngày/màn với intro, schedule, mandatory & optional beats, goals, exit.
- `/content/npcs/*/npc.json`: identity, homeZone, schedules, relationships defaults, outfit/voice/dialogue packs.
- `/content/events/*/event.json`: eligible conditions, weights, limits, narrative/audio/animation, outcome.
- `/content/economy/*`: items, recipes, vendors, price bands, bills, NPC budgets.
- `/content/locales/vi-VN/*` và `en/*` **khi cần**: text keys, subtitles; Việt là nguồn chính.

Đường trên là **thiết kế đề xuất**, không nhận là đường đã tồn tại. Giữ catalog và action engine cũ hoạt động bằng adapter cho tới khi đủ migration tests.

## 2. Contract Typed (ví dụ, cần chuẩn hóa bằng schema validator khi triển khai)

```ts
type StableId = string;
type GameMinute = number; // phút kể từ đầu ngày, không thời gian máy
type DayIndex = number;

type Condition =
  | { op: "flag"; key: StableId; is: boolean }
  | { op: "stat"; key: "energy" | "hunger" | "mood"; cmp: ">=" | "<="; value: number }
  | { op: "balance"; cmp: ">="; vnd: number }
  | { op: "relation"; npc: StableId; stat: "trust" | "tension"; cmp: ">=" | "<="; value: number }
  | { op: "dayRange"; min: number; max?: number }
  | { op: "and" | "or"; terms: Condition[] }
  | { op: "not"; term: Condition };

type Effect =
  | { type: "setFlag"; key: StableId; value: boolean }
  | { type: "currency"; amountVnd: number; reason: string }
  | { type: "stock"; itemId: StableId; delta: number }
  | { type: "need"; need: "energy" | "hunger" | "mood"; delta: number }
  | { type: "relationship"; npcId: StableId; stat: "trust" | "tension"; delta: number }
  | { type: "promise"; promiseId: StableId; dueDay: DayIndex; npcId: StableId }
  | { type: "schedule"; eventId: StableId; day: DayIndex; slot: string };

type Choice = {
  id: StableId;
  textKey: StableId;
  when?: Condition;
  pricePreview?: { amountVnd: number; reason: string };
  effects: Effect[];
  next: StableId | "END_BEAT";
};

type Beat = {
  id: StableId;
  type: "dialogue" | "interaction" | "task" | "cutscene" | "ambient";
  when?: Condition;
  locationId: StableId;
  actorIds: StableId[];
  startWindow: [GameMinute, GameMinute];
  priority: "critical" | "optional" | "ambient";
  cooldownDays?: number;
  severity: 0 | 1 | 2 | 3;
  textKey: StableId;
  choices: Choice[];
  recoveryBeatId?: StableId;
};

type DayPack = {
  schemaVersion: 1;
  id: StableId;
  chapterId: StableId;
  ordinal: number;
  minEngineVersion: string;
  introBeatId: StableId;
  requiredBeatIds: StableId[];
  optionalPools: { id: StableId; countMax: number; beatIds: StableId[] }[];
  endingBeatIds: StableId[];
  nextDayId?: StableId;
  fallbackDayPackId?: StableId;
  allowedZones: StableId[];
  assetBundleIds: StableId[];
};
```

`Effect` không được chạy JS tự do từ JSON, không `eval`/remote script; chưa chắc những union trên đủ cho mọi nghiệp vụ, mở rộng phải review schema/test/migration trước. Độc lập giữa `Beat` (điều hướng truyện) và `Action` (nút gameplay) để NPC, tiền, collider không cập nhật từ một animation callback ngẫu nhiên.

## 3. Ví dụ data ngày ngủ quên (chỉ đề xuất, chưa nhập vào game)

```json
{
  "schemaVersion": 1,
  "id": "anhoa.day.002.late-open",
  "chapterId": "anhoa.chapter.001",
  "ordinal": 2,
  "minEngineVersion": "future-lc1",
  "introBeatId": "anhoa.d02.wakeup",
  "requiredBeatIds": ["anhoa.d02.wakeup", "anhoa.d02.shop-shift", "anhoa.d02.recap"],
  "optionalPools": [
    { "id": "market-micro", "countMax": 1, "beatIds": ["anhoa.market.rain-chat"] }
  ],
  "endingBeatIds": ["anhoa.d02.recap"],
  "nextDayId": "anhoa.day.003.market-shortage",
  "fallbackDayPackId": "anhoa.day.calm-template",
  "allowedZones": ["anhoa-core", "anhoa-residential"],
  "assetBundleIds": ["base-shops", "anhoa-day-02"]
}
```

Manifest tách từ beat definitions; nhập nguyên JSON này **sẽ chưa chạy** vì các `Beat` liên quan chưa được author và module loader chưa tồn tại. Đảm bảo không viện dẫn ID thật chưa kiểm repo.

## 4. Save state: mở rộng từ v3 không phá dữ liệu

Trước triển khai: snapshot migration v1/v2/v3 hiện tại, inventory/cash/shop upgrades/quests/scene coords và các local storage keys. Ghi rõ trường nào v3 đã chứa; đừng giả định `SaveV4` sẵn có.

**Future `SaveV4` đề xuất:**
- `saveVersion: 4`; `engineVersion`, `contentPackVersions`, `worldSeed`, `dayIndex`, `gameMinute`, `activeDayPackId`, `chapterId`, `zoneId`, `playerPos`.
- `coreLegacy`: mapped business/shop/inventory/XP/quests/relationship fields tương thích.
- `needs`, `outstandingBills`, `activePromises`, `npcPersistentStates`, `dailyManifest` (đã chốt seed, các cast/giá/event), `facts`, `completedDecisionIds`, `ledger`.
- `assetId`/zone only lưu references; không serialize `Mesh`, `AnimationMixer`, textures hoặc runtime handles.
- `seenCutscenes`, `preferences` tách với story state khi có thể.

**Nghiệm thu migration:** tải v1/v2/v3 sang v4 giữ nguyên tiền/kho/trang trí/quest/position theo rules; unknown ID có alias map hoặc rescue path + cảnh báo, không reset câm lặng; upgrade atomic với backup snapshot (IndexedDB/local storage strategy quyết theo dữ liệu đo); tương thích khi người chơi quay về app bản cũ phải được định nghĩa rõ trước phát hành.

## 5. Tất định, RNG, lịch hẹn và giao dịch exactly once

- PRNG có thuật toán và version cố định; seed tạo từ `worldSeed + dayIndex + eventPoolVersion + slot` bằng hash được kiểm thử, **không dùng Math.random** cho lựa chọn lưu trữ.
- Khi bắt đầu ngày, đóng băng `DayManifest`: weather, intro ID, danh sách cast, price modifiers, booking, preset outfit, optional encounters. Reload cùng save dùng manifest cũ, không roll lại để farm tips.
- `EventQueue` theo gameMinute; `eventInstanceId = packId/dayIndex/beatId/occurrence`; có guard cooldown/density/conflicting NPC schedules.
- `reduce(action, state) -> nextState + effects` chạy kiểm tra precondition, commit kinh tế/quest/relation trước khi UI báo thành công; `transactionId` từ intent bất biến, effect đã áp phải không áp lại. Ví dụ `pay.bill.2026-w01`, `serve.order.001`.
- `WorldLedger` lưu giao dịch dạng append logical/compacted journal, **không** xóa lịch sử reward đã cấp khi chuyển scene; khi nén giữ set idempotency keys đủ kỳ.
- Phát event UI/animation **sau commit**, phát lại cutscene không phát lại `Effect`. Nếu animation thất bại, state vẫn có retry/rollback được định nghĩa.
- Clock tăng theo in-game minutes có cap khi resume. Chuyển ngày gồm `closeLedger`, expire time-bound events, bill reminders, inventory freshness, relation changes, select next day, save atomic; crash giữa các bước không nhân thưởng.

## 6. Validation ở thời điểm build và runtime

**Static validator mỗi content pack:**
- ID duy nhất (namespaced `world.chapter.day.beat`), references hợp lệ, version range tương thích; không circular dependency day/chapter không có exit.
- Graph reachable từ intro→closure trong tất cả nhánh chính; choice dead end có `recoveryBeatId`, flag contradictions được báo.
- Money/item non-negative trong quá trình dùng được, recipe nguyên liệu tồn tại; bill dueDay/timing khả thi; arrival/exit location và actor schedules không trùng xung đột.
- Có localization key tiếng Việt cho mọi text (và fallback cho locale khác), không hardcoded in UI; có metadata content rating / asset licenses.
- Import không kéo asset mọi ngày khi khởi động; kiểm tree-shaking/network lazy chunk theo world/zone/day.

**Dynamic tests:**
- `sameSeedSameManifest`, `saveReloadSameOutcome`, `onceOnlyReward`, `billPaymentNoDoubleDebit`, `cannotCraftWithoutStock`, `needDecayPauseSafe`.
- `npcLocationExclusive`, `noInvalidSpawn`, `canReachEnding`, `missingContentFallbackWorks`, `walkToInteractAndBack`, `noCollisionPhasingAtLowFPS`.
- Fuzz mô phỏng ≥100 seeds * 30 ngày cho logic (mục tiêu future, phải đo runtime CI), kiểm cash/food/relation ranges, deadlocks, bad-luck budget và deadlines.
- Browser production và thiết bị thật kiểm visual/interaction/perf. Unit/property tests không thay FPS/asset quality.
- Fixture snapshots lưu `engineSha/contentHash/seed/day/stateHash`, để AI khác tái hiện cùng ngày.

## 7. Hợp đồng phát hành content pack

```text
packId + packVersion + engineRange + schemaVersion
+ dependencies + day/zone/event/npc/item IDs
+ locale catalogs + asset manifests/licensing + checksum
+ seed fixtures + graph validation report
+ benchmark/screenshots + changelog/migration notes
```

Version dùng semver; ID cũ không đổi nghĩa. Content pack thêm ngày và vùng không cần sửa thuật toán engine nếu mọi loại event/effect đã hỗ trợ; muốn loại effect mới phải triển khai trước với tests. Không tải bundle chưa qua validator, không cập nhật save để trỏ vào day pack không tồn tại. Đường rollback phải phục hồi version nội dung tương thích với save, không xóa ngày đã chơi.
