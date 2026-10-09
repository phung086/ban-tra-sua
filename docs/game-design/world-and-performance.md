# Kiến trúc thành phố, hoạt ảnh, tương tác và hiệu năng

> **Proposed architecture** phù hợp stack đang có: React 19 + TypeScript/Vite + Three.js 0.186 (mặc định), Babylon.js 9 ở đường tương thích. Giữ nguyên cổng kỹ thuật [production-roadmap](../production-roadmap.md), nhất là M1 chưa nghiệm thu.

## 1. Bản đồ mở rộng theo vùng — không dựng nguyên thành phố cùng lúc

**Phố An Hòa (existing 12 POI)** là vùng khởi đầu; giữ path/location IDs đã lưu trong save v3. Các khu bổ sung là đề xuất mới, **không khẳng định đã có**:

| World / district | Chức năng truyện và gameplay | Tải / mở khoá |
| --- | --- | --- |
| `anhoa-core` (hiện có) | tiệm trà, chợ, hồ, các điểm đến hiện hữu | first-play; luôn kiểm regression |
| `anhoa-residential` | nhà nhân vật, người thân, nấu ăn, ngõ | stream sau gate nội thất |
| `anhoa-civic` | trạm y tế/bệnh viện nhỏ, bưu cục, cơ quan dịch vụ | thêm khi có sức khỏe/hóa đơn |
| `dong-phong-center` | nhà hàng, quán ăn nhóm, khu thương mại/đi lại | arc bạn bè, khám phá |
| `river-terminal` | đường ven sông, bến xe, điểm giao | liên vùng, lịch phương tiện |
| `seaside-town` | thành phố biển hư cấu, bãi biển, chợ cá, homestay | hậu beta, scene pack độc lập |
| `neighboring-city-01` | thành phố kế bên với giá/sự kiện/văn hóa khác | hậu beta, hub/transport |

**Kiến trúc:** world manifest → zone metadata/navmesh/collider → asset bundles/chunk → entity spawn pools → lifecycle `prefetch → activate → suspend → unload/dispose`. Load **vùng hiện tại + cửa ngõ/vành đai nhìn thấy + một vùng kế cận dự đoán**, không tải cả map/mọi cư dân. Chuyển thành phố bằng phương tiện/điểm nối có thời gian game và màn loading hiển thị; không giả seamless nếu máy yếu không đủ RAM.

- Đồng bộ hệ tọa độ (world/district/local), scale người ~1.7–1.8m chỉ là target; định nghĩa duy nhất về unit. Spawn/portal đủ khoảng trống và hướng đứng.
- Persistent world state lưu **thay đổi và entity ID**, không serialize toàn bộ Three Mesh/physics world; dỡ khu rồi dựng lại vẫn đúng cửa mở, đồ đã mua, nhiệm vụ, cư dân đã hẹn.
- NPC quan trọng có canonical schedule và reservation theo slot; khi khu không active, tính mức abstract theo lịch, không chạy đầy đủ animation/pathfinding.
- Xe qua đường có đường ray/lanes, spawn–despawn ổn định, traffic lights ưu tiên event khu; ambient cars chỉ hiện trong active zone, không bị lưu như NPC quan trọng.
- Thành phố sống bằng âm thanh, lịch, cửa hàng đóng/mở, người chở hàng, áo quần, sự kiện mưa/ngày lễ, không đồng nghĩa draw thêm vô hạn mesh.

## 2. Cổng đồ họa và ngân sách (mục tiêu, không phải số đo)

| Chỉ tiêu mobile light | Budget hiện hành theo roadmap |
| --- | --- |
| FPS / frame interval | 30 FPS ổn định 15 phút; P95 ≤40ms; frames >100ms <1% ngoài loading |
| Draw calls | ≤200 góc đi bộ, ≤300 overview (thống nhất cách tính main/shadow) |
| Main-pass triangles | ≤150k đi bộ, ≤250k overview |
| DPR/pixel | ≤1 trên máy yếu; giảm dynamic resolution nếu cần |
| Data tới first control | JS nén ≤1.5MB, tất cả tải tới điều khiển ≤5MB |
| Startup mạng 10Mbps/100ms RTT | ≤10s |
| Bộ nhớ | plateau sau warmup; <10% growth sau 10 vòng vào/ra khu |
| Máy thật | Android RAM 3–4GB/GPU phổ thông cũ + iPhone trong hỗ trợ |

