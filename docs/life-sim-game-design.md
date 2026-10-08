# TIỆM TRÀ PHỐ NHỎ — GAME DESIGN BIBLE / LIFE SIM 1.0
> Tài liệu chuẩn cho người và AI cùng phát triển. Ngày soạn: 2026-10-08. **Định hướng, chưa phải tính năng đã triển khai.** Đọc cùng [production-roadmap](production-roadmap.md), [daily-episode-catalog](daily-episode-catalog.md), [ai-collaboration-contract](ai-collaboration-contract.md), [development-cycle-hourly](development-cycle-hourly.md).

## 1. Tầm nhìn và giới hạn

**Một cuộc sống nhỏ trong thành phố lớn.** Người chơi sống ở Hà Nội hư cấu, điều hành tiệm trà hồng chibi, thức dậy mỗi ngày với tâm trạng, lịch trình, thời tiết, tiền bạc, những cuộc gặp và hệ quả khác nhau. Có ngày vui, có ngày mệt, có người giúp đỡ, có người giận, có lần trễ hạn, bị ốm hoặc gặp tai nạn nhẹ; người chơi vẫn có cơ hội hồi phục và sửa sai. **Trục chính là con người và những lựa chọn**, không phải danh sách nhiệm vụ bắt buộc.

**Bốn trụ cột**: (1) vận hành tiệm trà bằng thao tác có ý nghĩa; (2) đời sống thường nhật với nhu cầu, thời gian, thu chi; (3) quan hệ có ký ức và cốt truyện; (4) thành phố mở rộng theo khu, nhìn đẹp và tương tác tự nhiên nhưng tải nhẹ.

**Cam kết thiết kế**: không ép người chơi phải online hằng ngày; không tính tiền hóa đơn bằng thời gian thực khi không chơi; không trừng phạt bằng bệnh tật ngẫu nhiên không thể tránh; không làm game trở thành chuỗi pop-up; không hứa một bản đồ vô hạn tải cùng lúc. Tên đường, cư dân, cửa hàng hư cấu lấy cảm hứng từ Hà Nội, không tự nhận là bản đồ chính xác. Đồ họa màu hồng phấn/kem ở tiệm, ngoài phố phối tường vàng cũ, xanh cửa chớp, cây, xe máy và biển chữ Việt.

## 2. Đối chiếu code đang có trên main

| Hệ hiện hữu | Vị trí | Cách phát triển |
| --- | --- | --- |
| Ngày, pha trà, khách, kho, tiền, nhân viên, khách quen | `src/game/engine.ts`, `types.ts`, `content.ts` | Giữ làm core; bọc bằng lịch ngày, không viết lại một lượt |
| Ngày trong thành phố, năng lượng, giờ, giao trà, thiện cảm | `src/game/city.ts`, `cityLife.ts` | Mở rộng nhu cầu và ledger qua migration; tránh hai đồng hồ độc lập |
| Hội thoại và nhiệm vụ cư dân | `src/game/neighborhoodStories.ts`, `cityEpisodes.ts` | Thêm story graph có điều kiện, sự kiện liên kết; giữ ID cũ |
| 12 điểm tham quan, phố hiện tại, collider | `src/game/cityMap.ts`, `service.ts`, `collision.ts` | Chuyển sang các sector, collider riêng không phụ thuộc LOD |
| Render, camera, adaptive quality | `src/scene/runtime.ts`, `renderQuality.ts` | Three.js làm mặc định, phân khu tải dần và giảm draw calls |
| Save v3 | `src/game/storage.ts` | Bổ sung `lifeSim` qua hydrate/migration, giữ tiền/quest cũ |

**Không coi các mục ở phần 3–11 đã được lập trình.** Mọi module đề xuất phải được chia thành PR nhỏ.

## 3. Nhịp ngày: một ngày = một màn, không phải màn tách rời

**Một ngày trong game** gồm `WAKE → MORNING → SHOP_SHIFT → AFTERNOON → EVENING → SLEEP → DAY_SUMMARY`. Đây là phase đời sống **bao ngoài** `phase: prep/open/summary` của tiệm hiện có; không đổi enum tiệm cho tới khi migration/test xong.

