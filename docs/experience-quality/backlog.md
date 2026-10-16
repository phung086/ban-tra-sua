# Master quality backlog — gameplay, nhân vật, hiệu ứng, chân thực và đồ họa

**Status toàn bộ task khi lập danh mục:** PLAN / CANDIDATE, **không có task nào tự động được xem là đã code hoặc accepted**. Phản hồi chủ dự án là vấn đề ưu tiên, còn mức nghiêm trọng thực tế, thứ tự trong một milestone và tác dụng từng sửa đổi phải được đo. **Mỗi AI chỉ nhận 1 ID cụ thể**, không biến cả epic thành một commit.

**Giải thích cột:** P0 = lỗi làm hỏng core; P1 = tác động chất lượng cao; P2 = polish; NOW = hỗ trợ M1.1 không thay đổi scope, M2...M10/LC theo gate. Đường dẫn là **điểm bắt đầu tìm hiểu**, không phải chứng nhận file đó đã chứa tính năng. DoD chung: [quality-gates](quality-gates.md), [AI handoff](ai-handoff.md), roadmap + protocol; mỗi dòng dưới đây ghi **bằng chứng bổ sung riêng**. Không mua/nhập asset khi chưa rõ license và budget.

## A. QI — Nền tảng đánh giá chất lượng (NOW / M1.1), 12 task

| ID | Prio | Công việc cụ thể / vị trí xem xét | Tiêu chí hoàn thành riêng / bằng chứng |
| --- | --- | --- | --- |
| QI-01 | P0 | Khoá 4 góc camera tham chiếu tiệm, gần NPC, đường phố và overview; src/scene/runtime.ts, scripts/m1-browser-benchmark.mjs | 360×800, 390×844, 844×390, 1280×800; cùng spawn/yaw/giờ/chất lượng; trước/sau có cặp PNG định danh SHA |
| QI-02 | P0 | Thử kiểm chứng M1.1 trên Android RAM 3–4GB + iPhone hỗ trợ; docs/iterations | 15 phút/máy; ghi model/OS/browser/DPR, FPS/P95, memory/nhiệt nếu có, thao tác 2 ngón, joystick/camera/NPC/xe/tường/pha-giao; không giả kết quả |
| QI-03 | P0 | Hoàn thiện bộ benchmark overview light/balanced và follow before/after; scripts/m1-browser-benchmark.mjs | same Chromium/viewport/DPR/seed/route/10s+30s, >=40% giảm calls overview light, P95 không tăng >10%; không mất screenshot, gameplay đầy đủ |
| QI-04 | P1 | Chuẩn hoá quay clip 30s thao tác joystick + quay camera + NPC + giao ly; scripts/ QA | hai nguồn code SHA cùng route/touch script; lưu clip/trace/screenshot với metadata, thấy pop-in xuyên từng frame |
| QI-05 | P1 | Nâng A/B culling đảo thứ tự 12/16 và radius35/42; scripts/m1-near-ab-benchmark.mjs | mỗi cấu hình tối thiểu 2 lượt đảo AB/BA trong cùng runner; trung vị + min/max, frame counts, ảnh cùng góc; không chọn từ 1 mẫu nhiễu |
| QI-06 | P1 | Lập asset inventory, nguồn và license rõ ràng; public/assets, public/textures/sources.json, src/scene/models.ts | mọi asset dùng thật có ID, tác giả/license/attribution, kích thước, LOD, tải ban đầu, trạng thái chưa rõ license thì không ship |
| QI-07 | P1 | Mô tả camera pose, character pose, fixture save và thời điểm cố định; src/scene/runtime.ts | baseline có fixture tái lập, khác biệt ánh sáng/animation được khóa hoặc tách phần biến thiên; không gọi diff giữa pose khác là regression |
| QI-08 | P1 | Kênh báo cáo render budget phân tách main/shadow khi engine hỗ trợ; src/scene/threeRenderer.ts | draw calls/triangles/frame interval + CPU simulation/submission; GPU time 'unsupported' nếu không có API; không trộn đơn vị |
| QI-09 | P1 | Checklist lỗi visual của 1 nhân vật + 1 NPC + 1 cửa tiệm; src/scene/actorGeometry.ts, src/scene/city.ts | 4 góc gần/xa/ánh sáng + 6 lỗi anatomy/material/collider được khoanh ảnh; tạo issue task rõ độ ưu tiên |
| QI-10 | P1 | Kiểm test input cancel/blur/resize và đường giao hàng; src/components/MovementStick.tsx, src/game/movement.test.ts | bảng 10 tình huống, không kẹt hướng sau pointercancel/blur/modal, không được mất save; giả lập browser không thay device thật |
| QI-11 | P1 | Định nghĩa người quan sát chất lượng, rubric trước/sau và panel ghi cảm nhận; quality-gates.md | trước sửa có score từng trụ cột kèm clip; người khác xem độc lập; không tự chấm hoàn hảo chỉ nhờ test xanh |
| QI-12 | P2 | Kích thước bundle và thời gian interactive theo tier/network; build/Vite, network trace | gzip JS trước khi điều khiển <=1.5MB, data <=5MB và <=10s theo mạng 10Mbps RTT100ms là **mục tiêu roadmap**, báo measured/blocked riêng |