Không bao giờ báo “đạt” từ hình chụp 390px, unit test hoặc SwiftShader software-only. M1 hiện có benchmark overview light trước/sau đạt tương đối >40% draw call **ở một số mẫu**, nhưng P95 hàng trăm/hàng nghìn ms và follow-light có mẫu tăng 70%; không coi đây là mượt. Gate M1 vẫn chưa đóng khi chưa có thiết bị thật và behavior QA.

**Render budgets theo LOD zone (đề xuất phân bổ, phải đo):** 50–60% cảnh tĩnh, 15–20% nhân vật/xe, 10–15% shadows, còn lại UI/effects. Culling camera/frustum, static batching theo sector **nhỏ khi follow**, lớn khi overview chỉ khi đo, instancing cho cây/cột/đèn lặp, texture atlases, mesh merge có bounds đúng; không nhồi mesh xa vào draw call nếu triangles tăng và P95 xấu. Giữ các profiler bins riêng draw main/shadow, triangles, scene update, cpu render submit, P50/P95 interval, texture/geometry/bone counts. GPU timing chỉ hiển thị nếu extension hỗ trợ.

## 3. Gói asset/LOD và streaming

- Asset đầu nguồn GLB/GLTF hoặc procedural legacy có `assetId`, quyền sử dụng, author/source, license, texel density, đơn vị, pivots, mesh LOD, collider version, bounding box, animation list.
- Xuất mesh compression Meshopt/Draco **chỉ sau** khi đo trade-off decode CPU trên điện thoại yếu; textures KTX2/BasisU phù hợp GPU với fallback JPEG/WebP; dùng atlas vật liệu cho nhà/chợ/đồ chạm.
- `LOD0` gần: rig/surface đẹp, đầu/tay/mắt, object interaction; `LOD1` vừa: giảm polygon/material; `LOD2` xa: silhouette/limited animation/ impostor khi hợp lý; ngoài far plane unspawn. NPC persistent xa dùng symbolic schedule.
- Hợp nhất vật liệu có cùng shading; đừng merge dynamic/interactive objects mất culling hoặc mất hitbox. Decoration trùng geometry instancing, không dùng từng draw call cho mỗi lá cây.
- Prefetch chỉ theo chuyển vùng/đường di chuyển; LRU cache theo **tổng byte và tuổi**. `dispose` vật lý, audio, animation, GPU resources đúng lúc; instrument memory/leak.
- Fallback ngữ cảnh khi thiếu asset: low LOD/tone style nhất quán hoặc 2D biểu tượng có kiểm chứng, **không invisible collider / invisible NPC**.
- Dùng animation compression/retarget cẩn thận; 8–12 NPC hoạt động gần camera chỉ là giới hạn giả thuyết, không chuẩn cứng; chốt count bằng benchmark.

## 4. Điều khiển và chuyển động có vật lý hợp lý

Input path: pointers (joystick/camera riêng) + keyboard/controller → input intent → controller với acceleration/deceleration/turn rate → physics sweep/collision → nav correction → animation blend → camera damping/render. `pointercancel` / blur / orientation phải nhả input ngay. NPC interaction ray và UI button không được hiểu là camera drag.

**Collision là dữ liệu gameplay**, không dựa trên decorative mesh hoặc pixel hình ảnh:
- Static: cây (trunk collider), nhà/tường, ghế, quầy, lan can, mặt đất, bậc; dynamic: người, xe, cánh cửa. Collider theo layer/mask, navmesh topology phải khớp cảnh.
- Kinematic capsule/circle 2D + height trên nền prototype; **continuous sweep** theo substep/fixed timestep, slide dọc bề mặt, step/slope limit; không teleport xuyên tường khi framerate giảm.
- Vehicle dùng oriented bounds / swept test và yielding theo quỹ đạo; không đẩy người chơi xuyên tường/xe. Khi kẹt: dừng + thông báo hoặc replan, không xuyên chướng ngại bằng snap lớn.
- NPC pathing theo navmesh/waypoint lanes, avoidance ưu tiên, offscreen coarse tick; người đi trên vỉa hè, xe trên đường, không chồng hai NPC tại quầy. Khi tương tác, giữ khoảng đứng và hướng nhìn.
- **Camera** capsule/raycast/spherecast tường, near clip, shoulder switch và transparency cho mái che có điều kiện; cảnh từ sau lưng không nhìn xuyên phố trái luật.
- Hoạt ảnh đi dựa vận tốc **sau collision**, không dựa vào input khi người chơi đứng yên; root motion nếu dùng phải reconcile collision/nav. Mix idle/walk/run/hold cup/sit/eat/cook/talk/injured, foot IK optional theo platform.
- Thử nghiệm vật lý test đụng tường/cây/xe/NPC/cửa quán, thang/bậc/hẹp, FPS thấp, camera quay, chuyển khu, reload, giữ joystick 5 giây; chụp video và tọa độ trước/sau, không chỉ kiểm tồn tại collider.