- **06:00–09:00**: thức dậy, trạng thái ngủ đủ/ngủ quên, ăn sáng, kiểm tra điện thoại, tin nhắn, dự báo, kế hoạch và việc nhà. Có nút bỏ qua các hoạt động lặp; ngủ quên làm giảm thời gian chuẩn bị, không auto-game-over.
- **07:00–11:00**: đi chợ, nhập nguyên liệu, gặp người quen, lựa chọn mua rẻ/đắt/chất lượng; có thể chuẩn bị từ tối trước. Nếu thiếu hàng có cách đổi menu hoặc xin giao muộn.
- **09:00–18:00**: mở tiệm, khách đến theo lịch và xác suất có kiểm soát, pha/giao, nghỉ giữa ca, bạn bè ghé, khách khó tính/tip nhiều, đơn nhóm. Người chơi có thể đóng sớm, thuê trợ giúp hoặc từ chối đơn với hệ quả hợp lý.
- **18:00–23:00**: nấu ăn, ăn cùng người thân, bạn rủ đi ăn, đi dạo, trả hóa đơn, chăm sức khỏe, xem nhật ký. Người chơi chọn một vài hoạt động, không phải hoàn thành tất cả.
- **23:00–06:00**: ngủ; chốt trạng thái, trả thưởng đúng một lần, sinh kế hoạch ngày tiếp theo. Có lựa chọn ngủ sớm, ngủ muộn; tác động năng lượng ngày sau.

**Thời gian**: dùng phút trong game (`city.minutes`) là nguồn sự thật duy nhất, có tốc độ thời gian tùy chế độ và pause khi hội thoại quan trọng; các hoạt động có chi phí phút tường minh. Không đồng bộ với giờ máy để phát sinh nợ lúc người chơi offline. Một màn chơi mục tiêu 12–25 phút thực, phiên chơi 3–5 phút vẫn có save an toàn. Có thể chơi lại ngày bằng bản sao save thử nghiệm, không nhận thưởng lần hai.

## 4. Nhân vật, tâm trạng và ký ức

**Nhân vật chính**: chủ tiệm trẻ, có thể tùy chỉnh tên, diện mạo, quần áo, đại từ xưng hô; người chơi định hình tính cách qua lựa chọn, không áp đặt giới tính/quan hệ yêu đương. Nhà là không gian hồi sức và kể chuyện.

**Nhóm quan hệ lõi** (đề xuất, chưa có đầy đủ): người thân sống cùng/ở gần (mẹ hoặc cô dì, em/họ hàng), nhóm bạn 3–4 người (Lan hoạt bát, Minh Anh thích chụp ảnh, Khôi hay đến muộn, Thảo cẩn thận), khách quen và cư dân đã có (cô Hạnh, cô Thu, anh Nam, bác Minh, bác Bình, Lan). Tránh trùng ID nhân vật hiện có; nếu Lan đã tồn tại thì dùng đúng một identity.

Mỗi NPC có `npcId`, quan hệ `bond`, `trust`, `stress`, `promiseIds`, `lastSeenDay`, `memoryFlags`, `schedule`, `needs`, `budget`, `availability`, `preferredPlaces`, `temperament`. Các trạng thái thay đổi theo sự kiện và ngày; **không random lại nhân cách cốt lõi**. Tâm trạng `joy/calm/stressed/sad/tired` là ngữ cảnh, không đánh đồng bệnh lý.

**Khách hàng**: `patience`, yêu cầu, thói quen, tần suất, ngân sách, `tipPolicy`; khách khó tính không luôn ác, khách tip cao không luôn giàu. Hành vi có động cơ (vội đi làm, có sinh nhật, mất đồ, trời mưa). Không dùng mẹo ngẫu nhiên trừ tiền vô lý. Lịch sử dịch vụ ảnh hưởng lần sau; người được giúp có thể quay lại.

**Tương tác xã hội**: lời mời ăn (nhóm đầy đủ/nhóm nhỏ/đi riêng); lịch xung đột; chọn quán phù hợp túi tiền; chọn gọi món, trò chuyện, chia hóa đơn hoặc ai mời. Kết quả trả tiền được quyết định bởi **thỏa thuận, tình hình tài chính, tính cách, ký ức, seed**; không random bất chấp lựa chọn. Có thể từ chối khéo, hẹn lần sau; không ép trả khoản vượt ngân sách.

