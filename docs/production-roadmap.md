# Lộ trình beta → production: Tiệm trà giữa phố Hà Nội

Ngày chốt: 08/10/2026. Nhánh làm việc: `codex/mobile-beta-foundation`.
Baseline code: `c18c87e238bc5e335c40c96c48e90ad8625ab3ef`.
[Kiểm chứng baseline](beta-baseline.md) · [Quy trình từng vòng](iteration-protocol.md) · [Prompt bước đầu](next-step-prompt.md).

## Sản phẩm và phạm vi

Người chơi sống trong khu An Hòa hư cấu ở Hà Nội, vận hành tiệm trà sữa, đi bộ làm việc trong phố, kết bạn và chịu hệ quả từ lời hứa, cách nói chuyện, việc đã làm. Tiệm trà là trung tâm: nguyên liệu, doanh thu, khách quen và quan hệ hàng xóm nối các hoạt động lại với nhau.

Đồ họa hướng tới tỷ lệ người và kiến trúc thuyết phục, chất liệu có chiều sâu, chuyển động tự nhiên, ánh sáng thống nhất. Chăm chút phần nhìn gần: khuôn mặt, bàn tay cầm cốc, vải, cửa hàng, vỉa hè, biển chữ Việt và cây. Thành phố rộng nhờ nhiều khu liên thông; độ chi tiết giảm theo khoảng cách. Chi tiết gạch/ngói dùng chất liệu và normal map, chỉ thêm hình học ở nơi người chơi nhìn thấy khác biệt. Mỗi asset phải có ngân sách và bằng chứng hình ảnh trước khi nhân rộng.

Beta có một hành trình trọn vẹn 30–45 phút quanh tiệm, chợ và hồ; ít nhất ba NPC có liên hệ chéo, ba quyết định chính, hai kết thúc khác nhau và đường sửa sai. Giữ các khu phố hiện có đi được; ưu tiên hoàn thiện ba khu trọng tâm trước khi tăng số nhiệm vụ. Nội dung production mở rộng theo cùng hệ thống đã kiểm chứng. Chức năng tài khoản, multiplayer và thương mại nằm sau vòng beta cốt lõi.

## Thứ tự thực hiện và cổng nghiệm thu

Mỗi dòng gồm nhiều vòng nhỏ, mỗi vòng chỉ có một prompt. Chỉ chuyển mốc khi đáp ứng cổng nghiệm thu; không gắn ngày giao khi chưa đo khối lượng và thiết bị thật.

