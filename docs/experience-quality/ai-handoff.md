# AI execution contract — một backlog, nhiều AI, không phá gate

## 1. Phạm vi và thứ tự ưu tiên

Mọi AI đọc theo thứ tự: yêu cầu người dùng mới nhất → docs/production-roadmap.md → docs/iteration-protocol.md → docs/iterations/m1-01.md nếu M1 còn mở → docs/next-step-prompt.md → [quality README](README.md) → [backlog](backlog.md) → [quality gates](quality-gates.md) → Game Design Bible/source và latest iteration. **Lệnh mới hơn của chủ dự án ưu tiên hơn task status cũ nhưng không âm thầm hạ cổng acceptance.** Một tài liệu backlog không có quyền chuyển milestone hoặc tự merge main.

**Cột PLAN không đồng nghĩa code chưa tồn tại.** Trước khi nhận một ID, đọc file thực tế và test để phân biệt: existing / partial / missing / broken; viết kết quả audit vào issue/report. Chỉ chọn một ID có dependency được mở và bề mặt sửa đủ nhỏ; các AI đang lên thiết kế có thể nhận task độc lập ở docs/test harness M1 chứ không phá core runtime.

## 2. Ownership / file conflict

| Vai AI | Mảng task | File/contract ưu tiên (không độc quyền tuyệt đối) | Tối thiểu khi giao |
| --- | --- | --- | --- |
| **Integrator / release steward** | QI, gate tracking, final quality review | next-step-prompt.md, roadmap, reports, workflows | branch SHA/CI, conflict audit, acceptance evidence; không tự merge/deploy |
| **Feel engineer** | QF | movement.ts, MovementStick.tsx, scene runtime | pointer traces, cancel/blur, camera 2-finger video, collision regression |
| **Character technical artist** | QC | actorGeometry.ts, models.ts, skeleton/rig tests | anatomy turnaround, pose clips, LOD/material budgets, licenses |
| **Environment artist/engineer** | QR, QV lighting | city.ts, cityDetails.ts, materials.ts, textures, worldAtmosphere | near/far screenshot matrix, render counters, no prop collision regression |
| **VFX/audio designer** | QV interaction, QS | CraftWorkbench/DrinkCup/ServeCelebration, audio.ts | clip/audio evidence, trigger-state correctness, reduced-motion/mute |
| **Gameplay designer/engineer** | QG | engine.ts, service.ts, customerAi.ts, cityEpisodes.ts | session route, choice->state, economy/save invariants, non-grind metrics |
| **Narrative/NPC** | QG dialogue, QL | neighborhoodStories.ts, neighbors.ts, day packs | actor voice, branching consequence, validator/seed replay |
| **UI/accessibility** | QU | App.tsx, GameSettings, PlayCoach, world UI | mobile viewport snapshots, keyboard/pointer focus, target sizes |
| **Performance/QA** | QI, QR LOD, quality gates | benchmark scripts, workflows, renderQuality.ts, tests | same-SHA before/after, CI exact SHA, device blocker records |

Một AI **không được** âm thầm sửa file do AI khác đang thay, force-push, rebase/xóa commit của người khác, thay đổi main, sửa branch khác hoặc merge/deploy. Trước commit: fetch/ref latest SHA, so files tree, compare expected head; update_ref dùng expected_sha và force=false. Nếu head thay đổi, inspect diff và làm lại trên remote head mới, không ghi đè. Shared files App.tsx, engine.ts, storage.ts, city.ts, docs/next-step-prompt.md và roadmap: chỉ integrator ghi vào một thời điểm hoặc phân công thứ tự. Agent khác cung cấp patch + tests + clip/asset manifest.

## 3. Một task = một work order

    WORK ORDER
    task_id: QF-03
    status: PLAN
    code_branch: codex/mobile-beta-foundation
    baseline_remote_sha: <verified at start>
    active_milestone_and_gate: M4 (do not start unless M1–M3 accepted)
    root_cause_or_qualitative_observation:
    scope_files: [src/scene/runtime.ts, relevant tests]
    explicitly_out_of_scope: [new NPC system, visual asset pack, save reset]
    dependency_task_ids:
    proposed_change: 1 narrow slice with fallback
    functional_acceptance:
    subjective_review: 20–60s before-after motion clip + independent reviewer
    perf_matrix: 390x844 and 844x390 light/balanced + low phone gate
    test_commands: npm test; npm run typecheck; npm run build; browser smoke
    evidence_paths:
    rollback_strategy:
    expected_sha_lease:
    handoff_owner:
    next_single_task_id:

**Chưa có source SHA, acceptance, fallback hoặc dependency mở → không bắt đầu sửa runtime.** Có thể lập spec và đánh dấu PLAN.

## 4. Quy trình vòng lặp chất lượng, tích hợp cùng protocol