**Cảm xúc và cốt truyện**: cảnh hài, thất vọng, mất niềm tin, cảm động, ốm đau nhẹ, bất hòa rồi hòa giải; viết tinh tế, tránh dùng đau khổ làm phần thưởng. Với tai nạn/bệnh nặng, chỉ thể hiện theo hướng phù hợp lứa tuổi, không mô phỏng tổn thương đồ họa. Người chơi có thể bỏ qua hoặc giảm cường độ cảnh buồn.

## 5. Nhu cầu và hậu quả, không biến game thành đồng hồ phạt

`LifeNeeds = { hunger:0..100, energy:0..100, hygiene:0..100, stress:0..100, health:0..100, social:0..100 }`; không thêm tất cả đồng hồ lên HUD. Nhu cầu giảm theo **hành động/phút trong game**, được clamp; offline không giảm. Hunger thấp → hiệu suất giảm nhẹ, lời nhắc ăn; không gây chết. Energy thấp → cần nghỉ, không khóa vĩnh viễn. Stress tăng do áp lực/quan hệ; giảm khi nghỉ/được hỗ trợ. Health có trạng thái `healthy/tired/cold/minor_injury/recovering` và cờ điều kiện; ốm có triệu chứng vừa phải, thuốc/khám là lựa chọn phù hợp, có ngày nghỉ và phục hồi; bệnh viện/phòng khám là khu có tương tác, không quảng bá lời khuyên y khoa. Vết xây xát nhẹ có sơ cứu; sự cố giao thông chỉ là sự kiện kịch bản được kiểm soát, không cơ chế gây hại.

**Ăn uống**: mua nguyên liệu ở chợ → nấu 1–3 bước ngắn → ăn một mình/cùng nhà; thực phẩm tồn kho, có hạn dùng và lựa chọn đồ ăn sẵn; không buộc đi chợ mỗi ngày. Nhà bếp chỉ render khi vào nhà.

**Kinh tế**: tiền mặt chung từ tiệm, ví cá nhân/tài khoản chi tiêu có ledger minh bạch; thu: bán trà, tip, việc phụ; chi: nguyên liệu, ăn, đi lại, điện/nước/mạng, thuê mặt bằng, sửa chữa, khám bệnh. Ngày đáo hạn theo ngày game, có thông báo trước 2 ngày, số tiền cố định/biến đổi trong phạm vi công bố. Nếu thiếu tiền: gia hạn, trả một phần, vay từ người thân theo kịch bản có giới hạn; không softlock, không lãi kép vô hạn. Mọi giao dịch có `transactionId`, `reason`, `amountVnd`, `day`, `appliedOnce`. Đơn vị VND, dùng `Intl.NumberFormat('vi-VN')`.

**Giá cả**: tham chiếu cảm giác giá sinh hoạt ở đô thị Việt Nam nhưng là **giá cân bằng game**, không tuyên bố giá thị trường hiện tại; cấu hình `basePriceVnd`, `season`, `districtFactor`, `supplyShock` có giới hạn và hiển thị trước giao dịch. Dữ liệu thực phải có nguồn, ngày cập nhật và quyền sử dụng. Không phụ thuộc API giá trực tuyến để chơi offline.

## 6. Story engine: tuyến chính + tình huống đời thường

**Ba lớp nội dung**:
1. **Canon arc** (viết tay, có kết thúc): Một tuần đầu mở tiệm; xây lòng tin với chợ và khu phố; nhóm bạn và gia đình; sự cố mưa bão/lời hứa; buổi trà chung; giai đoạn mở khu mới và đi biển.
2. **Episode of the day** (mỗi ngày một biến cố chủ đạo): ngủ quên, khách lạ, khách khó tính, khách tip, mâu thuẫn nhóm bạn, ăn chung, hóa đơn, sức khỏe, kỷ niệm, mưa, lễ hội. Mỗi episode có ít nhất 2 cách xử lý và hệ quả sang ngày sau.
3. **Ambient encounters**: 0–3 chuyện nhỏ/ngày ở phố, chỉ khi lịch NPC, vị trí, giờ, weather và điều kiện phù hợp; không phá tuyến chính.

**Bộ chọn tình huống**: dùng PRNG có seed `hash(saveId, day, storyVersion)` và trọng số theo `flags`, `needs`, `relationships`, `district`, `weather`, `cooldown`. Chọn **một chủ đề chính + tối đa hai sự kiện phụ** để tránh hỗn loạn; có pity/cooldown (không ốm liên tiếp, không gặp cùng khách khó tính 3 ngày liền, không ba biến cố xấu liên tục). Kết quả lựa chọn phải được persist, không reroll sau reload. Cốt truyện lớn được ưu tiên trước ngẫu nhiên; seed không thay thế biên kịch.

