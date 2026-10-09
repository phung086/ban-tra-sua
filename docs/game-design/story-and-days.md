# Cốt truyện, 30 ngày đầu và máy tạo tình huống có kiểm soát

> **Design proposal, chưa có nội dung/logic ngày 1–30 được chứng minh đã implement.** Arc beta “Một tuần ở Phố Nhỏ” trong [production-roadmap](../production-roadmap.md) là ưu tiên hiện hành; bảng này là hướng chuyển sang life-sim sau cổng beta, không retcon/save phá tuyến truyện đang có.

## 1. Cấu trúc truyện nhiều tầng

- **Arc đời sống:** người chơi gây dựng tiệm, học sống độc lập nhưng vẫn gắn kết gia đình và cộng đồng. Chủ đề: **“Sống đủ tốt với ngày hôm nay, mà không đánh mất người mình yêu quý.”**
- **Tuyến A — Tiệm và khách hàng:** nguyên liệu, uy tín, nhân viên, chi phí, khách quen, đạo đức kinh doanh.
- **Tuyến B — Nhà và người thân:** bữa cơm, hỗ trợ khi ốm, áp lực tài chính, các lời chưa nói.
- **Tuyến C — Bạn bè và tình cảm:** nhóm bạn khác lịch, rủ đi ăn, hiểu lầm, ai có mặt khi cần.
- **Tuyến D — Thành phố:** dân cư thay đổi, mở tuyến xe buýt, khu chợ nâng cấp, vùng ven biển/thành phố hàng xóm sau này.
- **Đường cong cảm xúc:** ngày vui → thử thách nhỏ → tự hào → mệt mỏi → sửa sai → sẻ chia; không có một thuật toán ép “hôm nay phải buồn”.

Cốt truyện chính được tác giả viết, các nhánh quay lại tuyến chính theo **foldback with memory**. Thành quả là 3 loại hồi kết chương (gắn kết cộng đồng / tự lập kinh doanh / cân bằng) thay vì 2^N cutscene độc lập. Quyết định quan trọng phải thay **người hỗ trợ, giá, lịch, hành động và scene**, không chỉ đổi vài câu chữ.

## 2. Sổ nhân vật đề xuất

Bảo toàn NPC đang có theo ID thực tế của code; tên dưới đây ngoài “Cô Hạnh” là **placeholder đề xuất, không khẳng định đã tồn tại trong repo**. Trước khi viết content mới, đối chiếu bảng ID `cityEpisodes` và `neighborhoodStories`, tránh nhân đôi nhân vật.

| Vai trò | Tính cách/động cơ | Lịch và quan hệ | Hệ quả gameplay |
| --- | --- | --- | --- |
| Cô Hạnh, người bán ở chợ (đã được nhắc trong roadmap) | tận tâm, thẳng thắn, coi trọng chữ tín | chợ sáng; quen gia đình | bán chịu giới hạn, nguồn hàng tốt, nhắc lời hứa |
| Mẹ/cha hoặc người giám hộ (đề xuất) | thương nhưng không nói nhiều, có việc riêng | ở nhà, lịch làm/trạm y tế | bữa cơm, giúp khi ốm, cần được giúp lại |
| Bạn Minh (đề xuất) | hài hước, đôi khi hay quên | trường/việc, nhóm bạn | rủ đi ăn, quên ví/cần xin lỗi |
| Bạn Thảo (đề xuất) | thực tế, giữ kế hoạch | đi làm, rảnh cuối tuần | chia bill minh bạch, giúp lên lịch |
| Bạn An (đề xuất) | giàu cảm xúc, bận chăm nhà | lịch linh hoạt | một số hôm vắng mặt, có chuyện riêng |
| Nhân viên/shipper (tái sử dụng ID thực tế) | có mục tiêu nghề nghiệp riêng | ca trực/đơn giao | hỗ trợ mở muộn, lộ trình giao |
| Chủ nhà/điện nước (đề xuất) | công bằng nhưng cứng về thời hạn | lịch hóa đơn hàng tuần | cho gia hạn theo niềm tin |
| Nhân viên y tế (đề xuất) | bình tĩnh, chuyên nghiệp | phòng khám theo giờ | đường chữa trị mềm, không hù dọa |