| Mốc | Kết quả cần xây | Cổng nghiệm thu | Trạng thái |
| --- | --- | --- | --- |
| M0 | Lưu code, CI, ảnh và báo cáo baseline | Remote đúng SHA; test/build/CI xanh | Đã đạt cho baseline code |
| M1 | Đo hiệu năng đáng tin và giảm tải cảnh nặng nhất | Báo cáo tái lập, bộ đếm rõ nghĩa, trước/sau cùng máy và góc nhìn; giảm ít nhất 40% draw call cảnh toàn phố chế độ nhẹ; không hỏng di chuyển hay tương tác | **OWNER-ACCEPTED 10/10/2026** — xem báo cáo nghiệm thu; raw device logs chưa đính kèm |
| M2 | LOD, phân khu tải cảnh, instancing và pipeline texture | Đạt ngân sách mobile bên dưới; chuyển khu không mất vật thể tương tác; bộ nhớ ổn định sau 10 lượt ra/vào | **ĐANG TRIỂN KHAI** — QR-05, chưa nghiệm thu |
| M3 | Bộ asset mẫu: người, tiệm, nhà phố, cây, xe và ánh sáng | Duyệt ảnh gần/xa, chuyển động và hiệu năng trên máy yếu trước khi nhân rộng | Chờ M2 |
| M4 | Hoàn thiện điều khiển, camera, va chạm và NPC | Đi/chạm/xoay đồng thời; không xuyên vật cản, kẹt đường hoặc camera xuyên tường; kiểm tra thiết bị thật | Chờ M3 |
| M5 | Engine cốt truyện có trạng thái và công cụ kiểm tra nội dung | Mọi nhánh khả dụng đi tới điểm tiếp tục/kết thúc; hiệu ứng chạy đúng một lần; save cũ chuyển đổi được | Chờ M4 |
| M6 | Hành trình beta với các việc đời thường và kinh tế tiệm | Chơi được hai kết thúc từ save mới; lựa chọn trước đổi nhiệm vụ/tình huống sau, không chỉ đổi lời thoại | Chờ M5 |
| M7 | HUD mobile, onboarding, hội thoại, âm nhạc và khả năng tiếp cận | Người mới hoàn thành đơn đầu trong 3–5 phút; không che thao tác; chữ Việt đọc được và chạm chính xác | Chờ M6 |
| M8 | Save, resume, offline/update và kiểm thử tích hợp | Không mất tiến trình khi reload/cập nhật; nền rồi quay lại không di chuyển kẹt, nhạc chồng hoặc nhận thưởng lặp | Chờ M7 |
| M9 | Build beta HTTPS, feedback và diễn tập rollback | Đạt checklist phát hành; test 15 phút trên thiết bị mục tiêu; bản rollback đọc được save hoặc có đường phục hồi | Chờ M8 |
| M10 | Sửa theo trải nghiệm beta, mở rộng chương và release candidate | Đạt chỉ số người chơi, ngân sách hiệu năng và nghiệm thu nội dung trên bản ứng viên cuối | Chờ M9 |

## Ngân sách hiệu năng mobile

Các số sau là mục tiêu kỹ thuật ban đầu, chưa phải kết quả đã đạt. M1 sẽ xác nhận cách đếm; chỉ sửa ngân sách bằng số liệu và ghi lý do trong báo cáo. Không dùng ảnh chụp màn hình 390px để kết luận một điện thoại yếu chạy mượt.

| Hạng mục | Mục tiêu cho chế độ nhẹ |
| --- | --- |
| Thiết bị nghiệm thu | Ít nhất một Android RAM 3–4 GB/GPU phổ thông đời cũ và một iPhone nằm trong phạm vi hỗ trợ; ghi rõ model, OS, trình duyệt, độ phân giải |
| Tốc độ | 30 FPS ổn định trong lượt chơi 15 phút; P95 khoảng cách giữa khung hình đã render ≤40 ms; khung >100 ms dưới 1% ngoài loading/chuyển khu được hiển thị |
| Draw call | ≤200 ở góc đi bộ, ≤300 ở tổng thể; ghi riêng main pass và shadow pass khi renderer hỗ trợ |
| Tam giác | ≤150 nghìn main pass khi đi bộ, ≤250 nghìn ở tổng thể; thống kê shadow riêng |
| Pixel/shadow | DPR ≤1 ở máy yếu; shadow theo ngân sách, ưu tiên bóng đơn giản cho NPC xa; không bật hậu kỳ nặng mặc định |
| Tải ban đầu | JS thực tải nén ≤1,5 MB; tổng dữ liệu trước khi điều khiển được ≤5 MB; tài nguyên khu khác tải sau |
| Thời gian vào chơi | ≤10 giây trên cấu hình mạng kiểm thử 10 Mbps, RTT 100 ms; có tiến trình tải và phương án giảm chất lượng khi thất bại |
| Bộ nhớ | Theo dõi JS heap và số geometry/texture/skeleton; plateau sau warm-up, tăng <10% sau 10 chu kỳ ra/vào; đo GPU memory khi công cụ cung cấp |
| Điều khiển | Không giữ hướng sau nhả/cancel/blur; phản hồi nhìn thấy ở khung render kế; kiểm thử thật thao tác hai ngón |

Thiết bị tầm trung có thể nâng hình ảnh; chỉ mở 60 FPS sau khi đo đạt. CPU time hiện tại đo từ đầu tick được render tới khi `renderer.render` trả về, gồm cập nhật cảnh và submit; không phải GPU time. M1 phải tách simulation, render submission và frame interval; GPU timing có thể ghi “không hỗ trợ”. Không gán số GPU giả.

