# Playbook phối hợp nhiều AI: từ M1.1 tới “mỗi vòng một ngày”

> **Tài liệu giao việc dài hạn**. Áp dụng khi có nhiều AI cùng repo; quy trình hiện hành [iteration-protocol](../iteration-protocol.md) và [next-step-prompt](../next-step-prompt.md) **luôn ưu tiên hơn** backlog dài hạn. Không coi bất kỳ epic LC nào đã triển khai vì xuất hiện ở đây.

## 1. Thứ tự nguồn sự thật, giới hạn và quyền sở hữu

1. **Yêu cầu mới nhất của chủ dự án** (phạm vi, cổng không được bỏ qua, nhánh được phép).
2. **`docs/production-roadmap.md`**, `docs/iteration-protocol.md` và milestone đang active.
3. **`docs/next-step-prompt.md`**: đúng một nhiệm vụ kỹ thuật tiếp theo, thường xuyên được cập nhật.
4. **`docs/game-design/README.md`**: hướng sản phẩm dài hạn; các tài liệu còn lại: systems, story/day packs, world/performance, data/save.
5. **Mã nguồn, tests, ảnh/video/benchmark artifacts**: hiện trạng triển khai thực, không suy diễn chức năng từ docs; khi xung đột phải báo và điều chỉnh docs/plan qua review.

AI không được: âm thầm sửa `main` hoặc nhánh AI khác, force-push, merge/deploy, hạ performance gate, reset save, cài dependency lớn không đo, viết giá giả thành giá thực, bật runtime generative AI bịa story, tạo tài sản không bản quyền, hoặc tự khẳng định Android/iPhone đã được thử nếu chưa có log thiết bị thật.

## 2. Backlog theo dependency (không bỏ qua M1–M10)

| Epic ID | Phạm vi, deliverable | Phụ thuộc / gate |
| --- | --- | --- |
| `NOW-M1.1` | so sánh production sector16/32, ảnh, joystick/camera/va chạm/NPC/pha-giao, CI cùng SHA, thiết bị thật | **đang mở; ưu tiên số 1** |
| `CORE-M2..M4` | streaming/LOD, asset, input/collision/NPC | chỉ theo roadmap khi mốc trước được nghiệm thu |
| `CORE-M5..M10` | story state, hành trình beta, UI, save, release | đúng roadmap, hoàn tất beta trước tuyên bố LC |
| `LC-00` | thống nhất Game Bible/ID glossary/schema và module boundaries | thiết kế có thể song song, không mutate runtime |
| `LC-01` | DayDirector calendar/clock/seed/state + validator + fixture 7 ngày | sau gates core state/save tương ứng; QA/replay |
| `LC-02` | Routine nhà–chợ–nấu ăn–hunger/energy, 2 mức khó | sau LC-01, zones/assets/mobile gate |
| `LC-03` | Persistent social, friend group, schedules, transparent split bill | sau LC-01/LC-02 |
| `LC-04` | Chuyên sâu khách và economics, weekly bills, repair paths | sau LC-01; giữ shop engine hiện hữu |
| `LC-05` | Health/wellbeing, phòng khám, một story arc tử tế | sau LC-02/LC-03/zone civic |
| `LC-06` | AI NPC schedules, traffic density, culling/vehicle collisions | sau stable nav/collision M4 |
| `LC-07` | 30 day packs/3 arcs, dynamic events bounded | sau LC-01..05, release từng ngày |
| `LC-08` | zones ngoại ô/bến xe → thành phố kế bên → biển | sau world streaming/load budget stable |
| `LC-09` | catalog production cho 60/90/365 ngày, user research/QA/cân bằng | phụ thuộc chất lượng và công cụ authoring; không khẳng định hoàn thành vô hạn |

**Gates đề xuất mỗi epic:** nhu cầu/hành vi (functional), state/reload/migration (integrity), hình ảnh/animation (visual), thiết bị yếu (performance), story coherence (content), accessibility (UX), CI SHA (release). Bất kỳ gate thất bại → fix/revert/blocked; không đánh dấu done.

## 3. Quy trình cho một vòng thêm đúng một ngày