Mỗi NPC persistent có `id`, `homeZone`, schedule, goals, knowledge, relationships, dialogue pack, wardrobe, anim set và trạng thái **now/lastSeen**. Không để một nhân vật ở chợ và bệnh viện cùng lúc do rút ngẫu nhiên hai encounter.

## 3. Khung 30 ngày — một ngày một biến thể đáng nhớ

**Chú giải:** `C` = cốt truyện trọng tâm, `S` = sinh hoạt, `E` = event động. Các mục chưa có trong bản hiện hành phải triển khai theo gates, không tự unlock vì đã ghi trong bảng. Ngày 1–7 ưu tiên khi engine ngày hoàn chỉnh; ngày 8–30 là content plan có thể điều chỉnh qua test.

| Ngày | Hook đầu ngày | Gameplay và biến cố chính | Tác động bắc cầu |
| --- | --- | --- | --- |
| 01 C | Dậy đúng giờ khai trương | kiểm kho, pha/giao đơn đầu, chào người hàng xóm | khách quen nhớ cách tiếp |
| 02 S | Ngủ quên 40 phút | chọn xin lỗi khách hẹn/nhờ nhân viên/mở muộn | uy tín–sức khỏe–quan hệ ca trực |
| 03 C | Chợ thiếu món bán chạy | đi chợ, thương lượng nguồn hàng với Cô Hạnh | nguồn hàng/người giúp ngày 7 |
| 04 E | Trời mưa, đông người trú | sắp chỗ đợi, giao trà, thay đường đi | khách mới và review |
| 05 S | Mẹ rủ về ăn cơm | mua rau, nấu bữa tối hoặc giải thích lịch bận | quan hệ nhà và sức |
| 06 E | Nhóm chat rủ ăn đêm | quyết ai đi, tới muộn, chia bill hoặc tự nguyện đãi | ledger/promise, tình bạn |
| 07 C | Buổi trà cộng đồng | thực hiện lời hứa hoặc xoay xở nguồn lực | recap và kết chương đầu |
| 08 S | Ngày bình thường yên ả | tối ưu quầy, trò chuyện khách quen, dọn nhà | giảm stress và cải thiện vận hành |
| 09 E | Khách vội và khách cầu toàn | quản hàng đợi, xin lỗi, ưu tiên hợp lý | rating và lượt quay lại |
| 10 S | Đi chợ thấy giá rau tăng | so giỏ hàng, đổi thực đơn hoặc mua sớm | ngân sách/ăn uống |
| 11 C | Bạn thân có chuyện buồn | lắng nghe tại hồ hoặc tiếp tục ca bận | niềm tin và cuộc hẹn sau |
| 12 E | Tắc đường giao hàng | chọn đường vòng/đổi xe/nhờ shipper | thưởng/phạt mềm, tuyến đường |
| 13 S | Tới hạn hóa đơn điện nước | xem bảng kê, trả/gia hạn/làm việc phụ | ledger và uy tín thanh toán |
| 14 C | Cả nhà cùng nấu bữa tối | mua, sơ chế, ăn, nói chuyện chuyện chưa giải quyết | kết chương gia đình |
| 15 E | Lễ hội chợ phiên | bố trí quầy tạm, hàng đông, đồ trang trí | kinh tế và mở khu phố |
| 16 S | Sáng ngủ dậy thấy mệt | chọn nghỉ, nhờ người làm thay, ghé phòng khám | tiến trình sức khỏe |
| 17 C | Bạn đã giúp muốn nhờ lại | cân bằng thời gian và lời hứa | reciprocity |
| 18 E | Khách tip bất ngờ | xử lý tiền tip chung/quỹ nhân viên | lòng tin đội quán |
| 19 S | Một ngày tiết kiệm | nấu từ nguyên liệu còn, xử lý đồ sắp hỏng | giảm waste |
| 20 C | Hiểu lầm giữa hai người bạn | nghe hai phía, lựa chọn lời nói và hẹn gặp | nhóm bạn thay thành phần |
| 21 E | Cuộc hẹn nhóm tại quán ăn | người đến muộn/vắng, chia tiền minh bạch | kết chương bạn bè |
| 22 S | Sáng mùa mới | thay trang phục/cảnh, kiểm sửa quán, điều chỉnh menu | mở asset/season pack |
| 23 E | Gặp khách lạ cần chỉ đường | giúp/từ chối lịch sự, dẫn đi đoạn ngắn | khám phá điểm mới |
| 24 C | Tin khu phố sắp sửa đường | thương lượng lịch giao hàng, thích ứng tuyến | map/navigability |
| 25 S | Đi bộ dọc hồ nghỉ ngơi | câu cá hoặc trò chuyện, phục hồi sức | nhịp cảm xúc thư giãn |
| 26 E | Trượt chân xây xát nhẹ (sự kiện giới hạn) | lựa chọn sơ cứu/đi khám, đổi việc phù hợp | giảm tốc và người thân quan tâm |
| 27 C | Bạn hẹn nhưng chưa trả tiền | nói thẳng/xin gia hạn/bỏ qua có giới hạn | trust và ledger nợ |
| 28 E | Tiệm nhận đơn sự kiện | lựa chọn công suất, thuê thêm người hay từ chối | doanh thu và chất lượng |
| 29 C | Được mời thăm thành phố bên cạnh | lên kế hoạch tiền xe/giờ/quà, bỏ qua nếu chưa mở | hành trình liên vùng sau beta |
| 30 C | Bữa cơm tổng kết tháng | lựa chọn ưu tiên tháng tới, người đã giúp tới dự | kết chương 30 ngày, mở arc mới |

