# AGENTS & DELIVERY — Team AI, ownership, roadmap và vòng lặp phát triển

## Khi nhiều AI tham gia: quy tắc tối cao

**Không có một “AI toàn năng” được tự sửa mọi thư mục.** Mỗi agent có `role`, nhánh riêng, tệp sở hữu, module contract, baseline SHA, PR và status. Điều phối từ `main`; không chỉnh nhánh AI khác, nhất là `codex/mobile-beta-foundation` và `codex/m1-benchmark-gate-isolated`. Đang có frame pacing trên `codex/frame-pacing-30fps-20261008` chưa merge. Chỉ merge khi CI đúng SHA và acceptance of changed scope; benchmark M1 blocker riêng cho việc nới scene/asset.

## Danh sách agent có thể làm song song

| ID | Agent và ownership tệp | Công việc và deliverable | Phụ thuộc / kiểm thử |
| --- | --- | --- | --- |
| A00 | Integrator/release — `docs/life-sim/`, PRs, CI | Theo dõi status, resolve conflict, schema/version, tạo next-cycle prompt, merge sạch | Không sửa gameplay trực tiếp khi agent khác đang giữ |
| A01 | Simulation core — `src/game/lifeSim/{types,rng,calendar,dayPlanner,reducer,validation}.ts` | Deterministic seed, planner/save snapshot, validate episodes, fail-forward, unit tests | Gate architecture + compatibility save v3 |
| A02 | Economy/needs — `src/game/lifeSim/{economy,needs,household}.ts` | groceries/cooking, hunger/energy/health/bills, ledger, no softlock | A01 types, migration; no React side effects |
| A03 | Story/content — `src/content/days/**`, `docs/life-sim/episode-catalog.md` | Thêm một day pack đã thẩm định mỗi vòng; viết thoại, conditions, consequences | A01 validator; không đụng renderer |
| A04 | Social/NPC — `src/game/lifeSim/{relationships,social}.ts` | family/friends/group invitation, payer policy, memory/schedule | A01 state and A02 money ledger |
| A05 | World/nav — `src/world/{districts,nav,portals}.ts`, `src/game/collision.ts` (lock) | Collider vật lý, navmesh/portals, không xuyên cây/nhà/xe | M1/M2 for visual expansion, tests physics |
| A06 | Three.js/perf — `src/scene/**` với reservation | LOD/instancing/streaming, scene budgets, animation rig, shadow/fps instrumentation | Chỉ sau M1 gate + device proof, riêng test |
| A07 | UI/UX — `src/components/life/**`, `src/styles-life.css` | Wake/clock/diary, bills, needs, dialogue, kitchen, touch/mobile dọc-ngang | A01–A04 contracts, accessibility |
| A08 | QA/tooling — `scripts/life-validate.mjs`, `src/**/*.test.ts`, `.github/workflows/**` (lock) | Seed golden fixtures, content graph, stress, snapshot, Playwright, device matrix | Bất kỳ PR phát hành nào |
| A09 | Art/content pipeline — `assets/source/**`, `public/world/**` (lock) | Rig nhân vật, atlas nhà, xe, cây, giấy phép assets/LOD | M2/M3; không import images chưa phép |

**Ownership lock:** nếu 2 agent cần `runtime.ts`/`city.ts`/`App.tsx`/`storage.ts`/workflows, agent A00 giao theo thứ tự, hoặc tạo adapter tách module; không hai PR cùng chỉnh một file mỗi giờ. Agent story/JSON có thể song song, nhưng unique IDs/reservations và merge tuần tự.

## Milestones/dependencies — rõ thời điểm được làm

| Track | Epic | ID checklist | Acceptance |
| --- | --- | --- | --- |
| T0 docs (ngay) | World Bible + backlog + migration strategy | T0-01…03 | Link ở README, CI docs green, không đổi gameplay |
| T1 core parallel with M1 | Seeded day planner và schema | T1-01 RNG, T1-02 calendar, T1-03 content validator, T1-04 pure reducer, T1-05 v3→v4 migration fixtures | Determinism, reachability, idempotency, old save preserved |
| T2 content | Days 01–07, 08–14, 15–21, 22–30 | T2-001…030 | Một ngày playable dọc/ngang sau core, 3 save states, hệ quả hôm sau |
| T3 life | Needs, chợ, bếp, income/expenses, bills, clinic | T3-01…06 | Cash conservation, no softlocks, accessible interactions |
| T4 social | Family/friends/restaurant/group billing/memory | T4-01…05 | Invite variants, consent/cost, multi-day effect, attendance graph |
| T5 world visual | Scene chunks, nav/colliders, portals, districts, animation | T5-01…07 | M1/M2 gates + device + photo near/far + no penetration |
| T6 release | 30-day chapter QA, save compatibility, beta | T6-01…05 | E2E, perf, 15min real devices, rollback, no P0/P1 |
| T7 sustainable content | 7/14/28-day arcs, new city/sea pack | T7-01…N | Does not load all districts at once; saved progress valid |