## B. QF — Cảm giác di chuyển và điều khiển (M4, sau M3), 10 task

| ID | Prio | Công việc cụ thể / file candidate | Tiêu chí hoàn thành riêng |
| --- | --- | --- | --- |
| QF-01 | P1 | Tune deadzone, acceleration và deceleration; src/game/movement.ts, src/components/MovementStick.tsx | thử joystick nhỏ/lớn, dừng sau release, quay 90° không trượt quá khó chịu; playback trước/sau 30 FPS trên device |
| QF-02 | P1 | State idle/walk/run/turn-in-place và độ ưu tiên; src/scene/actorGeometry.ts, src/scene/models.ts | không chuyển animation giật, nhân vật dừng chân trong 2 nhịp hợp lý, thao tác disabled không phát pose chạy |
| QF-03 | P1 | Follow camera spring/damping và chống rung khi đổi hướng; src/scene/runtime.ts | quay 180° + chạm NPC + chạy sát nhà; không overshoot, giật mắt, clip vật thể, mất mục tiêu tương tác |
| QF-04 | P1 | Camera obstacle-aware và chuyển follow/overview; src/scene/runtime.ts, src/scene/city.ts | 10 route góc ngõ, mái, xe, cây: camera không xuyên tường, không đột ngột zoom; 4 viewport |
| QF-05 | P0 | Hai ngón độc lập joystick/pan, pointer capture, cancel; src/components/MovementStick.tsx, runtime | giữ di chuyển và xoay cùng lúc; nhả một ngón không mất ngón kia; blur/resize/orientation giải phóng đúng |
| QF-06 | P1 | Feedback va chạm và hướng đi kẹt; src/game/movement.ts, src/game/collision.ts | 12 collider case: không xuyên/teleport/rung tại góc tường; có phản hồi nhẹ khi chạm không hợp lệ |
| QF-07 | P1 | Đường đi tới NPC/đồ vật và auto-move đồng nhất solver; src/game/service.ts | cùng collider với manual movement; unreachable có hướng dẫn, không vòng lặp vô hạn/đâm vào xe |
| QF-08 | P2 | Context-sensitive interact, ưu tiên mục tiêu gần nhất; src/components/StreetWorld.tsx | cùng lúc 3 mục tiêu, chọn đúng mục tiêu hiển thị; không lẫn pan camera với tap NPC |
| QF-09 | P2 | Hỗ trợ tay trái/phải, vùng chạm an toàn dọc/ngang; src/components/MovementStick.tsx, CSS | target tối thiểu 48px, safe-area, người chơi làm đơn đầu không che nút |
| QF-10 | P2 | Rung/âm nhẹ theo thao tác **nếu hỗ trợ**, có cài đặt tắt; src/game/audio.ts, preferences | không phụ thuộc vibration API; tắt hiệu ứng vẫn nhận được feedback thị giác |