Vòng phát triển chỉ chọn `day N` khi engine/supporting zone đã đạt cổng. **Không phải tạo ngày mới khi ngày trước còn bug/blocker.**

1. **Đọc:** toàn bộ `production-roadmap`, protocol, next-step prompt, Game Bible, story index, schema, báo cáo ngày trước, source current branch.
2. **Mục tiêu duy nhất:** ví dụ `LC-D08` “Ngày 08 – Ngày yên ả”; nhập 1 day pack + chỉ assets/behavior cần thiết; không đồng thời build vùng biển.
3. **Spec một ngày:** `ID`, chapter, opening/time line, 1–3 beats, NPC schedule, required assets/zones, interactions, conditions, inventory/cash/health costs, các lựa chọn, story consequences today/next days, soft-fail, accessibility, test seeds và screenshot checklist.
4. **Triển khai data trước** qua schema/validator; engine work chỉ nếu hợp đồng chưa có, tách commit và tests; không hardcode `dayIndex===N` trong React.
5. **Kiểm thử:** validate graph/refs; seed replay ≥20 fixtures/ngày; 2 đường hoàn thành (happy + soft-fail); reload giữa đoạn, không double credit; NPC không ghost; test mobile input/collider/pause, snapshot image, cost/budget.
6. **Đo:** before/after production same SHA/base route/viewport/engine/quality, screenshot nhân vật/bối cảnh; Android/iPhone thật theo gate lúc nghiệm thu. Không thử được thì BLOCKED.
7. **Báo cáo:** `docs/iterations/lc-dNN.md` chứa source SHA, commit, screenshots link/artifact, benchmark table, tests, limitations, content coverage, choices→consequences và prompt duy nhất cho vòng kế.
8. **Giao:** push đúng branch, xác minh remote SHA và CI xanh; không tự merge/deploy. Nếu ngày N failed, quay lại sửa; không tạo ngày N+1 để che lỗi.
9. **Sau thành công:** cập nhật content index/chapter/gate record, người chơi tiếp tục trên save cũ và cả save mới; không di chuyển màn UI tùy tiện.

### Mẫu bàn giao ngày (copy và điền, không để placeholder trong báo cáo nghiệm thu)

```md
# LC-DNN — <tên ngày>
Source branch/head; baseline CI; goal & acceptance.
DayPack + StoryBeat IDs, NPC/city/asset dependencies, saved flags.
Walkthrough: 06:00 wakeup → … → closure.
Choices A/B/(C): conditions, costs, visible effects now/next day.
Failure/skip/recovery paths.
Screenshots: morning/scene interaction/evening at 360×800, 390×844, 844×390, desktop.
Same-config before/after: draw calls, main triangles, CPU phases, P50/P95, memory, sample frames.
Tests: unit, content validator, production browser and device matrix.
Save migration/replay/versioned pack/license evidence.
Exact remote SHA / CI conclusion / unverified blockers.
NEXT: only one small milestone after all gates pass.
```

## 4. Phân quyền giữa các AI

Một AI tích hợp chính chịu trách nhiệm **định nghĩa API và merge resolution** (nhưng không merge lên main khi chưa được phép). Các agent khác xây tác vụ nhỏ độc lập, khác file paths/bounded module:

| Agent role | Output | Không được tự quyết |
| --- | --- | --- |
| **Director / Integrator** | phân rã công việc, API contracts, acceptance, release notes | bỏ cổng M1, merge/deploy không phép |
| **Simulation/Economy** | typed reducers/needs/bills/ledger tests | thay story/giá/UX ngầm, reset save |
| **Story/Localization** | beats/day pack/dialogue/branch map, proofread | tự thêm effect/code, lấy số liệu benchmark |
| **NPC/World** | schedule, nav/collision/traffic, zones | phá spawn IDs hoặc tăng draw calls không đo |
| **3D/Animation** | GLB/rig/LOD/material, licenses, near/far screenshots | thay engine và asset budget không review |
| **Mobile/Performance** | profiler/LOD/CI browser/device matrix | tuyên bố device pass bằng SwiftShader |
| **QA/Accessibility** | test seeds, save migration, usability, regressions | giả định P0/P1 đã hết từ 1 test |