Three.js là đường chạy mặc định trong lúc tối ưu; Babylon.js tải khi được chọn và cần giữ tương đương va chạm, nhân vật, texture và dispose. Một renderer hoạt động tại một thời điểm. Kiểm tra request thực tế để xác nhận lazy-load; dung lượng một chunk trong build chưa chứng minh nó không tải ban đầu.

Khi triển khai batching: dùng nhóm có cùng geometry/material, giữ bounds chính xác và phân khu để culling vẫn hữu ích. LOD phải giữ collider/điểm tương tác ổn định, không lấy mesh trang trí làm nguồn luật va chạm. Với Babylon, cân nhắc thin instances cho vật thể tĩnh lặp lại theo [tài liệu chính thức](https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/thinInstances); cần kiểm chứng đường chuyển đổi của dự án trước khi áp dụng.

## M3: tiêu chuẩn đồ họa trước khi nhân rộng

- **Nhân vật:** một cơ thể liền, tỷ lệ đầu/cổ/vai/hông hợp lý; rig và skinning cho khuỷu/gối; bước chân theo quãng đường, chân không trượt rõ; idle, đi, cầm cốc, nói chuyện; mắt/tóc/trang phục phân biệt được ở camera chơi. LOD gần/vừa/xa và tái dùng animation. Asset gốc, giấy phép và preset export phải lưu cùng manifest.
- **Nhà cửa:** một bộ module nhà ống, khu tập thể, mái ngói và tiệm trà; cửa/kính/khung/cầu thang/ban công/cục điều hòa/biển hiệu đúng tỷ lệ. Atlas và vật liệu dùng chung; các cửa vào được có collider và điểm tương tác rõ.
- **Cây, đường, xe:** cây có thân/tán/bóng nhất quán; gốc cây, bó vỉa, vạch đường và gạch lát có quy luật, tránh lặp nhìn quá rõ; xe có silhouette đúng và collider khớp. Thay chi tiết xa bằng LOD phù hợp.
- **Ánh sáng/camera:** màu vật liệu không cháy sáng; da người không thành nhựa; bóng giúp đọc khoảng cách. Theo chân không che người bởi mái/tường, có chuyển cảnh và zoom có giới hạn; tổng thể thành phố có LOD riêng.
- **Kiểm tra hình:** cùng pose, ánh sáng và camera ở 390×844, 360×800, 844×390 và desktop; ảnh gần mặt/tay, toàn thân, mặt tiền và đường phố. Không duyệt chỉ bằng một ảnh tổng thể.

## M4/M7: cảm giác chơi và giao diện

Núm analog tròn có dead zone, giới hạn tốc độ, smoothing vừa phải và phản hồi hướng. Pointer cho núm và camera độc lập; mở modal hoặc mất focus giải phóng ngay input. Chạm NPC/đồ vật không bị hiểu nhầm là xoay camera; mục tiêu tương tác gần nhất có dấu hiệu rõ. Tự đi phải dùng cùng collision solver như joystick, có phản hồi khi không tìm được đường.

HUD chỉ giữ thông tin cần lúc chơi. Sổ nhiệm vụ thu gọn, mục tiêu hiện tại ngắn và có mốc trên bản đồ; hội thoại có chân dung, tên, tính cách và 2–4 câu trả lời dễ chạm. Tối thiểu vùng chạm 48px; safe-area, bàn phím màn hình và ngang/dọc được kiểm tra. Có cỡ chữ, giảm chuyển động, âm lượng nhạc/hiệu ứng riêng. Nhạc nhẹ vui nhộn, biến thể tiệm/phố/hồ, chuyển âm mượt, tránh vòng lặp ngắn gây khó chịu; kiểm tra bằng tai trên loa điện thoại. Bắt đầu âm thanh sau thao tác người chơi và dừng/tiếp tục đúng khi app ra nền.