Không tự đổi Three.js sang Unity/Unreal/Babylon bắt buộc khi dự án đang tối ưu Three. Babylon duy trì hỗ trợ nếu cần, nhưng chỉ **một** renderer active, lazy-load rõ bằng network waterfall và kiểm hai engine theo tiêu chí tương đương. Nếu chọn thêm physics/path library phải có spike chứng minh bytes, CPU, memory, QA/tương thích trước khi merge.

## 5. Simulation/renderer separation

```
Content packs (day + NPC + place + item + dialogue)
          ↓ validation & version
DayDirector / StoryGraph / Schedule / Economy / Needs
          ↓ typed actions, deterministic effects
WorldState + Ledger + Event Queue (save/migrate)
          ↓ commands / stable entity IDs
ZoneRuntime (spawns, interaction, nav, traffic, colliders)
          ↓ render adapter boundary
ThreeRenderer  OR  BabylonRenderer
          ↓
Canvas + Touch HUD + Camera + Audio + Accessibility
```

- **UI** chỉ phát `Action` (`BuyMarketItem`, `StartShift`, `ServeOrder`, `PayBill`, `ChooseDialogue`...), không trừ tiền hay mutate schedule ở component.
- **Simulation** có fixed timestep 30/60Hz *chọn bằng đo* và accumulator có cap; render interpolate ở frame budget; audio/animation LOD theo distance.
- **Every frame** tuyệt đối không scan tất cả content/NPC; index scene entities theo sector, schedule/trigger spatial index, event queue time-sorted.
- **Serialization** chỉ primitive typed state+IDs, không object graph/circular reference; day advance là transaction; ở trước/sau restore không double spawn NPC/trả thưởng.
- Scene renderer không quyết định kết quả trúng va chạm kinh tế/narrative. Gameplay deterministic trong test headless.
- Asset streaming có cancellation token và `zoneGeneration` tránh asset đến muộn làm xuất hiện đồ của zone cũ, đồng thời giải phóng texture khi đi xa.

## 6. Bản kế hoạch kiểm tra performance

1. Ghi code SHA/asset version/browser build/viewport/DPR/engine/mode/camera route/seed và warm-up.
2. Đo **cùng Chromium & route** trước/sau, overview light **và** balanced + follow/di chuyển; đối chiếu renderer.info, triangle, P50/P95 interval, CPU update/render, count sample, ảnh gần/xa.
3. Stress 10 lần đi nội thất→tiệm→chợ→hồ→quay về, theo dõi leak và NPC scheduling.
4. CI browser dùng Playwright smoke: joystick và camera đồng thời; thử từng collider; đối thoại; ca quán pha/giao; đổi dọc/ngang; route liên vùng; ảnh before/after và diff quy ước.
5. Thiết bị thật: Android RAM 3–4GB và iPhone, mỗi máy 15 phút, build production, ghi model/OS/thermal/battery/FPS/P95/input/audio/context losses. Không có thiết bị = **BLOCKED, không nghiệm thu**, tiếp tục công việc không phụ thuộc thiết bị.
6. Regression P95 >10% hoặc kẹt tương tác → investigate/perf budget/tinh chỉnh sector/shadow/LOD; nếu không chữa được thì revert phạm vi gây lỗi; **không hạ tiêu chí im lặng**.

## 7. Kế hoạch triển khai từng vùng

- **LC-W1:** chuẩn hóa WorldManifest và hai khu hiện hữu như data pack mà không đổi hành vi.
- **LC-W2:** zone switch/prefetch/release, collision/nav integrity, 10 lần qua lại không memory leak.
- **LC-W3:** nhà/bếp với interaction + low-end asset tier, đo budget.
- **LC-W4:** địa điểm y tế, dịch vụ, nhà hàng; kiểm các đường đi phức tạp và NPC schedule.
- **LC-W5:** bến xe → khu lân cận (đổi world, không tải đồng thời) → biển; mở nội dung **sau** khi 3 khu đầu ổn định.
- Một zone mới chỉ vào release khi đủ: visual pack + collider/nav + interaction + NPC spawn + route + 1 chuyện có ý nghĩa + screenshot/perf + save travel/load recovery. Một tấm bản đồ khổng lồ không được tính là “thành phố chơi được”.
