# ECONOMY & NEEDS — Giá cả, sinh hoạt, hóa đơn và chăm sóc

## Mục tiêu

Tiền ăn, mua thực phẩm, nguyên liệu, tiền điện/nước/Internet, tiền thuê nhà, xe buýt, viện phí hư cấu **liên kết với nhau**; không phải thuế phạt ẩn. “Tương tự đời thật” là **tỷ lệ và hành vi hợp lý** (bữa ở nhà rẻ hơn ăn nhóm, bill có hạn, giá chợ thay đổi theo mùa); không có dữ liệu giá bán lẻ trực tiếp, không quảng cáo giá trong game là giá thật ngoài đời.

### Giá cấu hình VND, mẫu DESIGN v1 (chưa cân bằng/không phải báo giá thực)

| Item | Khoảng giá game mẫu | Luật |
| --- | ---: | --- |
| Bánh mì / ăn sáng | 18.000–35.000 ₫ | Nhanh, tăng satiety |
| Bữa cơm bình dân | 30.000–55.000 ₫ | Tiện, tốn hơn tự nấu |
| Đi ăn nhóm quán vừa | 60.000–130.000 ₫/người | Nhắc giá dự kiến **trước** khi nhận lời |
| Đi chợ nấu 2 bữa | 45.000–100.000 ₫ | Cần thời gian + bếp |
| Vé xe nội phố | 7.000–15.000 ₫ | Kiểm thử/cập nhật khi có dữ liệu nguồn phù hợp |
| Đồ uống tiệm | Lấy từ `DRINKS` hiện hữu | Không đổi giá bán đang chơi mà không migration |
| Internet / tháng | 150.000–250.000 ₫ | Theo tháng game, kỳ hạn rõ |
| Điện/nước / tháng | Theo mức dùng game, cap và báo trước | Có bảng chi tiết, không gấp bội mù quáng |
| Tiền thuê nhà | 700.000–1.500.000 ₫/tháng game | Đặc cách lần đầu/giãn kỳ để người mới không kẹt |
| Khám ngoại trú hư cấu | 60.000–150.000 ₫ | Có lựa chọn hỗ trợ/trả sau, không cung cấp tư vấn y khoa thật |

Những con số là **đề xuất để test economy**, không phải giá thị trường tháng 10/2026. Data bản production phải gồm `priceBookVersion`, `region`, `effectiveGameDay`, `sourceCheckedAt`, `basis`, `gameAdjustmentReason`. Khi cập nhật theo xu hướng, tham khảo CPI theo nhóm và nguồn công khai tại https://www.nso.gov.vn/tin-tuc-thong-ke/2026/10/thong-cao-bao-chi-ve-tinh-hinh-gia-thang-chin-quy-iii-va-9-thang-nam-2026/ và EVN https://www.evn.com.vn/vi-VN/news-l/Gia-dien-60-28; CPI tổng thể **không phải** giá mỗi món.

## Economy tích hợp

Có 2 nguồn thu: bán trà (dựa engine hiện tại), việc lặt vặt đã chọn. Tài khoản chính `cash` + `transactionLedger`: mỗi giao dịch id duy nhất, loại revenue/cost/refund/gift/debt, nguồn, thời gian. Chi tiêu sống dùng chung tiền nhưng báo rõ đây là chi phí cá nhân, khác chi phí nguyên liệu/cửa hàng. Phân tách P&L tiệm và đời sống.

Recurring billing: đối với ngày game 7 (ví dụ tiền điện đợt đầu nhẹ), 14 Internet, 28–30 tiền thuê nhà/điện; trong bản live mỗi thứ có chu kỳ thật `period=gameMonth`, idempotencyKey `billId:period`, cảnh báo 3 game days và kỳ hạn có grace. Thất bại thanh toán tạo lựa chọn làm thêm/chia kỳ/cầu hỗ trợ, **không** block sleep hoặc xóa save. Game difficulty modes có hệ số 0.7/1/1.2 cho chi phí đời sống nhưng không làm méo VND được hiển thị khi đã ký bill.