## C. QC — Nhân vật, tỷ lệ, cá tính và hoạt ảnh (M3, phối hợp M4), 12 task

| ID | Prio | Công việc / file candidate | Tiêu chí hoàn thành riêng |
| --- | --- | --- | --- |
| QC-01 | P1 | Art bible tỷ lệ theo chiều cao, đầu/vai/cổ/tay/hông/chân và silhouette; src/scene/actorGeometry.ts | bảng tỷ lệ, turnaround front/side/back 1 nhân vật; review ở camera chơi và cận |
| QC-02 | P1 | 1 nhân vật chính vertical slice: mesh liên tục + rig được kiểm tra; src/scene/actorGeometry.ts, models.ts | không hở cổ/cổ tay/đầu gối khi idle/walk, đúng tỷ lệ, không tăng quá asset budget |
| QC-03 | P1 | Mắt, lông mày, miệng, da/tóc không giống nhựa; materials.ts, models.ts | ảnh trung tính/chiếu xiên/góc tối; biểu cảm nhận ra ở cỡ game, không cháy sáng |
| QC-04 | P1 | Tóc/áo/quần theo phong cách Việt hiện đại có bảng màu nhất quán; models.ts | 3 outfit có phân cấp shape/chất liệu rõ, nguồn asset hợp lệ, không xuyên cơ thể |
| QC-05 | P1 | Idle micro-acting (thở, chớp, nhìn) có nhịp; models.ts, runtime.ts | sau 30s không giống máy, không lặp tick giật hoặc bỏ frame; có reduced-motion |
| QC-06 | P1 | Locomotion chân bám đất, stride theo tốc độ; models.ts, movement.ts | quay 45°/90°/180° không slide-foot rõ, bước có nhịp, không chân xuyên đường/bậc |
| QC-07 | P1 | Cầm ly, đặt ly, trao tay có sockets gắn props; models.ts, CraftWorkbench.tsx | không xuyên ly/bàn, tay khớp prop ở 4 camera; tương tác fail/cancel trả pose về an toàn |
| QC-08 | P1 | NPC khác silhouette/vóc dáng/tóc/phụ kiện; src/game/neighbors.ts, models.ts | 3 cư dân nhìn xa khác nhau mà không dựa chỉ vào màu hoặc nhãn |
| QC-09 | P1 | NPC biểu cảm theo trạng thái và lời nói; NeighborhoodDialogue.tsx, models.ts | happy/neutral/frustrated đọc được; thoại không làm mặt đứng im cả cảnh |
| QC-10 | P2 | Khách đa dạng nhưng asset/rig chia sẻ và LOD; ChibiCustomer.tsx, CustomerScene.tsx | trên 10 khách được chọn seed ổn định không clone lộ rõ; memory/triangles theo tier |
| QC-11 | P1 | Đồng bộ nhân vật Three/Babylon nếu vẫn duy trì hai renderer; threeRenderer.ts, babylonRenderer.ts | cùng pose/collider/save; không ép nạp cả 2 engine ngay startup |
| QC-12 | P1 | Gói proof 1 nhân vật/1 NPC/1 prop: idle/walk/talk/carry; actorGeometry, models | video 4 động tác + cận/xa + perf low/medium; chưa pass thì không nhân rộng |

## D. QV — Ánh sáng, vật liệu, VFX và cinematography (M3/M7), 10 task

