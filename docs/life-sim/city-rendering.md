# CITY & RENDERING — Thành phố mở nhưng nhẹ trên điện thoại yếu

## Roadmap không gian và đồ họa

Bản đồ hiện hữu có 12 điểm + ngoại cảnh; đây là **hạt nhân** chứ không phải đã có toàn thành phố playable. Xây world graph: `District -> Zone -> Chunk -> Place -> Interaction`. Mỗi district gồm 2–6 phố và các interior có cổng vào ra; asset được chia vào bundles để tải theo nhu cầu.

| Giai đoạn sau các gate | Khu | Nội dung tương tác | Chiến lược |
| --- | --- | --- | --- |
| Seed | An Hòa, Lò Gốm, Đông Phong, Bến Sông | Tiệm, chợ, hồ, thư viện, công viên, xe buýt | Dùng thế giới có sẵn, sửa collider/LOD |
| Expansion A | Khu dân cư + nhà ở | Phòng ngủ, bếp, quán cơm, trạm y tế | Interior riêng, portal load |
| Expansion B | Ngoại ô và bến xe | Vườn, chợ đầu mối, khu nhà bạn | District stream, không cùng lúc render |
| Expansion C | Thành phố bên cạnh hư cấu | Quảng trường, chợ, quán ăn, nhà nghỉ | Travel node + episode |
| Expansion D | Thị trấn biển hư cấu | Bãi biển, bến thuyền, hàng quán, sinh hoạt khác | Gói tải riêng, low LOD/skybox |
| Expansion E+ | Seasonal districts | Hội chợ, phố mới, nhà bạn chuyển đi | Bundles có phiên bản / streaming |

**Mỗi ngày đổi cảm giác thành phố** bằng giờ giấc, mưa/nắng, lịch người, density và màu trang phục/xe, tiệm mở/đóng; *không tải 30 mô hình thành phố cùng lúc*. Mỗi vòng nội dung có thể thêm một hotspot nội thất hoặc một micro-location, không ép thêm một district 3D khi performance chưa đạt.

## Các lớp simulation và collision

1. **Logical map + navigation**: `DistrictGraph`, đường đi, cửa/portal, cầu thang, cầu, blocked roads, giờ mở, giá vé. Tọa độ cục bộ mét tương đối `x,z`; `districtId` tách khỏi tọa độ local. Warp chỉ qua portal đã duyệt, persist lastSafeSpawn.
2. **Colliders**: capsule/circle player, box building/wall/tree trunk, footprint vehicles, swept collision bước cố định 1/30 hoặc 1/60 để không tunneling; `slideMove`/routing kiểm thử vật lý độc lập scene. Nhà có cửa mở rõ; không xuyên cửa, cây, ghế, xe, hồ.
3. **Render**: không dùng mesh để quyết định vật lý. Cây có tán có thể đi dưới, **thân và gốc cây** không xuyên được; mái nhà không phải floor nav. Xe có body collision và logic ưu tiên người đi bộ. NPC tránh va chạm ở cự ly gần, khoảng cách cá nhân, có phản ứng.
4. **Camera**: tránh xuyên tường bằng collision probe/shorten boom; công trình che người chơi có cutaway/opacity có kiểm soát; camera follow/overview/gamepad/joystick không trộn input.
5. **Portal & loading**: prefetch khi gần cổng, một district active 3D + tối đa neighboring preview lightweight; sau transition dispose geometry/texture/skeleton đúng ownership, không memory leak.

## Performance budgets (DESIGN target, chưa đạt)

Tiếp tục target chính từ `docs/production-roadmap.md` nhánh M1: Android RAM 3–4 GB và iPhone nằm trong phạm vi hỗ trợ; 15 phút chơi, 30 FPS mục tiêu, P95 frame interval ≤40ms, >100ms dưới 1% ngoài loading; light ≤200 draw calls follow/≤300 overview; ≤150k triangles follow/≤250k overview, DPR≤1, initial JS gzip ≤1.5MB, tải trước khi chơi ≤5MB. Đây là **ngân sách mục tiêu**, không phải số đo.

