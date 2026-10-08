# QA / ACCEPTANCE — không gọi là playable nếu chưa kiểm thử

## Ma trận nghiệm thu từng tính năng

| Mức | Logic/data | UI/3D | Device & performance | Có được merge main? |
| --- | --- | --- | --- | --- |
| Documentation | Mọi link và ID hợp lệ, không tuyên bố tính năng đã có | Không đổi build runtime | CI đúng SHA | Có, nếu test/build green |
| Pure core/validator | Deterministic, no softlock, save fixtures, error handling | Không bắt tải asset mới | CI green; không regress game cũ | Có, sau review contract |
| Day content (chưa playable) | Schema/graph + consequences hợp lệ | Không có UI gameplay mới | CI green; báo rõ là “planned data” | Có nếu content pipeline đã được kiểm chứng, không gọi accepted day |
| Day playable (đã tích hợp) | Wake→shop/home/social→sleep và 3 save states | Phải chơi được thật, xem ảnh/console | Portrait/landscape desktop, old save, performance nếu visual đổi | Có sau mọi gate |
| Mở rộng scene/asset | World loading/id stable/collision | LOD, frame/camera, interior | M1/M2 passed & Android/iPhone | **Không** nếu chưa đủ |

## Kịch bản kiểm thử hệ thống

### 1. Day engine golden tests
- `seed=S01,day=1`: open đúng giờ, học pha ly, đi chợ và ăn. `seed=S01,day=4`: ngủ quên một lần, reload không random lại.
- `seed=S02,day=8`: nhóm Lan/Duy/Thảo có số người tham gia xác định; đóng lại mở lại không đổi người trả tiền. Từ chối bữa ăn không mất tiền.
- `day=14` bills: trước hạn hiển thị cảnh báo, thanh toán 1 lần đúng số tiền, double-click không trừ gấp đôi; cash=0 có giãn hạn.
- `day=17` accident: không tự xuất hiện lúc nhân vật xuyên vật cản; có route khám/nhờ hỗ trợ và tránh hình ảnh máu me.
- `day=30`: ít nhất 2 outcome dựa vào trust/cash/commitments, replay save không nhân thưởng.

### 2. Nội dung và sức khỏe của game
- 30 day plans không có nhân vật chết/bệnh nặng tự phát ngẫu nhiên khiến mất khả năng chơi.
- No stereotype theo giới, tuổi, gia cảnh, bệnh; tài chính căng vẫn có đường giải quyết, không phán xét người nghèo.
- Bữa ăn xã hội không âm thầm ép trả, thoại có giới hạn câu, NPC có lịch và khả năng từ chối lời mời.
- Câu chuyện buồn có cảnh báo nhẹ khi phù hợp, có skip dialogue/reduced motion, không truyền thông điệp y khoa sai lệch.

### 3. Multi-agent merge safety
- Dùng exact main SHA và cập nhật backlog `status` với evidence, không chạm file đang thuộc ownership agent khác.
- Chỉ một PR được merge trên `main` mỗi lần; stale branch rebase hoặc refetch trước merge.
- Backup/restore save v3 fixture. No reset `GameState` khi nâng version.
- Phân biệt content ID (stable), visual skin variation (seeded per district) và physical collider entity (stable).

### 4. Controls/navigation
- Mobile touch 1 và 2 ngón, joystick+camera song song, pointer capture cancel/blur, xoay 90°, 360×800, 390×844, 844×390, desktop.
- Collider: tree trunk, wall, indoor furniture, vehicle body, lakeside edge, all doors/portal. Thử teleport/large dt, route collision, NPC yielding, camera clipping; no ghosting on zone transitions.
- Day start & sleep giữ vị trí được phép, không spawn trong vật thể. Trang phục/xe thay đổi không phá collider.

### 5. Performance target trên **máy thật**
- Đo baseline/after giống thiết bị, viewport, quality, seed, weather, camera, warm-up 10s, sample 30s. P50/P95 frame, draw calls main/shadow nếu có, triangles, CPU sim/submit, assets loads and memory.
- M1 overview light: giảm >=40% calls, P95 increase <=10%; chưa đạt thì không mở rộng 3D, và CI xanh không đủ nghiệm thu.
- Light absolute design target: 30FPS 15 phút, P95 ≤40ms, >100ms <1% ngoài transition, follow≤200 calls/overview≤300, triangles follow≤150k/overview≤250k. Đây là **target** chưa chứng minh.
- Android 3–4GB and iPhone thật: model/iOS/OS/browser/RAM reported and measured, orientation + long scene walk + render stress; mượn máy/hạ scope nếu không có. Hardware hint `deviceMemory` không phổ biến trên tất cả browser, quality phải có fallback.
- Định kỳ memory-soak 10 lần vào/ra zone, không unbounded textures, colliders hoặc event listeners.

### 6. Content counters (dashboard)
- `daysPlanned` = mô tả đã viết; `daysValidated` = schema/graph pass; `daysPlayable` = e2e pass; `daysReleased` = merge main + post-merge CI green.
- `districtsDesigned` ≠ `districtsStreamable` ≠ `districtsPlayable`.
- `actorsDesigned` ≠ `actorsAnimated`; ghi rõ model/rig/memory.
- `dailyVariantCoverage`: tỷ lệ seeds khác nhau tạo đa dạng thực (khách, bữa ăn, tình huống), không đếm trang phục random là story mới.

## PR / report minimum

Mọi vòng có `docs/iterations/<task>.md`: SHA đầu, thay đổi, test/build CI URL, run artifact, ảnh, seed, bug/regression, save/migration, kế tiếp. Cột device ghi rõ `not tested` nếu chưa có thiết bị. QA không được bịa kết quả benchmark.

## QA gate “day N shipped”

`dayN` ship khi: dependency core integrated, đủ beats, no softlock, ledger idempotent, save/resume, seeded reproducibility, portrait/landscape mobile and desktop smoke, CI exact SHA, không tăng memory/FPS đáng kể, reviewer xác nhận phong cách cốt truyện. `M1` chặn thêm 3D district/asset mới, **không** cản commit docs/day logic không tăng render cost.