**Handoff artifact bắt buộc:** commit/base SHA, branch, touched files, contract version, module imports/exports, tested commands, CI url, added assets/licenses, before/after perf, known blockers, next task. Tránh hai AI cùng sửa `src/App.tsx`, `engine.ts`, `storage.ts`, `production-roadmap.md` đồng thời. Trường hợp cần cùng file, một người tích hợp cherry-pick sau diff review trên branch hiện hành, **không tự merge nhánh người khác**.

## 5. Definition of Done chung

Một tính năng được gọi **implemented** khi đã có code chạy thật, tests hành vi pass, UI thích hợp và data/asset license. Một mốc được gọi **accepted** khi thêm benchmark/devices/story evidence mà roadmap yêu cầu. Tài liệu/spec/screenshot mockup **không đồng nghĩa implemented**.

Không làm các thủ thuật sau: gán test success dù workflow đang pending, silent catch assertion, bypass gameplay state để smoke pass, rút ngắn warm-up/sample không báo, so sánh khác Chromium/camera/DPR/light mode, mô tả “real-time prices” từ giá giả định, dùng LLM runtime sinh NPC không qua validation hoặc thêm 100 ngày duplicate lời thoại.

### Báo cáo trạng thái phải có (bắt buộc)

- `PLAN` / `IMPLEMENTED_UNVERIFIED` / `MEASURED` / `BLOCKED` / `ACCEPTED`; tách trạng thái **code**, **CI**, **browser benchmark**, **device**, **story coverage**.
- Nếu 1/5 cổng chưa đạt, tổng thể **chưa nghiệm thu**.
- Khi thiếu thiết bị thật, ghi model cần, checklist 15 phút và phương án tự tiếp tục việc độc lập (ví dụ viết data validator/test save), không mượn từ “đã tối ưu mobile”.
- Mốc tương lai giữ trong backlog; mỗi phiên chỉ báo **một next-step prompt có thể hoàn thành và đo**.

## 6. Kiểm soát mở rộng không giới hạn

- Không có `maxDayCount` hardcode; day pack index + arc/chapter world manifest và validator scale theo số pack.
- Không tải cả 365 ngày/7 thành phố trước gameplay; lazy content assets và phân vùng state/IDs.
- Content repetition dashboard: số beat độc đáo, tỷ lệ lặp archetype trong 7 ngày, mối quan hệ không sử dụng, chưa có kết thúc, unreachable branches.
- Mỗi batch 7 ngày có ít nhất 1 sự kiện gia đình, 1 sự kiện bạn bè, 1 việc kinh tế tiệm, 1 nhịp nghỉ; tối đa biến cố lớn theo severity budget. Đây là biên tập, **không ép hoàn toàn bằng thuật toán**.
- Trước release content pack: 100 seed simulation, human narrative review, test máy yếu với asset mới, save upgrade/downstream; rolling content không tạo “ngày 30 là game over”.
- Nếu ngày mới chỉ thay seed của 1 template cũ, dán nhãn **daily variation**, không quảng cáo là màn truyện có nội dung hoàn toàn mới.

## 7. Prompt handoff cho AI tiếp theo (khi tới LC, không dùng để bỏ qua M1)

> Đọc `docs/production-roadmap.md`, `docs/iteration-protocol.md`, `docs/next-step-prompt.md`, `docs/game-design/README.md` và 5 tài liệu liên quan. Kiểm tra remote SHA/CI, mốc hiện hành và blockers. Chỉ triển khai epic LC hoặc ngày N **khi dependency và gates trước đã được nghiệm thu có bằng chứng**. Viết data-driven (stable IDs, schema, deterministic seed), giữ save v3/migrate an toàn, NPC/collision/animation/asset budgets, nghiệm thu mobile. Tác động lên đúng nhánh được giao, không merge/deploy. Tests/build, before/after production matched measurements, commit/push và CI xanh đúng SHA. Nếu cổng chưa đạt, làm nhiệm vụ trong milestone hiện hành hoặc công việc lập kế hoạch độc lập và báo chính xác.