| ID | Prio | Công việc / candidate | Tiêu chí hoàn thành riêng |
| --- | --- | --- | --- |
| QV-01 | P1 | Color script sáng/trưa/chiều/tối, ấm nhưng không vàng gắt; worldAtmosphere.ts, materials.ts | 4 cặp ảnh camera khóa, da người/biển chữ đọc được, không overexpose |
| QV-02 | P1 | Vật liệu có roughness/normal texture đúng tỷ lệ cho đường/gạch/gỗ/vải; public/textures, materials.ts | 4 macro image; giảm lặp pattern, không parallax giả quá mức; nguồn/license |
| QV-03 | P1 | Bóng tiếp xúc chân và đồ nội thất; worldAtmosphere.ts | không bay lơ lửng, không black-blob/răng cưa ở low; đo draw calls shadow |
| QV-04 | P2 | Light probes/baked detail hoặc shader rẻ cho interior/exterior; shop.ts, city.ts | vùng chuyển sáng/tối hợp lý, không tăng shadow pass vô kiểm soát |
| QV-05 | P1 | VFX rót trà và lớp nước trong ly theo trạng thái thật; CraftWorkbench.tsx, DrinkCup.tsx | không xuất hiện khi hành động fail; thời lượng hợp nhịp, skip/reduced-motion |
| QV-06 | P1 | VFX topping/đóng nắp/khói nhẹ; HoldDispenser.tsx, ToppingTray.tsx | hạt không xuyên ly, không lấn HUD, budget hạt và lifecycle dispose |
| QV-07 | P1 | Trao ly/khách nhận/tiền hoặc tip phản hồi tức thì; ServeCelebration.tsx, service.ts | phản hồi gắn transaction một lần, không phát lại khi reload hoặc duplicate click |
| QV-08 | P2 | Mưa/bụi/ánh đèn môi trường tiết chế theo thời tiết/giờ; worldAtmosphere.ts | tier low tắt được; không phủ toàn màn hay làm người chơi khó thấy nhiệm vụ |
| QV-09 | P2 | Camera composition, framing NPC và cửa tiệm; runtime.ts, StreetWorld.tsx | NPC/mặt tiền không bị che bởi HUD, zoom hợp lý dọc/ngang |
| QV-10 | P1 | VFX profiler và baseline off/on so với GPU budget; renderQuality.ts | main-pass/triangles/frame P95 và 15 phút máy yếu; nếu regression > gate thì tắt/hạ tier |

## E. QR — Cảnh phố, kiến trúc, chuyển động có lý (M2/M3/M4), 10 task

| ID | Prio | Công việc / candidate | Tiêu chí hoàn thành riêng |
| --- | --- | --- | --- |
| QR-01 | P1 | Bộ module nhà ống/mái/ngõ/ban công theo tỷ lệ người; city.ts, cityDetails.ts | 1 tuyến 30m với ảnh ngang tầm mắt, cửa hợp kích thước, không texture lặp quá lộ |
| QR-02 | P1 | Cửa tiệm “hero”: mặt tiền, quầy, bảng hiệu Việt đọc được; city.ts, shop.ts | before/after 4 camera; vào/ra không thấy mesh xuyên hoặc mất bảng |
| QR-03 | P1 | Vỉa hè, gốc cây, trụ điện, xe, vạch đường đúng tỉ lệ; urbanExpansion.ts, details.ts | tuyến mẫu tự nhiên, không chặn đường chơi; collider khớp silhouette |
| QR-04 | P1 | Mặt hồ, cây, gió và ambient movement vừa phải; worldAtmosphere.ts | 30s loop không đứng im hoàn toàn, không alias/thiếu dispose |
| QR-05 | P0 | Culling/LOD vùng gần–xa không pop-in lớn; batching.ts, city.ts | camera move/rotate 8 pose liên tiếp + đường di chuyển; không biến mất collider/NPC; budget roadmap |
| QR-06 | P1 | NPC route có tránh người/xe và nhường đường; service.ts, collision.ts, visits.ts | 20 lần spawn/path, không đứng kẹt cửa tiệm, không xuyên xe, không teleport |
| QR-07 | P1 | Traffic logic hợp lý, tốc độ và khoảng cách xe; collision.ts, city.ts | gặp 10 xe; dừng/né/lối thoát hợp lý, không xe chạy xuyên người hoặc vật cản |
| QR-08 | P1 | Ground alignment, bậc cửa/độ cao và pivot nhân vật; city.ts, models.ts | 10 điểm phố: chân không chìm/nổi, đạo cụ có support contact |
| QR-09 | P2 | Dressing riêng theo khu và giờ, vật dụng có câu chuyện; cityMap.ts, cityDetails.ts | 3 micro-locations có visual landmark khác nhau, người mới phân biệt khi bỏ minimap |
| QR-10 | P1 | Scene streaming/dispose/LOD theo vòng lại khu; city.ts, renderDriver.ts | 10 lần chuyển khu: memory plateau, tăng <10% sau warm-up; geometry/texture count và CPU load được ghi |