### Bữa ăn và bếp

`FoodInventory`: gạo, rau, trứng, thịt, gia vị với `quantity`, `freshness`, `purchasePrice`; có ngày hết hạn và giảm chất lượng theo **ngày game**, không theo đồng hồ máy. Recipes ban đầu: cơm trứng, canh rau, mì trứng, bún ngoài quán. Hành động `cook(recipe)` cần bếp và nguyên liệu, trừ một lần, advance thời gian, hồi satiety, có animation 5–10s có thể skip. Bữa ăn gia đình hoặc nhóm có xác nhận thanh toán và lưu quan hệ.

## Needs và bệnh/va quệt

| Biến | Phạm vi | Tác động khi thấp/cao | Hồi phục và fallback |
| --- | --- | --- | --- |
| satiety | 0–100, 0 = đói | Dưới 25 giảm hiệu suất pha nhẹ nhưng **không mất điều khiển** | Ăn nhẹ/được tặng bữa/trả sau |
| energy | 0–100 | Dưới 20 mở gợi ý ngủ/nhờ nhân viên | Ngủ, nghỉ, uống nước |
| hygiene | 0–100 | Chỉ ảnh hưởng mô tả/giao tiếp nhẹ | Về nhà tắm, thao tác 1 click |
| mood | -100–100 | Thay lời thoại và lựa chọn social, không phạt bệnh | Thăm bạn, nghe nhạc, nghỉ |
| stress | 0–100 | Đánh dấu ngưỡng cao và trợ giúp, không ép drama | Từ chối ca, nghỉ/ngủ |
| social | 0–100 | Có thể vui một mình (không phạt người sống hướng nội) | Gặp bạn/nhắn tin |
| health | 0–100 | Kịch bản ốm, mỏi, xước nhẹ có trạng thái rõ | Nghỉ, hỗ trợ chuyên môn fictional |

Trạng thái `healthIssue` có `severity: minor/needs-visit`, startDay, reviewed, recoveryDays, flags; không gắn nhãn bệnh thực hay đưa chỉ dẫn điều trị. Va quệt phải xuất phát từ event có scene và luật collider, không sinh tai nạn ngẫu nhiên từ camera offscreen. Đến trạm y tế khi cần, lựa chọn nghỉ/đi khám phù hợp; không ép người chơi lao động khi sức khỏe kém để tồn tại. Tránh mô tả máu me và tình huống chết chóc vô lý.

## Bảo vệ khỏi softlock và snowball

- Tất cả khoản quan trọng có nhắc hạn; bất kỳ câu chuyện bắt buộc nào cũng có phương án không tốn tiền hoặc giãn thời gian.
- Cần test `cash=0`, `inventory=empty`, `health=20`, `energy=0`, `bad-relationship`, `shop-closed`.
- Người chơi không thể nhân đôi tiền do reload/double tap; invoice and refunds idempotent.
- Không cho “món ngẫu nhiên cực đắt” bất ngờ do payer RNG. Hạn chế day spend bằng tỷ lệ ngân sách, cho từ chối trước khi xác nhận.
- Có hệ thống giá game tùy chọn “realistic / relaxed” và điều kiện thắng không phụ thuộc grind nhiều giờ.
- Cân bằng thử: median nguồn thu từ bán trà theo 1 ca > tổng nhu cầu thiết yếu ngày điển hình + dự phòng kỳ hạn, để chơi có tiến triển thực sự; ghi mô phỏng Monte Carlo seed 100–1000 ngày có kiểm soát, tỷ lệ phá sản/softlock, không chỉnh theo cảm giác.

## Phân biệt phần cần hoàn thiện

Hiện hữu: cash/inventory/dailyRevenue, shop costs, tips/customer feedback, `city.energy`. Chưa có: `foodInventory`, `bills`, `health`, `household`, shared restaurant bills, ledger tiền đời sống. Triển khai theo adapter có tests, sau đó migrate save; không tự ghi đè key v3 trước cổng M5.