**Cấu trúc episode đề xuất** (JSON/TS data, không chạy script tùy ý):
```ts
type Episode = {
  id: string; revision: number; arc: string; dayRange?: [number, number];
  priority: number; weight: number; cooldownDays: number;
  prerequisites: Condition[]; exclusions: Condition[];
  cast: string[]; sectorIds: string[]; estimatedMinutes: number;
  beats: { id:string; phase: 'wake'|'morning'|'shift'|'evening';
    scene:string; choices: {id:string; label:string;
      conditions:Condition[]; effects:Effect[]; nextBeatId?:string}[] }[];
  exitIds: string[]; fallbackEpisodeId: string;
};
```
`Condition` và `Effect` là discriminated unions đã whitelist (ví dụ `cashAtLeast`, `bondAtLeast`, `hasItem`, `addCash`, `setFlag`, `scheduleVisit`, `adjustMood`); kiểm schema và logic trước khi phát hành. Effects áp dụng atomic theo `effectId=episodeId/beatId/choiceId` và ledger; không phát thưởng lặp khi reload. Có fallback nếu NPC vắng/sector chưa tải; mọi tuyến có điểm kết thúc hoặc chuyển ngày.

## 7. Thành phố lớn nhưng máy yếu vẫn chơi được

**Địa lý theo lớp**: `World → District → Sector → Place → Interaction`. Ban đầu An Hòa (tiệm, chợ, hồ, khu tập thể, hiệu sách, quảng trường, phố Lò Gốm) như hiện có; mở thêm bến xe, phòng khám, nhà người chơi, khu phố khác; sau đó khu ngoại ô, thành phố lân cận và biển hư cấu. **Không dựng cả thành phố một lần**. Chỉ render sector hiện tại và hàng xóm gần; sector xa biểu diễn bằng skyline/atlas LOD hoặc map 2D. Đi xe buýt/xe máy tới thành phố khác qua chuyển cảnh có loading, không đòi seamless world vô hạn.

**Sự sống đô thị**: NPC có lịch và nơi đến, xe theo tuyến/đèn giao thông đơn giản, cửa hàng có giờ, âm thanh không gian; biến thiên mỗi ngày bằng seed (quần áo, lượng người, vài xe, quầy hàng, thời tiết, lịch), **không thay đổi ngẫu nhiên đường/collider**. NPC ở xa mô phỏng bằng lịch và thống kê, không chạy animation/AI đầy đủ. Xe phải tránh người và vật cản; va chạm là gameplay rule dùng cùng dữ liệu với pathfinding, không chỉ nhìn mesh.

**Art bible**: stylized chibi 3D có tỷ lệ nhất quán; nhân vật rigged/skin với idle, walk, turn, carry, serve, sit, eat, sleep, react, hurt-light, recover; chân bám đất theo tốc độ, animation blending, không đi xuyên cửa/cây/xe. Nhà ống, ban công, cửa chớp, mái hiên, biển hiệu tiếng Việt, dây điện, cây, xe máy có chất Hà Nội; tiệm hồng/kem là điểm nhận diện. Ánh sáng ban ngày, chiều, mưa; light mode giảm bóng/hiệu ứng nhưng giữ silhouette, màu và khả năng đọc.

**Asset**: ưu tiên tự tạo procedural/đồ họa gốc; asset ngoài chỉ dùng khi giấy phép cho phép, ghi URL tác giả/loại giấy phép/ngày tải, file nguồn và biến đổi trong manifest. Không lấy ảnh tham khảo làm texture trực tiếp nếu không rõ quyền.

## 8. Mobile-first và chất lượng đồ họa

**Renderer**: Three.js là đường chính; giữ Babylon.js như đường phụ hiện có, không nhân đôi chi phí tải. `InstancedMesh` cho vật thể tĩnh lặp lại, atlas cho mặt tiền, LOD 3 mức và sector frustum culling, dispose geometry/material/texture khi chuyển khu. Dynamic actors/collider không gộp vào static mesh. Không tự bật bloom, SSR, SSAO, shadow map nặng trên máy yếu. Cân nhắc KTX2/GLTF khi pipeline có fallback được test.

