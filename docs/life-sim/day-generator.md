# DAY GENERATOR — Tạo biến thể theo seed có kiểm soát

## Kịch bản viết tay + tổ hợp sinh thủ tục

Không chọn “hôm nay gặp đại 5 chuyện” một cách vô định. Một ngày có **1 core authored episode** (hoặc fallback calm day), 0–2 social opportunities, 1 shop modifier, 0–1 minor city incident, lịch nhu cầu/bills; weather and traffic là flavor. Nhịp 3 hồi: setup → complication → agency/resolution. Có ngày không biến cố và dành cho chăm sóc bản thân.

Công thức:
`DayPlan = Compose(arcBeat, seededWake, weather, customers, obligations, invitation, encounter, playerHistory, resourceBounds)`.

Inputs: worldSeed, day, day-of-week, season (game-fiction), cash/inventory/energy, relationship flags/promises, completed content ids, district unlocks, remaining time, cooldown/rarity. Content deterministic sorted before weighted choice.

## Algorithm v1

1. Load content registry (validated, pinned version). Reject inconsistent stories before gameplay.
2. On `wake`, if `savedDayPlan` exists for same day return it unchanged.
3. Resolve fixed dates (rent, utility, birthday, appointment) and owed promises.
4. Filter authored beats by eligibility; if mandatory continuing arc exists pick it; else choose least-recent suitable arc. Reserve 1 calm day in each rolling 5-day window unless a user-triggered plot milestone takes priority.
5. Roll `wakeTime` from schedule/health/previous bedtime; late waking an occasional event, never random every day. Roll customer schedule conditional on open hours, regulars, weather, reputation. Gentle difficulty ramp, no sudden unavoidable financial ruin.
6. Roll social invite if NPC available/relationship meets gate; select party subset, restaurant, settlement policy and encounter from distinct seeded streams. Settlement options share/pay-self/host/treat/repay; explicit consent before spend.
7. Choose one street surprise from location and safety context; avoid impossible queues/collider bypass. Validate conflict graph across places and time windows.
8. Attach visual skin population variants (car models, pedestrians, clothing) **separate from canonical event RNG**, with deterministic day+district seeds.
9. Save `DayPlan` atomically **before first game effect**. During day, reducer resolves choices and stores ledger. Night digest closes day and journals consequences.

**Cooldown:** core episode ID ≥14 ngày khi applicable; event small 3–7 ngày; same opening/ending phrases max 2 in last 10. Procedural pool needs authored 3–5 variants per category and fallback, not permutations of meaningless synonyms. Relational memory may favor repeat events when it is narratively meaningful.

## Difficulty/variety fairness

Daily intensity `0..3`: 0 calm, 1 normal, 2 busy, 3 dramatic only if earned arc and player has exit path. Do not stack illness + unpaid bill + store disaster by default; when forced obligation exists, cap total pressure. Add quick mode 10–15min vs full day 20–35min without changing outcome unfairly.

Give players agency in each complication: choice A/B/C with tradeoffs and plan B; happy paths are not universally optimal. Rare good-luck day can give generous tip, unexpected support, reconciliation. Sad day may include grief, worry or fatigue but allow graceful endings; no irreversible harmful surprise without foreshadowing.

## Worked example Day 12 (not executable data)

```json
{
  "id":"day-012", "worldSeed":"save-42", "wake":"09:05", "weather":"drizzle",
  "core":"friendship-dinner-promise", "openShop":"09:45",
  "customers":[{"id":"thu","mood":"picky"},{"id":"visitor-07","mood":"generous"}],
  "invite":{"group":["lan","nam","player"],"time":"19:00","place":"noodle-shop","payer":"split","payeeResolvedBySeed":"shared"},
  "street":{"id":"lost-umbrella","place":"bus"},
  "evening":{"options":["eat-out","cook-at-home","reschedule"],"sleepTarget":"23:15"}
}
```
Nếu người chơi từ chối lời mời, `payer` không phát sinh hóa đơn; “lost umbrella” có thể được giải quyết ngày sau. Nếu reload trước khi ra quán, cấu hình invitation không đổi.

## Quality gates cho một ngày mới

- 3–6 beats playable, gồm wake/tiệm hoặc sinh hoạt thay thế/điểm lựa chọn/tổng kết/sleep; không lặp y nguyên 3 ngày gần.
- 1 hệ quả sau 1+ ngày (flag/trust/unlock/schedule), 1 tuyến “không đủ tiền/thời gian/khỏe” vẫn chơi được.
- 2–4 lời thoại lựa chọn ở scene quan trọng; không công kích người dùng, không định kiến bệnh tật/nghèo khó.
- Test graph/migration/ledger, ảnh 390×844 và 844×390, collider/NPC/camera ở điểm tương tác.
- Pass M1–M4 gates trước khi thêm asset/city zone vào game main; bản dữ liệu thuần có thể PR riêng sớm hơn.

## Vô hạn bền vững

Sau ngày 30, story arcs mở theo 7/14/28-day cadences và relationship chapter, calendar season/festival, optional travel; nội dung mới là **packs**, không phải `if(day===31)`. Hệ thống lưu lịch sử dạng digest, không để save tăng O(days×allNPCs). Sau mỗi 30 ngày gộp journal cũ thành milestone + giữ recent window, không mất các flags/promise liên quan. Báo cáo nội dung thật: `authoredDays`, `proceduralVariants`, `testedArcs`, không quảng cáo “vô hạn tình huống chưa từng gặp”.