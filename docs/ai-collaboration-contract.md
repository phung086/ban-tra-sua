# Quy ước phối hợp AI — Tiệm Trà Phố Nhỏ

## Tài liệu nguồn sự thật

Đọc theo thứ tự: `docs/development-cycle-hourly.md` → `docs/production-roadmap.md` (nếu có trên main) → `docs/life-sim-game-design.md` → `docs/visual-gameplay-direction.md` → code hiện tại → báo cáo iteration gần nhất. Nếu tài liệu chỉ có trên nhánh khác, ghi rõ ref, không mặc nhiên coi đã merge.

## Bất biến

- Chỉ làm trên nhánh `codex/<task>-<date>` mới tạo từ SHA main đã kiểm chứng hoặc tiếp tục đúng nhánh của mình. Không sửa `codex/mobile-beta-foundation` hoặc `codex/m1-benchmark-gate-isolated`.
- M1 phải giảm ≥40% draw calls góc toàn phố light và P95 không tăng >10% cùng điều kiện đo; không mở M2 trước khi đạt. Android RAM 3–4 GB và iPhone phải được đo thật trước khi tuyên bố chơi mượt.
- Không xóa/migrate save một cách âm thầm; không nhận thưởng hai lần; không xuyên collider; không làm hỏng điều khiển mobile; không đưa asset không rõ giấy phép.
- Không tự merge khi thiếu CI đúng SHA, build, smoke và gate thay đổi. Nếu blocker: giữ nhánh, báo rõ và tiếp tục vòng sau.

## Quyền sở hữu theo module

| Vai trò AI | Phạm vi ưu tiên | Hợp đồng giao tiếp |
| --- | --- | --- |
| Core simulation | `src/game/engine.ts`, `types.ts`, `city.ts`, `storage.ts` | Action thuần, state typed, migration và idempotent ledger |
| Narrative | `src/game/neighborhoodStories.ts`, `cityEpisodes.ts`, dữ liệu episode mới | Stable IDs, conditions/effects whitelist, graph validator |
| 3D/world | `src/scene/*`, `cityMap.ts`, `collision.ts` | Render LOD độc lập collider, dispose tài nguyên, đo FPS/draw calls |
| UI/mobile | React components, CSS, accessibility, joystick | Safe area, 48px targets, touch cancel/blur, test 3 viewport |
| QA/performance | Test, benchmark, `docs/iterations/*` | Repro seed/save/viewport, same-device before/after, CI SHA |
| Content/Art | Original models, texture atlas, manifest license | Art budget, LOD, before/after camera, fallback Light |

Hai AI đụng cùng tệp phải tách PR hoặc phối hợp trước; không cherry-pick nhánh AI khác khi chưa kiểm tra xung đột và quyền sở hữu.

## Đơn vị công việc một vòng

Mỗi vòng có một `taskId`, baseline SHA, một tiêu chí thành công đo được, danh sách tệp, tests, ảnh/trace nếu có, PR link, gate và blocker. Thứ tự: kiểm main/PR/CI → hoàn tất task dở → code nhỏ → test/build/preview/benchmark → báo cáo → PR → merge khi đạt → CI merge SHA.

Nội dung ngày mới có trạng thái `idea/scripted/playable/measured/reviewed/released`; chỉ `released` mới tính là màn mới. Mỗi ngày cần ít nhất một tương tác thật, hai cách xử lý có hệ quả sau đó, đường phục hồi khi thiếu tiền/đồ/NPC, test save/reload và reward once. Nếu chưa đạt, tiếp tục sửa ngày đó thay vì tự ghi đã phát hành ngày tiếp theo.

## Mẫu báo cáo

```md
# Iteration <taskId>
- Baseline main SHA:
- Branch / HEAD SHA:
- Files changed:
- Functional behavior:
- npm test / npm run build / CI run URL:
- Browser viewport / screenshots / console:
- Benchmark device/browser/seed/quality/camera/warm-up/sample:
- Draw calls, triangles, frame P50/P95, CPU submission, memory:
- Android/iPhone verification: measured / not measured
- Save migration / reward-once / collision / input:
- PR URL / merge SHA / main CI:
- Gate: pass / fail / pending; blocker; next task:
```

## Tính an toàn của dữ liệu

Không ghi token, email cá nhân, địa chỉ thực, tài khoản hoặc dữ liệu sức khỏe của người chơi vào báo cáo. Tình huống game là hư cấu. Nguồn tham khảo Three.js dùng tài liệu chính thức; ảnh/tài nguyên Hà Nội dùng để tham khảo phong cách, không sao chép nếu chưa có quyền.