1. **Preflight**: kiểm tra remote HEAD và CI của SHA đó, roadmap gate, prompt đang active, PR/branch/CI của các AI khác để không làm trùng. Đọc backlog ID đang nhận và nguồn code/test thực tế. Không dùng số liệu trên nhánh khác.
2. **Observed baseline**: ít nhất một bug/điểm yếu có route tái hiện; ảnh+clip nếu visual/feel; thông số baseline nếu perf. Nếu mới có feedback, ghi là hypothesis cần xác minh.
3. **Thiết kế 2 phương án nhỏ**: ví dụ animation state blend vs thay full rig; ghi pros/risks/quality tier; không đổi renderer cho một vấn đề anim nhỏ.
4. **Chọn chỉ 1 phương án**: kiểm tra phạm vi và dependencies. Chỉ một runtime feature mỗi vòng; task phụ cho fixture/report là được.
5. **Thực thi**: không hardcode nội dung nhiệm vụ tràn App.tsx, data-driven nếu có story/asset; giữ save và gameplay; tránh dependency/texture không rõ license.
6. **Test đúng hành vi**: unit/integration/visual screenshot/clip; trên M1 thêm full production A/B; không bỏ asserts, không rút mẫu lén. Chạy npm test/typecheck/build hoặc CI ghi rõ thực tế.
7. **Review**: người khác đánh giá rubric; nếu thiếu người review thì ghi PENDING_HUMAN_REVIEW, không tự gắn ACCEPTED. Điện thoại thật chưa có → DEVICE_BLOCKED.
8. **Decision**: đẹp và gameplay tốt hơn *và* không phá budget → commit giữ; không chứng minh → experiment/prototype, điều chỉnh; lỗi P0/regression → revert code riêng task, không đụng work người khác.
9. **Commit / branch lease**: commit code+tests+iteration report + prompt next-step, push đúng branch, verify remote HEAD and **exact-SHA CI**. Nếu tool write bị chặn, giữ lịch/task mở và làm việc độc lập; ghi error thật, không nói đã push.
10. **Handoff**: task ID + trạng thái từng gate + screenshot/video + baseline/candidate SHAs + CI + decision + đúng 1 prompt bước kế tiếp. Không tự đổi milestone.

## 5. Status semantics và hậu quả

- PLAN: ý tưởng đã có brief, chưa chứng minh source/app làm được.
- PROTOTYPE: mock/isolated trial chưa tích hợp gameplay; không dùng làm số liệu production.
- IMPLEMENTED_UNVERIFIED: code push/build có thể tốt nhưng chưa đủ screenshot/QA/perf/gameplay.
- MEASURED: có trước/sau cùng cấu hình, ảnh/clip/CI và nhận xét đầy đủ; **không phải nghiệm thu** nếu device gate còn thiếu.
- BLOCKED: dependency/permission/asset/device/test condition cụ thể, có owner/fallback; không trộn blocker của cả milestone với task độc lập.
- ACCEPTED: functional + visual + performance + integrity + device/human review **đúng gate** đã được xác minh.
- REVERTED: đã quay lại mã, giữ nguyên báo cáo bài học và link commit.

Bản cập nhật 1 dòng mỗi epic ở báo cáo mới: planned / in-progress task ID / last measured evidence / blockers; tuyệt đối không tô xanh cả epic chỉ vì số task được viết dài.

## 6. Không làm sai thứ tự chỉ vì muốn game đẹp ngay

**Cập nhật 10/10/2026:** chủ dự án đã trực tiếp xác nhận pass toàn bộ M1 và cho phép mở M2; xem docs/iterations/m1-owner-signoff-2026-10-10.md. Nghiệm thu là xác nhận của chủ dự án, không phải kết luận AI có raw mobile trace. M2 chưa accepted. Vì thế:
- Được làm ngay trong M2: QR-05/QR-10 (LOD/culling/instancing, zone streaming và dispose), cùng QI-01/03/04/05/06/07/09/11 hỗ trợ bằng chứng; tiếp tục đòi dữ liệu thiết bị thật, không dừng lại ở SwiftShader.
- Chờ milestone: bản thay asset/rig hàng loạt, thay loop nhiệm vụ, postprocess/VFX nặng, hệ NPC lịch mới. Chuẩn bị scene/style spec và test fixture **không** có nghĩa đã triển khai.
- Sau khi M1/M2 qua gate, chọn **vertical slice chất lượng**: 1 nhân vật chính + 1 NPC + 1 mặt tiền tiệm + 1 lượt pha/giao, chứ không nhân rộng hình đẹp vào cả map rồi mất 30fps.
- Đối với feature lớn ở roadmap M3–M7, chia thành asset sample → rig/logic sample → integration sample → QA/mobile → rollout. Fail ở đâu quay lại đó.

## 7. Prompt cho AI tiếp theo — template

> Hãy đọc current remote SHA/CI của phung086/ban-tra-sua nhánh codex/mobile-beta-foundation và các tài liệu roadmap, protocol, m1-01, next-step, docs/experience-quality/README.md, backlog.md, quality-gates.md, ai-handoff.md. Chỉ lấy **một task ID** đang hợp lệ và đúng milestone mở, ghi baseline theo route; triển khai thực hoặc sửa bug có thể đo, không chỉ liệt kê ý tưởng. Test + build, ảnh/video trước/sau nếu cảm giác/visual, gameplay và performance match; không hạ gate, không ngụy tạo Android/iPhone. Commit/push chính nhánh sau lease SHA, verify exact-SHA CI; nếu chưa đủ gate thì đánh dấu đúng PLAN/MEASURED/BLOCKED. Không sửa main, không merge/deploy. Báo task ID, file thay, evidence, CI, next single task và blockers.

**Nếu tool/ quyền chặn:** retry hợp lệ theo lỗi và làm doc/test/asset audit độc lập; không tự tắt một recurring loop đã được người dùng yêu cầu chỉ vì một lần push lỗi. Để chủ dự án chọn tắt lịch nếu cần.