## F. QG — Gameplay ít nhàm, có lựa chọn và hậu quả (M5/M6), 12 task

| ID | Prio | Công việc / candidate | Tiêu chí hoàn thành riêng |
| --- | --- | --- | --- |
| QG-01 | P1 | Tái thiết kế nhịp pha: đọc đơn → lấy base → topping → seal → giao; CraftWorkbench.tsx | first-time 3–5 phút, expert có cách rút ngắn, sai có sửa; 3 lượt không chỉ spam giữ nút |
| QG-02 | P1 | Thử thách nhỏ quality/speed/accuracy cân bằng; engine.ts, service.ts | ít nhất 2 chiến lược hợp lệ tạo phản hồi khác nhau; không ép bấm vô tận, không random khó giải thích |
| QG-03 | P1 | Khách cá tính thay vì order ngẫu nhiên cùng khuôn; customerAi.ts, content.ts | 3 archetype có giọng/thời gian chờ/phản ứng riêng và hậu quả đọc được |
| QG-04 | P1 | Combo pha chế và nâng kỹ năng không biến thành grind; performance.ts, CraftGauge.tsx | combo có cap/balance, thưởng đúng một lần, game vẫn chơi được nếu không try-hard |
| QG-05 | P1 | “Ngày đầu mở tiệm”: opening hook, mục tiêu, quãng đi, kết ngày; cityEpisodes.ts, engine.ts | walkthrough 10–15 phút có điểm nhấn, hướng dẫn vừa đủ, save/reload không mất quyết định |
| QG-06 | P1 | Nhiệm vụ biến thể giao và hậu cần (mua/kiểm/đóng gói); service.ts, cityLife.ts | 3 biến thể gameplay khác thao tác, có soft-fail/retry và kết quả quan sát được |
| QG-07 | P1 | NPC nói chuyện có mục đích, câu trả lời tính cách; NeighborhoodDialogue.tsx, neighborhoodStories.ts | 3 NPC, mỗi NPC >=2 phản ứng, lời đáp dẫn tới state/việc thay đổi, không chỉ +1 quan hệ |
| QG-08 | P1 | Tiền/tip/phí/ nguyên liệu liên kết gameplay; engine.ts, storage.ts | ledger idempotent, không thưởng lặp sau reload, không âm tài nguyên ngoài rule |
| QG-09 | P1 | Nhịp nghỉ và khám phá ngắn giữa đơn; CityLeisure.tsx, cityLife.ts | 1 hoạt động phụ 60–120s lựa chọn bỏ qua; giảm cảm giác làm đơn liên tục |
| QG-10 | P2 | Sổ chuyện và feedback hệ quả qua nhiều nhiệm vụ; NeighborhoodTasks.tsx, cityEpisodes.ts | lựa chọn trước được nhắc và đổi tuyến/đối thoại sau; không spoil thông tin chưa biết |
| QG-11 | P1 | Phân tích pacing: số click/đơn, chờ trống, tần suất lặp; scripts/qa & playtest | log 3 phiên 15 phút, xác định các đoạn người chơi dừng; giảm thao tác thừa có chứng cứ |
| QG-12 | P1 | Beta story spine hai kết thúc và đường sửa sai; neighborhoodStories.ts, engine.ts | 3 quyết định, 3 NPC liên hệ chéo, 2 ending từ save mới; kiểm exhaustive branch và save |

