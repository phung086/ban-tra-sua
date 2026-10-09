# Hệ thống đời sống, kinh tế và quan hệ — LC Specification

> **Kế hoạch, chưa triển khai.** [Game Bible](README.md) · [Hợp đồng dữ liệu](data-and-save-contract.md). Không thay thế state/save v3 hiện hữu hoặc M1.1.

## 1. Nhịp thời gian và lịch ngày

- Game dùng `gameMinute` là nguồn thời gian duy nhất cho simulation; một ngày dự kiến 06:00–24:00, ngủ sẽ advance có kiểm soát. Thời lượng ngày chơi mục tiêu **15–30 phút**, điều chỉnh sau playtest; story beat có thể giữ đồng hồ khi thoại/cutscene.
- Lịch gồm số ngày chơi `dayIndex`, thứ, mùa, thời tiết, ngày lễ giả lập, lịch hẹn, hạn trả tiền và trạng thái khu phố. Giờ của NPC/shop/transit lấy từ lịch này, **không phụ thuộc đồng hồ hệ điều hành**.
- Pause khi menu, tab hidden, mất WebGL context; không chạy mô phỏng hàng giờ do tab ở nền. Fast travel chỉ giữa trạm đã mở và có chi phí/thời gian hợp lý, không vượt blocker kịch bản.
- Mỗi sáng chọn lịch: mở tiệm đúng giờ/đến muộn; đi chợ trước; dành giờ thăm gia đình; nhận ca phụ; nghỉ dưỡng. Việc chọn có cơ hội/chi phí; khách và NPC biết giờ mở thực tế.
- Time-slot scheduler: 06–09 sáng, 09–12 buổi mở, 12–14 trưa, 14–18 chiều, 18–22 tối, 22–24 chuẩn bị ngủ; mỗi activity khai `minDuration`, `timeWindows`, `location`, `canInterrupt`.
- Không spawn các cuộc gọi/khách khi người chơi đang ở cutscene, màn chuyển vùng, tình trạng cấp cứu, hoặc không thể tương tác.

## 2. Nhu cầu nhân vật và sức khỏe

| Trạng thái | Nguồn tăng/giảm | Tín hiệu trong game | Gameplay và cứu hộ |
| --- | --- | --- | --- |
| `hunger` | thời gian, vận động; ăn bữa giảm đói | hoạt ảnh, HUD màu trung tính | bỏ bữa làm giảm sức bền/khả năng tập trung, không bất tỉnh tức thì |
| `energy` | làm việc, đi bộ; ngủ/nghỉ hồi | bước chậm, nhắc nghỉ | có lựa chọn đóng quán, nhờ hỗ trợ, nghỉ trưa |
| `hygiene` (sau beta) | làm việc/mưa; tắm/rửa hồi | thay trang phục/vệt bẩn nhẹ | chỉ tác động xã hội nhẹ, không ép grind |
| `mood` | tương tác, áp lực, thành tựu, thời tiết | biểu cảm/nhật ký | ảnh hưởng lựa chọn thoại và ngữ khí, không tự khoá câu chuyện |
| `wellbeing` | ngủ, ăn, nghỉ ngơi; sự kiện bệnh | người nhà hỏi thăm | khi thấp: giảm lịch, nhiệm vụ hỗ trợ; không chẩn đoán bệnh thật |
| `injury` | va vấp được tác giả viết, tình huống giới hạn | vận động thận trọng | đường đến phòng khám/bệnh viện, chi phí và hồi phục hợp lý |

Thang điểm gợi ý 0–100 **chỉ để prototype**, không gắn chặt ở component. Drain theo hoạt động và `deltaGameMinutes`, giới hạn sau khi pause/fast-forward. Không rút điểm bằng frame count hay real-time elapsed khi ứng dụng bị treo.

**Tình huống sức khỏe:** cảm mưa→mệt→nghỉ/uống nước/đi khám nếu kéo dài; té xe nhẹ→sơ cứu/khám→đi chậm vài ngày; bệnh nặng là nhánh truyện viết tay, có trigger giới hạn và hỗ trợ thực tế. Không diễn giải hệ thống như khuyến cáo y tế. Bệnh viện có quy trình đăng ký–đợi–khám–thanh toán/lời nhờ; lựa chọn chăm sóc, không làm minigame tàn nhẫn.

## 3. Nhà, chợ, nấu ăn và bữa cơm