**Ví dụ chi tiết ngày 02 — “Mở muộn”:** 08:20 thức dậy (đúng lịch 07:30), tin nhắn đặt 3 cốc lúc 09:00. Người chơi chọn A nhờ nhân viên (tốn tiền, giữ khách), B tự chạy đến quán (tiết kiệm, có rủi ro trễ và stamina), C báo khách dời giờ (khách cụ thể có thể đồng ý tùy quan hệ), D hoãn bán để nghỉ nếu đang ốm. Qua chiều gặp chính khách đó và nghe phản hồi theo hành động; tổng kết ghi rõ khác biệt và ngày 04/09 đọc cờ. Không ép tự động chọn phương án xấu.

**Ví dụ chi tiết ngày 06 — “Bữa ăn nhóm”:** seed chọn 2–4 người theo schedule, người đến lúc 19:00/19:15 có logic. Bối cảnh có một chuyện vui, có thể gặp người quen hoặc cãi nhau nhỏ. Bảng chi hiện rõ từng món, lời đề nghị chia hoặc đãi, xác nhận chi; một bạn quên ví **không ép** người chơi trả. Vài ngày sau câu trả tiền/giúp đỡ xuất hiện theo `billPromiseId`.

**Ví dụ ngày 16 — “Cần một ngày nghỉ”:** diễn ra nếu sức khỏe giảm hoặc theo scripted event có lý do rõ. Cho người chơi quyền xin nhân viên thay ca, về nhà uống nước/ngủ, hoặc tới phòng khám khi chỉ báo cảnh báo. Vắng mặt ở quán làm thay đổi khách/tiền, gia đình gọi hỏi; không phát triển thành bệnh nặng ngẫu nhiên.

## 4. Máy phân phối tình huống, không random vô lý

Mỗi ngày: `eligible = beats.filter(prereq && zone && time && cooldown && cast && safety && budget)`; ưu tiên **critical story beats** trước, sau đó chọn 0–2 ambient/micro beat bằng PRNG deterministic seed `worldSeed/dayIndex/slot/beatPoolVersion`. Lựa chọn có trọng số theo mood, reputation, khu, mùa, lịch, mối quan hệ, sự kiện gần đây, nhu cầu của ngày; **không thay prereq thành weight**.