**Cổng M1 bắt buộc** so baseline cùng thiết bị/browser, viewport, save, camera: 10 giây warm-up + 30 giây mẫu, giảm ≥40% draw calls overview light và P95 không tăng >10%. Tách CPU simulation/render submission, triangles, shadows, geometries/textures/skeletons, JS heap và cold load. M1 hiện chưa đạt; không triển khai bundle district 3D hay quảng cáo không lag trước khi đo.

### Three.js pipeline

- `InstancedMesh` cho lặp cùng geometry + material (cây, cọc, đèn, vỉa hè); `BatchedMesh` thử trên đối tượng khác geometry cùng material, có culling từng đối tượng và test fallback; merge geometry vừa đủ theo vùng để culling không thô. **Không lặp lại thử nghiệm sector32 làm P95 tăng** mà không có bằng chứng mới.
- 3 LOD thực: Near (chất lượng mẫu được duyệt), Mid (giảm tri, chung material), Far (impostor/low-detail). Culling từng district+chunk, texture atlas vật liệu công trình chung. Không tạo nhiều SkinnedMesh cho NPC ngoài màn hình.
- Light: tone mapping ổn định, shadow simple/contact decals, hạn chế transparency and overdraw, không mặc định bloom/SSAO. Balanced/High có chi tiết thêm nhưng không tạo gameplay khác.
- Render assets: GLB/glTF v2, KTX2/Basis textures có fallback, Draco/Meshopt optional sau khi đo decode CPU; tạo manifest `source/license/attribution/hash/triangles/lod/materials/textures/animation`. Asset tham khảo chưa cấp phép **không được import**.
- Animation: shared skeletal rigs (idle, walk, run, turn, stop, sit, cook, carry-cup, wave, greet, serve, fall-safe, recover); `AnimationMixer` blend 0.1–0.25s tùy loại, root motion hoặc velocity-consistent stride, foot placement ở gần nếu budget cho phép. Không animate 60 skeletons đầy đủ trong overview light.
- NPC/vehicle identity each day: deterministic wardrobe/texture palettes + head/hair silhouettes, vehicles types/classes, traffic schedule và tuyến; cùng LOD/colliders vật lý. Tránh vật thể di chuyển xuyên nhau bằng path reservation + swept volume. Thưa traffic khi quá tải (visual density degradation, **not gameplay collision deletion**).
- Frame pacing independent movement: fixed-step simulation + interpolation render; khi background resume clamp delta, tránh spike; throttling UI/ngày không phụ thuộc FPS.

### Chất lượng nhìn — ấm áp, chibi mà không đồ chơi nhựa

Nhân vật mắt/bàn tay/động tác phải có “weight”, mặt biết vui buồn, không trượt chân; đồ họa màu hồng phấn cho tiệm, vàng tường cũ/lam cửa chớp/xanh lá/đèn đường cho phố. Hà Nội gợi nhớ nhà ống, chợ nhỏ, xe máy, ban công, biển Việt; không sao chép ảnh tham khảo vào game. Thời tiết affects light/floor wetness theo LOD, hạn chế reflections trên light.

**Chỉ nhân rộng sau một vertical slice:** 1 người (3 LOD, 4 clip), 1 nhà (3 LOD, interior), 1 xe có collider, 1 cây có thân vững, 1 quán ăn; kiểm screenshot & P95 trước/sau. Chưa nhân hàng trăm NPC khi 1 rig chưa đạt.

### References đọc trực tiếp

- https://threejs.org/docs/pages/InstancedMesh.html
- https://threejs.org/docs/pages/BatchedMesh.html
- https://threejs.org/docs/pages/LOD.html
- https://threejs.org/docs/pages/AnimationMixer.html
- https://threejs.org/manual/pages/optimize-lots-of-objects.html
- https://threejs.org/manual/pages/shadows.html
- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory (hints có thể thiếu/làm tròn; phải chạy benchmark thật)
- Phố cổ Hà Nội: https://vietnamtravelers.com/architecture-culture-hanoi-old-quarter-2/ (tham khảo bố cục, không sao chép ảnh)