- Nhà có giường, bếp, tủ lạnh, bàn ăn, điện, nước, tủ đồ, tin nhắn, lịch; tương tác qua cùng hệ thống proximity + collider. Đồ decor không nhất thiết có công dụng, nhưng thứ tương tác phải có vùng đứng/hướng dùng.
- Chợ bán theo `itemId`, `stock`, `priceVnd`, `quality`, `freshness`, lịch mở cửa; giỏ và quầy thanh toán có bước xác nhận. Người bán nhớ khách quen/lời hứa, giá ngày phụ thuộc supply/demand bounded.
- Thức ăn riêng với nguyên liệu trà; prototype món: cơm + trứng, cơm rang, rau luộc, canh, bánh mì, bún. Mỗi recipe có nguyên liệu, thời gian, dụng cụ, hoạt ảnh và biến thể thành phẩm (chín/đạt/cháy nhẹ); có lựa chọn mua suất ăn sẵn nếu không thích nấu.
- Chu trình: kiểm tủ → lập danh sách → ra chợ (hoặc mua ở cửa hàng) → trả tiền → về nhà → chuẩn bị/bật bếp → ăn một mình/cùng người thân → dọn. Cho phép `skipRoutine` sau khi đã học, vẫn hạch toán vật tư/thời gian.
- Không biến việc ăn thành penalty mỗi vài phút. Gợi ý **1–2 bữa chính/ngày** trong beta sau mở rộng; cân bằng qua playtest.
- Đối tượng trong bếp chỉ dùng các animation không mang tính hướng dẫn thao tác nguy hiểm. Đường đi quanh bếp/tủ/chợ có nav blockers.

## 4. Vận hành tiệm và khách đa dạng

Khách có identity (khách quen) hoặc generated persona (khách lạ), giờ đến và hoạt động cụ thể:
- Thuộc tính `patience`, `budgetBand`, `tasteProfile`, `allergyRestrictions` (nếu dùng phải có xác nhận), `tipPropensity`, `socialContext`, `relationship`, `mood`, `visitHistory`.
- Archetype có thể phối điều kiện nhưng **không gắn “khó tính” với nhóm xã hội ngoài đời**: vội đến trường, cầu toàn, thích trò chuyện, khách quen ủng hộ, người đang buồn, nhóm bạn đông, khách ưu tiên nhanh, người đặt hộ.
- Tips dựa trên khả năng/thiện chí + trải nghiệm + luật cửa hàng, với cap để không gây lạm phát. Người khó tính có thể không tip nhưng quay lại nếu được lắng nghe; người hào phóng không tự thắng mọi ngày.
- Lượt khách do traffic/time/weather/reputation/holiday, có hạn mức theo performance và thời gian mở. Khi nghỉ quán hoặc mở muộn, không được sinh khách vô hình để phạt không có cách ứng phó.
- Khách và nhân viên có queue, vị trí đứng chờ không va nhau; nếu hàng dài có UI dự đoán chờ. Kẹt path dẫn đến tái tìm đường, dịch vị trí spawn hợp lệ hoặc bỏ event có log, không dịch xuyên tường.
- Gameplay pha trà hiện hữu phải giữ nguyên hợp đồng đơn/cốc/kho/tiền. Dịch vụ giao hàng có deadline mềm và chọn bồi thường/xin lỗi khi chậm.

## 5. Tiền, vật giá, thanh toán và nợ

**Đơn vị:** VND giả lập, hiển thị phân tách nghìn rõ; tất cả giao dịch dùng số nguyên, không float tiền. Hạch toán bằng ledger với event ID idempotent.

Luồng tiền: tiền mặt/tiền tài khoản trong game (có thể bắt đầu chỉ một ví) ← bán hàng, tip, việc phụ, tặng; → nguyên liệu, ăn, điện/nước, thuê mặt bằng, đi lại, sửa đồ, khám bệnh, quà, đi chơi, đầu tư tiệm. Không có tiền thật, microtransaction hay quảng cáo bắt buộc.

**Bảng cân bằng ban đầu chỉ là giả định thiết kế để điều chỉnh sau playtest, không phải giá thị trường được xác minh:**

| Khoản | Khoảng giá thiết kế tham chiếu | Quy tắc |
| --- | --- | --- |
| Ly trà | 20.000–45.000 VND | cost = nguyên liệu + công, margin phải dương khi bán đúng |
| Bữa ăn đơn giản | 15.000–45.000 VND | nấu ở nhà thường rẻ hơn mua ngoài nhưng tốn thời gian |
| Giỏ chợ 1–2 bữa | 30.000–100.000 VND | giá từng mặt hàng xác định từ catalog |
| Hẹn ăn cùng bạn | 50.000–180.000 VND/người | ai trả được quyết định bằng tình huống, **không bí mật trừ tiền** |
| Hóa đơn tuần (gộp beta) | 100.000–350.000 VND | báo trước ít nhất 2 ngày chơi; có gia hạn/trả góp |
| Khám bệnh trong game | theo kịch bản/tier | luôn có đường được hỗ trợ nếu thiếu tiền |

Giá điều chỉnh theo `basePrice` × `districtMultiplier` × `supplyFactor` × `seasonFactor` × `storyModifier`; cap thay đổi một lần/ngày (ví dụ ±5–10% với thực phẩm, sự kiện đặc biệt phải hiện thông báo). Hệ thống không crawl giá online mỗi ngày; cập nhật catalog theo phiên bản game, có nguồn và kiểm định trước khi áp dụng.