## G. QS — Âm thanh, haptic và nhịp cảm xúc (M7), 8 task

| ID | Prio | Công việc / candidate | Tiêu chí hoàn thành riêng |
| --- | --- | --- | --- |
| QS-01 | P1 | Bản đồ âm thanh tiệm/phố/hồ và giờ trong ngày; game/audio.ts, musicScore.ts | 3 ambience phân biệt, chuyển zone không pop/cắt đột ngột, mix rõ |
| QS-02 | P1 | Foley rót nước, đá, topping, ly, bước chân, xe; audio.ts, CraftWorkbench.tsx | mỗi sự kiện chỉ phát khi xảy ra, không lệch pose > cảm giác nhận thấy, không spam âm |
| QS-03 | P1 | Mix duck nhạc khi thoại, mưa, khách và thông báo; audio.ts | thoại không bị nhạc át; tắt nhạc không tắt SFX |
| QS-04 | P1 | Unlock âm sau user gesture, pause/resume/background; audio.ts | mất focus/đổi tab 10 lượt không nhạc chồng hoặc WebAudio exception |
| QS-05 | P2 | SFX cho thành công/thất bại mềm không gây stress; ServeCelebration.tsx | phân biệt bằng âm + hình khi muted, không loop khó chịu |
| QS-06 | P2 | Cài đặt volume music/sfx/ambient tách biệt; GameSettings.tsx, preferences.ts | lưu qua reload, mặc định không quá lớn, có mute tổng |
| QS-07 | P2 | Reduced motion/sound accessibility tương thích; preferences.ts | người dùng giảm chuyển động không mất thông tin, có thông báo text thay âm |
| QS-08 | P1 | QA nghe trên loa điện thoại và tai nghe; audio + thiết bị | clip/capture tai nghe+loa, kiểm volume, latency và âm chồng 15 phút |

## H. QU — HUD, tương tác, onboarding và accessibility (M7), 9 task

| ID | Prio | Công việc / candidate | Tiêu chí hoàn thành riêng |
| --- | --- | --- | --- |
| QU-01 | P1 | Mục tiêu hiện tại trong 1 câu, không giấu ở nhiều menu; PlayCoach.tsx, WorldChrome.tsx | người mới chỉ ra việc tiếp theo trong <=10s ở 4 viewport |
| QU-02 | P1 | Highlight mục tiêu gần và mốc đường, tránh nhấp nháy; CityCompass.tsx, CityMapDrawing.tsx | biết quầy/NPC ở đâu mà không phải mở map liên tục, không xuyên HUD |
| QU-03 | P1 | Mẫu tutorial đơn đầu progressive; AdaptiveCraftHint.tsx, RecipeChecklist.tsx | trong 3–5 phút giao thành công ở playtest; expert có thể tắt/hide |
| QU-04 | P1 | Bố cục mobile dọc/ngang và safe area; App.tsx, CSS, mobile-layout workflow | không tràn màn, không nút <48px, keyboard/resize không che xác nhận giao |
| QU-05 | P1 | Hội thoại dễ đọc, cảm xúc và lựa chọn rõ; NeighborhoodDialogue.tsx | 2–4 lựa chọn không bị cắt, focus/back/close đúng; không khóa joystick vô cớ |
| QU-06 | P2 | Phản hồi chất lượng ly trên HUD rõ nguyên nhân; OrderExperience.tsx | người chơi biết vì sao đạt/chưa đạt, không dùng màu làm kênh duy nhất |
| QU-07 | P2 | Reduce-motion, cỡ chữ, độ tương phản và subtitle; GameSettings.tsx | đọc được ở 360×800; kiểm accessibility và iPhone font scaling |
| QU-08 | P1 | UX lỗi mềm/không đủ topping/đường bị chặn; CraftWorkbench.tsx, service.ts | phản hồi hướng giải quyết, không dead-end hoặc silent fail |
| QU-09 | P1 | Performance mode dễ hiểu low/balanced/high; GameSettings.tsx, renderQuality.ts | chuyển tier không crash/save reset; hiển thị tradeoff hình và thử máy yếu |