## M5: cốt truyện phân nhánh có hệ quả

“Nhị phân” được hiểu là quyết định chính có hai hướng A/B; mỗi hội thoại vẫn có 2–4 cách nói chân thành, vui đùa, thẳng thắn hoặc khó chịu. Câu trả lời đi tới nhánh phù hợp với trạng thái và tính cách NPC. Cộc cằn có thể giúp đặt giới hạn trong một tình huống; thân thiện có thể tạo lời hứa khó giữ. Viết hệ quả theo ngữ cảnh, tránh mọi câu tử tế đều thắng và mọi câu gắt đều thua.

Nội dung là đồ thị tình huống do tác giả viết. Nhánh có thể gặp lại ở cùng sự kiện, nhưng giữ cờ và quan hệ từ quyết định trước; tình huống sau đọc những cờ đó. Không cần nhân đôi vô hạn toàn bộ cây để tạo cảm giác mỗi lần chơi khác nhau.

Mỗi node có `id`, lời thoại/tình huống, điều kiện vào, lựa chọn, hiệu ứng và đường tiếp theo. Mỗi lựa chọn có ID ổn định, điều kiện hiển thị/khả dụng, câu nói, tác động và `next`. State lưu chương/node hiện tại, quan hệ từng NPC, niềm tin, lời hứa, nợ ân tình, uy tín tiệm, sự kiện đã làm và ledger phần thưởng. Lịch sử có decision ID; engine điều kiện dùng dữ liệu có kiểu, không chạy script tùy ý từ nội dung.

Quyết định phải được áp dụng nguyên tử, đúng một lần; save/reload không phát tiền hai lần. Tránh chọn tiếp ở node cũ, nhiệm vụ không thể hoàn tất và vòng lặp vô hạn. Save v3 giữ tiền, kho, nâng cấp và nhiệm vụ cũ khi migrate sang phiên bản mới; ID thiếu có đường phục hồi có giải thích, không reset âm thầm.

Kiểm thử graph: ID trùng, đích không tồn tại, node không tới được, điều kiện mâu thuẫn, nhánh không có lối ra, phần thưởng lặp và mọi tổ hợp cờ liên quan. Mọi lựa chọn chính có ít nhất một hệ quả quan sát được ở lời thoại sau **và** gameplay (người hỗ trợ, giá, thời hạn, tuyến việc hoặc cách giải quyết). Có sổ chuyện ngắn để người chơi hiểu sự kiện đã xảy ra; chỉ tiết lộ thông tin nhân vật có thể biết.

### Khung truyện beta: Một tuần ở Phố Nhỏ

1. **Mở tiệm:** thiếu nguyên liệu cho ngày bán đầu. A: giữ giờ mở và mua gấp; B: giúp cô Hạnh trước để có nguồn hàng quen. Cách nói quyết định mức tin tưởng và điều kiện hỗ trợ, không chỉ thêm/bớt điểm quan hệ.
2. **Lời hứa trong phố:** đơn tập thể trùng giờ giúp việc ở hồ. Nếu đã giúp cô Hạnh, có thể nhờ giới thiệu người giao; nếu đã mua gấp, có hợp đồng phải hoàn thành. Chọn A: ưu tiên đơn; B: giữ lời hứa. Có cách thương lượng lịch khi đạt điều kiện, không xuất hiện cho mọi save.
3. **Buổi trà chung:** khách khó tính, hàng xóm và thời tiết thử những điều đã hứa. Việc trước làm thay đổi ai đến, ai hỗ trợ, nguyên liệu và giải pháp. Hai kết thúc beta: buổi trà thành công nhờ cộng đồng / tiệm đứng vững nhờ giữ cam kết kinh doanh; lối sửa sai cho lời hứa hụt. Production thêm kết thúc dung hòa và chương tiếp theo.

Ba quyết định A/B tạo tối đa tám tổ hợp chính để kiểm thử; cờ lời nói và quan hệ tạo các biến thể có kiểm soát. Đây là khung nội dung đề xuất, sẽ chốt bằng một prompt riêng ở M5/M6.

