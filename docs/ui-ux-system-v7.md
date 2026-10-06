# UI/UX hệ thống v7

Ngày thực hiện: 07/10/2026 (Asia/Saigon).

## Tích hợp

Ba PR #8, #9 và #10 đã được merge vào main tại `f4401dd`.
PR #8 được đổi base từ nhánh layout thử nghiệm sang main trước khi tích hợp.
Các merge commit giữ lịch sử của cả ba nhánh. Checkout chính `D:/ban-tra-sua` đã được kéo fast-forward.

World rooms sở hữu điều hướng và các màn quản lý. Tea Counter Theater sở hữu sân khấu khách và quầy pha.
Xung đột import CSS và App được hòa để giữ cả hai; CustomerQueueStatus được nối vào luồng đã tích hợp.

## Những thay đổi đã triển khai

- HUD không còn kế thừa chiều rộng/padding của topbar thử nghiệm gây tràn ngang.
- Điều hướng có tên tiếng Việt, trạng thái hiện tại, nhãn tiền/uy tín và badge có thể đọc bằng screen reader.
- Kho, xưởng, điện thoại và bảng tin dùng layout theo nội dung thay vì cắt nội dung vào khung tọa độ cố định.
- Chữ chính 13–16px; nút thao tác chính tối thiểu 44–52px. Giữ phong cách hồng, giấy, gỗ và cảnh chibi hiện có.
- Quầy được tách thành `CraftWorkbench`: Lắp ly → Đường & đá → Rót & lắc → Giao khách.
- Có thể quay lại sửa hoặc chuyển trạm trực tiếp. Không áp đặt thứ tự lên engine và không tự pha hộ.
- Trạm đang chọn được giữ khi ghé kho/xưởng rồi quay về. Đơn mới bắt đầu lại ở trạm lắp ly.
- Rời trạm sẽ tháo gauge/dispenser để dừng timer; ly và thông số đã chốt vẫn nằm trong GameState.
- Có liên kết xem lại đơn và trở về trạm, giữ nguyên chế độ nhớ order.
- Thông tin kiên nhẫn và hàng chờ có progressbar rõ ràng. Chi tiết đối chiếu chỉ mở khi bật Coach nhẹ.
- Phong độ được thu gọn trong disclosure. Luồng review, trả lời, mục tiêu, nhân sự, decor và nghiên cứu vẫn được giữ.
- Nút cài đặt, reset đường/đá có tên truy cập; phím tắt không chiếm Ctrl/Meta/Alt của trình duyệt.
- Service worker chỉ đăng ký ở production và cache được tăng lên v7.

## Save và kiểm thử

Giữ saveVersion 3. UI không thêm field gameplay hay thay đổi scoring/economy.
Trạm pha chỉ là state của giao diện; reload trở về trạm đầu nhưng ly đang pha được giữ.

Vitest được nâng lên 5.0.3, thêm package-lock và CI dùng npm ci. Audit dependency không còn cảnh báo.

Sáu test bao phủ:

1. Kiên nhẫn và mood theo thời gian chờ.
2. Bond/research tăng tolerance.
3. Khởi tạo và chuyển hàng chờ.
4. Phục vụ đủ ca, tổng kết và chuyển sang ngày kế tiếp.
5. Nạp save v3 chưa có field customer AI.
6. Reload giữ ly đang pha và không tính thời gian offline vào kiên nhẫn.

Đã kiểm tra trình duyệt tại 1440×900 và 390×844: đổi món/trạm, giữ trạm khi ghé kho,
giao khách, review, các phòng quản lý và chuyển ngày. Ảnh kiểm thử lưu tại `docs/screenshots/`.
Kiểm tra detector một lần phát hiện transition width của patience bar; đã đổi sang scaleX.

## Giới hạn còn lại

Các lớp CSS v2–v6 vẫn được giữ để không bỏ mất art/interaction của nhánh đã merge.
V7 là lớp ergonomics cuối cùng; có thể gom các token cũ và giảm CSS trong một đợt riêng.
Cloud save và asset raster mới không thuộc phạm vi đợt này.