**Ràng buộc:** M1 chưa đạt thì T5 mở rộng 3D không được merge, T2 chỉ chuẩn bị dữ liệu/đoạn logic không tăng cảnh. Đừng tuyên bố T2 ngày 01–30 playable chỉ vì đã có catalog.

## Quy trình 60 phút mỗi lần automation

1. **00–08' Inspect**: read README + this doc + backlog/status + open PR + exact main SHA + CI + M1 gates; reserve owner/files. Nếu PR từ vòng trước chưa kết thúc, ưu tiên hoàn thành nó.
2. **08–15' Select**: lấy tác vụ có priority cao nhất và dependencies READY; chọn **một day pack** hoặc phần lõi chặn pack; tạo `codex/life-<track>-<task-id>` từ main SHA. Không invent new feature without user design; nội dung phải khớp Bible.
3. **15–40' Build**: code/content + unit/golden tests + migrated save fixtures; authored episode mới phải có route fail-forward và hậu quả ≥1 ngày.
4. **40–50' Verify**: `npm ci`, `npm test`, `npm run build`, production preview Playwright dọc/ngang desktop nếu đổi UI/render; 10s warmup + 30s sample nếu thay perf; log devices/limits.
5. **50–60' Report**: commit push PR, CI SHA, artifacts, update `docs/iterations/...` và task status `planned|in_progress|blocked|review|accepted`; merge **sau** CI/acceptance, post-merge CI. Việc lớn không xong thì để lại nhánh/PR và tiếp tục vòng sau, không đổi mục tiêu giữa chừng.

**Không yêu cầu agent ngồi chờ đúng 60 phút**: runner/CI dài hơn thì trạng thái pending được xử lý ở lượt kế; tự động thực thi 1 lần/giờ là giới hạn công cụ, không hứa mỗi lần có ngày playable.

## PR contract và tên

PR title `life(day-012): rainy dinner with friends` hay `life(core): deterministic scheduler`; body gồm: scope, changed files, base SHA, contentVersion, save migration, test/build link, screenshots mobile dọc/ngang, performance delta, risks, follow-up; labels if available: `life/core`, `life/content`, `perf-gate`, `blocked-device`.

**PR rules**: main green trước; tests của PR green đúng SHA; nếu game code đổi phải smoke open shop/serve/deliver/NPC/collision; nếu change draws require M1 before/after và device acceptance; if blocked keep PR draft/open, not merge to avoid damage. Sau merge CI `main` xanh đúng merge SHA; rollback if fail.

## Release evidence / real devices

- Android 3–4GB GPU phổ thông (model, OS, Chrome version, DPR/orientation), iPhone target (iOS Safari).
- 360×800, 390×844, 844×390, 1280×800; screenshot same camera; 15min journey memory plateau, multi-touch joystick+camera, pause/reload, shop/market/home/restaurant/NPC/health as implemented.
- Draw calls/triangles + P50/P95 frame interval + CPU sim/submit + geometry/texture/skeleton + actual user-visible load; main/shadow breakdown if available. Real device if unavailable: **NOT VERIFIED**.
- Benchmark gate M1 (>=40%, P95 <=+10%) is relative to baseline; target absolute per previous production roadmap separately.
- Security/content: no PII, no health data users, real current market prices require sources, art rights manifest and attribution.

## Reporting template

```markdown
# Iteration <id> — <date>
Starting main SHA: ...; branch/head SHA: ...
Task/owner/dependencies: ...
Feature and scene/content IDs:
Tests/build: links and counts
Visual/viewport/real-device evidence: ...
Metrics (baseline/new): ...; M1 status: ...
Save migration and rollback: ...
Risks, missing proof and blocker: ...
PR: ...; merge SHA/main CI: ...
Next exact task: ...
```