## M6: nhiệm vụ gắn với đời sống và tiệm

Nhận đơn → pha/đóng cốc → giao đúng khách vẫn là vòng chính. Nhiệm vụ mới chọn trong các nhóm: nhập/kiểm hàng; giao cốc có giới hạn độ tươi; giúp dọn/gom vật dụng; tìm đồ thất lạc theo lời NPC; trang trí buổi trà; câu cá/nghỉ để hồi sức. Mỗi nhiệm vụ có mục tiêu, thao tác thật, phản hồi, điều kiện thất bại mềm và cách làm lại. NPC đi lại có lịch đơn giản; đường đi tránh người/xe, không chặn vĩnh viễn cửa tiệm.

Giá và phần thưởng phải nối về quỹ, nguyên liệu, thời gian hoặc quan hệ. Không bắt người chơi lặp hàng loạt cùng một thao tác chỉ để mở chuyện. Có lựa chọn nhận tiền/giúp miễn phí với hệ quả về sau và giới hạn hợp lý. Test bảo toàn kho/tiền, thưởng một lần, đơn không có nguyên liệu và trạng thái rời tiệm trong ca.

## M8/M9: điều kiện được mở beta

- `npm test`, `npm run build` và GitHub Actions đạt trên chính SHA phát hành; build được chạy bằng production preview.
- Không còn lỗi P0/P1: không vào được game, mất save, kẹt tiến trình, nhận tiền lặp, xuyên vật cản chính hoặc input kẹt. Lỗi nhỏ có mô tả tái hiện và ưu tiên.
- Chơi từ đầu tới hai kết thúc, lưu/quay lại giữa nhánh; 15 phút trên thiết bị mục tiêu gồm pha trà, đi phố, hội thoại và chuyển khu. Ghi FPS/frame time, giật, nóng máy và thời gian tải theo thiết bị.
- Kiểm thử mạng chậm, mất mạng khi đã tải, reload sau update, audio ra nền, đổi chiều màn hình và context loss nếu tái hiện được. Offline hỗ trợ tới đâu phải hiển thị đúng tới đó.
- Release có version, SHA, changelog, manifest asset/giấy phép; HTTPS, cache chunk theo hash, HTML/service worker cập nhật an toàn. Diễn tập rollback và tương thích save; không xóa dữ liệu để chữa lỗi.
- Feedback trong game nhận lỗi/mức thích/thiết bị; chẩn đoán chỉ gửi khi người chơi đồng ý, không thu dữ liệu cá nhân không cần thiết. Chọn kênh nhận và nơi deploy ở prompt phát hành.
- Beta kín 10–20 người, ưu tiên nhiều máy yếu; mục tiêu ban đầu ≥80% tự làm xong đơn đầu và ≥60% tới kết thúc hành trình beta. Ghi mẫu và số lượt thực tế, không suy ra tỷ lệ toàn bộ người chơi từ mẫu nhỏ.

## M10: từ beta tới production

Sửa lỗi chặn và hiệu năng trước, rồi chọn tối đa ba vấn đề trải nghiệm lớn nhất mỗi vòng. Kiểm chứng lại cùng thiết bị và save trước/sau. Khi core ổn định, mở rộng các khu còn lại bằng bộ asset đã đạt ngân sách; thêm chương với liên hệ giữa sáu cư dân, sự kiện thay đổi tiệm và kết thúc có hậu quả kéo dài.

Production cần nội dung từ đầu tới cuối, cân bằng kinh tế, asset thống nhất, hướng dẫn/hỗ trợ người chơi, kiểm thử cập nhật dữ liệu dài hạn, kiểm tra dependency/giấy phép và bảo mật theo chức năng thực tế. Nghiệm thu lại toàn bộ ngân sách trên release candidate. Theo dõi lỗi sau phát hành và có bản phục hồi đã diễn tập.