**Ngân sách mục tiêu Light (chưa đo đạt)**: 30 FPS trong 15 phút trên Android RAM 3–4GB và iPhone mục tiêu; P95 render interval ≤40ms; frame >100ms <1% ngoài màn loading; ≤200 draw calls góc đi bộ/≤300 toàn cảnh; ≤150k/250k triangles; DPR≤1; JS tải nén ≤1.5MB, trước điều khiển ≤5MB; memory sau 10 lần vào/ra sector tăng <10%. M1 gate **giảm ≥40% draw calls góc toàn phố light, P95 không tăng >10% cùng môi trường**, thêm thiết bị thật trước khi xác nhận. Chỉ mở M2 sau gate M1. Không suy luận hiệu năng điện thoại từ Chromium SwiftShader.

**Ưu tiên chất lượng**: input phản hồi, camera không xuyên tường, animation chân đúng nhịp, khuôn mặt đọc được, cử chỉ cầm ly thật; ít NPC chất lượng tốt hơn đông NPC vô hồn. Ở máy yếu giảm mật độ NPC/xe, shadow, chi tiết và tần suất cập nhật ngoài camera, **không giảm logic nhiệm vụ, collider, hitbox, khả năng đọc chữ**. Có quality Light/Balanced/High/Auto, nút manual override.

**HUD**: joystick và nút tương tác 48px, safe area, hai ngón độc lập, orientation ngang/dọc; nhiệm vụ 1 dòng, sổ đời sống mở khi muốn, lựa chọn hội thoại lớn và rõ; nhạc/âm thanh có mute và giảm chuyển động. Không bắt bấm nhiều menu để ăn hoặc trả tiền.

## 9. Save, tính đúng và công bằng

Không sửa `saveVersion:3` vô điều kiện. Bước đầu thêm trường `lifeSim?: LifeSimState` trong stored schema và hydrate defaults; sau khi xác nhận migration mới nâng version. State mới lưu `worldSeed`, `dayPlan`, `storyFlags`, `eventLedger`, `economyLedger`, `needs`, `household`, `npcMemory`, `sectorState`, `contentRevision`. IDs ổn định, content revision và fallback migration. **Không lưu tham chiếu Three.js, animation frame hay timer thực vào save**.

Khi qua ngày: giao dịch → hoàn tất quest → xử lý hóa đơn tới hạn → cập nhật nhu cầu → snapshot/seed ngày sau → autosave, theo transaction ID idempotent. Trường hợp app tắt giữa giao dịch không mất tiền/nhận tiền hai lần. Test 30 ngày, 365 ngày, reload giữa mỗi beat, seed reproducible, xung đột nhiệm vụ, mất asset, NPC vắng, thiếu tiền, hết năng lượng, chợ đóng cửa. Không để softlock; luôn có lựa chọn nghỉ/nhờ giúp/đổi nhiệm vụ.

## 10. Tiêu chí chấp nhận một ngày mới

Một episode **chỉ được tính là “ngày/màn đã phát hành”** khi có: (a) ID ổn định và story beats có mở/đóng; (b) ít nhất một lựa chọn có hệ quả sang ngày sau; (c) tương tác thật ở ít nhất một hệ (tiệm/chợ/nhà/đường/quan hệ), không chỉ lời thoại; (d) khả năng tiếp tục khi thiếu tiền/đồ hoặc NPC bận; (e) save/reload, reward once và graph validation xanh; (f) UI mobile và input/collision smoke; (g) không regression ngân sách trên thiết bị đã đo. Nếu gate chưa đạt, **vòng tiếp theo sửa ngày đang dở**, không gắn nhãn thêm ngày giả.

## 11. Tài liệu nguồn và kiểm chứng

- Three.js instancing: https://threejs.org/docs/pages/InstancedMesh.html
- Three.js optimize meshes: https://threejs.org/manual/pages/optimize-lots-of-objects.html
- Three.js LOD: https://threejs.org/docs/pages/LOD.html
- Three.js AnimationMixer: https://threejs.org/docs/pages/AnimationMixer.html
- Nguồn tham khảo kiến trúc và bối cảnh Hà Nội đã ghi tại [visual-gameplay-direction](visual-gameplay-direction.md). Chỉ dùng để nghiên cứu hình thái, không sao chép asset khi chưa có giấy phép.