## I. QL — Life-sim lâu dài và sản xuất nội dung (LC, chỉ sau core gates), 8 task

| ID | Prio | Công việc | Tiêu chí hoàn thành riêng |
| --- | --- | --- | --- |
| QL-01 | P1 | Ngày/màn có hook → hoạt động → hệ quả → tổng kết; story-and-days.md | 30 day-packs authored, ID ổn định, không chỉ đổi seed hoặc màu trời |
| QL-02 | P1 | Khách quen, quan hệ và lịch NPC liên tục; life-systems.md | NPC nhớ sự kiện, không xuất hiện đồng thời hai nơi, reload an toàn |
| QL-03 | P1 | Nhà/chợ/nấu ăn/ăn chung có lựa chọn tốc độ hoặc bỏ qua; life-systems.md | không grind, không phát sinh negative spiral không thể cứu |
| QL-04 | P1 | Ngân sách, hóa đơn, nguyên liệu và lựa chọn chia tiền; life-systems.md | kinh tế cân bằng, transaction atomic; số giả lập không quảng cáo giá thật |
| QL-05 | P2 | Sức khỏe/mệt mỏi và sự kiện tử tế; life-systems.md | không lạm dụng bệnh tật gây sốc, có skip và phương án hồi phục |
| QL-06 | P1 | Mở nhiều khu đến thành phố khác/biển bằng zone streaming; world-and-performance.md | khu cũ vẫn đi được, không tải đồng loạt, đạt budget M2 trên máy thật |
| QL-07 | P1 | Hệ kiểm nội dung tự động, seed replay và save migration; data-and-save-contract.md | 100 seed/batch, không node unreachable, idempotent, upgrade không mất dữ liệu |
| QL-08 | P2 | Công cụ content review và cảm nhận chơi theo ngày; ai-delivery-playbook.md | tập đo lặp archetype/quan hệ và biểu cảm, biên tập kiểm trước release |

## J. Thứ tự pick thực tế và phụ thuộc bắt buộc

**Giai đoạn M1.1 (lịch sử; chủ dự án đã xác nhận nghiệm thu ngày 10/10):** QI-03 → QI-05 → QI-01/QI-04 → QI-09/QI-11/QI-06 và chuẩn bị QI-02; phần runtime chỉ thay đổi trong scope renderer/perf, không bắt tay cùng lúc thay model và quest. Test gameplay cũ phải giữ 10/10 và ảnh/camera/va chạm. Nếu A/B cần chạy lâu, chọn tối ưu có kiểm chứng thay vì tạo thêm 5 workflows chồng nhau.

**M2 hiện hành:** QR-05/QR-10 và pipeline LOD/asset budget. **Sau M2:** M3 vertical slice QC-01/02/03/06 + QR-02 + QV-01/02/03, chỉ mở rộng khi 1 nhân vật/1 tiệm tốt ở cận/xa và máy yếu. **Sau M3:** M4 QF-01/03/05/06, QC-07, QR-06/07. **Sau M4:** M5/M6 QG-01/03/05/06/07/08/12. **Sau M6:** M7 VFX/âm thanh/UI QV-05..10, QS, QU; M8–M10 là cổng toàn diện. QL theo LC khi core accepted.

**Không áp dụng máy móc ưu tiên nếu lỗi P0 mới xuất hiện.** Khi một task bị chặn bởi device/asset/license, tạo blocker cụ thể và pick việc độc lập cùng gate; không đánh dấu “đã hoàn thành” khi chỉ viết đặc tả.