## Định hướng dài hạn sau beta: Living City / vòng lặp mỗi ngày một màn (LC)

**Chỉ là kế hoạch, không thay đổi thứ tự M0–M10 hoặc cổng M1.1.** Theo định hướng sản phẩm bổ sung 08/10/2026, tiệm trà dần trở thành life-sim kể chuyện: thức dậy/mở cửa đúng giờ hoặc ngủ quên, khách khó tính/tip, chợ và nấu ăn, người thân và nhóm bạn, ăn chung/chia tiền, sức khỏe–phòng khám, hóa đơn–chi phí, tình huống giao thông và những ngày vui/buồn; các lựa chọn có hệ quả qua ngày. Thành phố mở rộng theo zone/chapter đến khu lân cận và biển, **không render hoặc tải mọi khu cùng lúc**. Mỗi ngày là day content pack + state/seed/lịch, không phải một bản build độc lập; cần tác giả và QA, không thể tuyên bố vô hạn nội dung độc đáo chỉ từ random.

**Bộ thiết kế chính thức để các AI cùng đọc:** [Game Design Bible](game-design/README.md) · [Needs/economy/friends](game-design/life-systems.md) · [Cốt truyện 30 ngày & event director](game-design/story-and-days.md) · [World/mobile/render/animation](game-design/world-and-performance.md) · [Typed content/save](game-design/data-and-save-contract.md) · [AI handoff & backlog](game-design/ai-delivery-playbook.md). Các tài liệu mô tả **future design**, không khẳng định đã code.

**Mở theo dependency, không theo mong muốn ngày mới:** sau core beta M1–M10, thực hiện `LC-00` (contract, validator) → `LC-01` (clock/day director/seed/save) → `LC-02` (nhà/chợ/ăn) → `LC-03/04` (social + kinh tế) → `LC-05/06` (sức khỏe + lịch cư dân/traffic) → `LC-07` (day packs/30 ngày) → `LC-08` (liên vùng/biển) → `LC-09` (tooling và các batch ngày tiếp theo). Vòng bổ sung ngày `LC-DNN` chỉ được mở sau content engine + cần zones/assets/QA đã đạt; một ngày cần ít nhất hook, hành động, lựa chọn có hậu quả và closure, test seed/reload/save/perf/device; nếu không đạt tiếp tục ngày đang làm, không chuyển N+1.

Những thành phần nền như data contracts, story outline, validator design hoặc asset budget có thể được nghiên cứu song song **chỉ khi không làm chệch cổng hiện tại**. Mục tiêu mobile và ngưỡng kiểm thử giữ nguyên bảng ngân sách ở trên; không coi số đo software Chromium là nghiệm thu thiết bị thật.


## Trục chất lượng trải nghiệm theo phản hồi 10/10/2026

Chủ dự án yêu cầu thay trọng tâm trải nghiệm: **gameplay bớt nhàm, nhân vật đẹp và có biểu cảm, animation/tương tác tự nhiên, VFX/âm thanh giàu phản hồi, phố và đồ họa có chiều sâu nhưng vẫn chạy được trên điện thoại yếu**. Đây là định hướng bắt buộc cho các vòng triển khai tiếp theo, không phải bằng chứng các hạng mục đã cải tiến.

Bộ tài liệu giao việc cho mọi AI: [Experience Quality Initiative](experience-quality/README.md), [91 task IDs có acceptance/dependency](experience-quality/backlog.md), [quality gates](experience-quality/quality-gates.md), [AI ownership và handoff](experience-quality/ai-handoff.md). Thực thi từng slice có ảnh/clip trước–sau, gameplay, performance và human review; **không nới lỏng các cổng M2–M10 hoặc đảo thứ tự milestone**. M1 đã được chủ dự án xác nhận nghiệm thu ngày 10/10/2026; M2 tiếp tục kiểm chứng instancing, LOD, streaming và ngân sách máy yếu trước khi mở M3. Mẫu nhân vật và gameplay mở rộng làm ở đúng mốc roadmap.