**Hóa đơn:** phát hành ở ngày định sẵn → notification + dueDay → chọn trả đủ/trả một phần/xin hoãn → ledger → hệ quả công bằng. Không tự rút khi modal đang mở hoặc không thông báo. Khi thiếu tiền: làm việc nhỏ, thanh lý vật phẩm được phép, hỗ trợ gia đình/vay không lãi hạn mức, gia hạn hóa đơn, nhiệm vụ giúp trả nợ; không có deadlock. Chống free-money exploit và double-pay khi reload bằng transactionId.

**Cân bằng tự động:** property tests cho không mất/nhân tiền; mô phỏng 30 ngày seed khác nhau, percentile tiền đáy, số ngày bị thiếu ăn, nợ tích lũy, tỷ lệ mở cửa; ít nhất một đường tiến triển hợp lý mà không cần hoàn hảo.

## 6. Người thân, bạn bè, lịch nhóm và ai trả tiền

Mối quan hệ **đa chiều**, không chỉ cộng/trừ số `friendship`:
- `trust` (tin), `closeness` (thân), `tension` (căng), `reciprocity` (qua lại), `lastContactDay`, `promises`, `sharedMemories`, `availability`, `boundaries`.
- Người thân có ngày làm việc, giờ nấu/bữa cơm, nhu cầu hỗ trợ; bạn bè có nhóm chat hẹn ăn/học/làm, người tới/người bận. NPC vẫn có các tương tác với nhau khi người chơi không ở đó, nhưng phải dựa trên luật/sự kiện tiết kiệm, không simulation full AI offline.
- Mời một nhóm 4 bạn: có thể 4 cùng đi, 2 đi trước, 1 đến muộn, 1 bận không đến. Random lựa chọn bị ràng buộc bởi lịch, tiền, quan hệ, địa điểm, thời tiết, lời hứa và ngân sách. Có thể từ chối tử tế và hẹn lại.
- **Thanh toán nhóm:** đề nghị chia đều/chia theo món, người A đãi, người chơi đãi, chơi oẳn tù tì cho **phần chi nhỏ tự nguyện**, hoặc một người quên ví tạo lời hứa trả sau. Trước khi chốt phải hiển thị số tiền, phần chi và người đồng ý; không random làm người chơi trả khoản vượt khả năng mà không có đường thay thế. Kết quả lưu vào ledger/promise.
- Hội thoại có tính cách và cách nói: một lời từ chối đúng lúc có thể tăng tôn trọng; hứa rồi thất hứa khiến `trust` thay đổi và ảnh hưởng cơ hội giúp đỡ. Có `repairAction` để hẹn xin lỗi, bù đắp hoặc thỏa thuận mới.
- Romance (nếu có) là tuyến tùy chọn sau beta, không áp đặt; nội dung tình cảm phù hợp độ tuổi định hướng sản phẩm, tôn trọng đồng thuận.

## 7. Đường phố, người lạ, xe và luật tình huống

Nhóm encounter: người nhờ đường, shipper cần giúp, người bán rong, người quen gặp ở bến xe, rơi đồ, lỡ chuyến, mưa bất chợt, xe tắc đường, chó mèo qua đường, bạn đang đợi, chợ hết hàng, biểu diễn ở quảng trường. Mỗi encounter cần vị trí hợp lệ, AI/nav schedule, animation, lựa chọn, cooldown, outcome và alt path.

- **Không sinh NPC/xe** ngay trên người chơi, trong collider, cửa hẹp hoặc đường đang bị camera che cần giữ tương tác; density phụ thuộc khu/giờ/chất lượng.
- Sự kiện nguy hiểm cần mô hình vật lý đáng tin, giới hạn mức độ; không phạt tự động cho va chạm do lỗi AI traffic.
- Nếu event từ content pack không phù hợp vì khu chưa tải, chọn phương án địa điểm khác hoặc hoãn ngày, không bịa người/địa điểm.
- Camera theo dõi không xuyên tường; cây, tường, nhà, xe có collision/nav và hệ thống occlusion phù hợp; môi trường đẹp không được là ảnh nền xuyên qua.

## 8. Định nghĩa nghiệm thu riêng từng hệ (sau M1–M10)

- Clock: seed replay đúng, pause/hidden không nhảy giờ, chuyển ngày không áp giao dịch hai lần.
- Needs: thử bỏ bữa, nghỉ, đau nhẹ, reload; luôn có đường hồi phục và UI rõ.
- Market/cooking: kho, thời gian và ví conservation, không nấu món thiếu nguyên liệu, có lựa chọn mua ăn sẵn.
- Relationships: bạn hẹn ăn và thay số người tới, chia tiền và hẹn trả sau có trạng thái rõ, không ghost NPC đang ở hai vị trí.
- Bills: đến hạn đúng ngày, nhắc trước, có gia hạn, xử lý mất mạng/reload/rollback.
- City: collision ở cây/tường/xe/nhà; pathfinding ở các ngõ; NPC không khóa cửa tiệm.
- Accessibility: không có hệ nào buộc dùng hai ngón đúng lúc, luôn có đường thao tác thay thế.