Quy tắc bắt buộc:
1. Beat quan trọng có path để tới đúng địa điểm; nếu NPC bận/bị thương, dùng nhánh thay thế **được tác giả viết**.
2. Một người không đóng hai vai/location trùng giờ. Sự kiện có lock theo NPC, zone và time-slot; nhả lock khi kết thúc/hủy có recovery.
3. Cooldown theo archetype, phân phối tuần, có bộ chống lặp 3 ngày và giảm trọng số khi vừa xuất hiện.
4. `severityBudget`: biến cố tiêu cực lớn tối đa theo chương; không có 3 ngày liên tiếp gặp tai nạn, mất tiền, ốm bệnh; theo dõi mood để chèn nhịp tích cực.
5. RNG để quyết định **ai tới** và **các chi tiết phụ**, không RNG bí mật ép outcome lựa chọn chính.
6. Event độc lập phải có transaction ID; sau reload không random lại cast/giá/kết quả đã xem.
7. Nếu pool không đủ: **fallback ngày bình thường có nội dung do tác giả viết**, không tạo “undefined encounter”.

`Director` trả **danh sách candidate + lý do đủ điều kiện + seed + manifest đã chốt** để debug/replay. Không tự gọi LLM runtime; tác giả có thể dùng AI ngoại tuyến đề xuất beat nhưng phải review/sửa/test.

## 5. Mô hình lựa chọn và hậu quả

- Decision có `choiceId`, `requires`, `costPreview`, `effects`, `next`, `fallback`; người chơi thấy thay đổi quan trọng trước khi xác nhận.
- Hệ quả 4 lớp: **tức thì** (trả tiền/tip), **ngày kế** (ngủ quên→khách giận), **giữa chương** (giúp Cô Hạnh→giá nguồn hàng), **dài hạn** (bạn giúp lại trong biến cố gia đình).
- Khi cùng arc quay lại, journal liệt kê quyết định trước và sự kiện chỉ nhân vật biết; không dùng retcon để làm người chơi “thắng” miễn phí.
- “Thất bại mềm”: lỡ hẹn→xin lỗi/chọn dịp mới; quán thiếu hàng→đổi menu; nợ hóa đơn→gia hạn; bị thương→hẹn lại; không reset game, không softlock, không tự trừ vật phẩm hai lần.

## 6. Cơ chế tiếp tục sau ngày 30

Không viết `if (dayIndex > 30) gameOver`. Daily planner tra `chapterArc`, `availableDayPacks`, `calendar`, story flag, tính khác biệt `cooldown`; có **repeatable calm-day templates** cho đến khi pack ngày 31+ được phát hành, nhưng **không tự quảng cáo là ngày mới có cốt truyện độc đáo** nếu chỉ lặp template. Nhãn “ngày thường” minh bạch, vẫn tồn tại sinh hoạt/kinh tế/NPC.

Content release `chapter-02-days-31-45` có thể thêm khu mới và arc tiếp nối mà không sửa `DayDirector`. Mỗi pack buộc có ID không trùng, dependency, minEngineVersion, save migration, licensing, test seeds, localization, fallback. Mỗi vòng phát triển **có thể giao đúng một ngày mới**, sau khi engine, hiệu năng và cổng content của ngày đó đạt; không đồng nghĩa tự động nhận đủ mọi ngày chỉ nhờ random.

## 7. Gate nghiệm thu nội dung

- Mỗi ngày có opening, hoạt động chơi được, 1–3 story beats, closure, atleast 2 lựa chọn có khác biệt gameplay, fallback và nhật ký.
- 50 seed chạy được 30 ngày không missing NPC/item/zone, không kẹt/cộng thưởng lặp; tất cả branch story chính reachable.
- Snapshot test: `seed + state + content version` cho manifest bất biến khi reload; replay cho kết quả giống nhau.
- Review văn hóa tiếng Việt, câu thoại tự nhiên theo tuổi/bối cảnh; cảm xúc tinh tế, người thân/bạn bè nhất quán; không xúc phạm/trị liệu giả.
- Gameplay QA 360×800, 390×844, 844×390, desktop và nghiệm thu trên Android/iPhone thật theo budget roadmap; chứng minh rằng nhiều day pack **không tải** assets/text của mọi khu ngay khởi động.
