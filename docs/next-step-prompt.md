# Prompt tiếp theo: nghiệm thu lát cắt An Hòa trên điện thoại thật

Đọc docs/iterations/rebuild-hanoi-20261018.md, docs/production-roadmap.md,
docs/iteration-protocol.md và public/models/people/sources.json. Nền mới nằm trên
codex/rebuild-hanoi-experience-20261018 (hoặc main khi đã tích hợp). Giữ save và
thay đổi của người khác, không đưa lại nhân vật capsule làm mặc định.

Một vòng chơi: thức dậy → ăn sáng → ghé phố bằng joystick → nhận một nhiệm vụ
và lựa chọn hội thoại → trở về quầy → phục vụ đủ ca → lưu/tải lại. Xem trên
360×800, 390×844 và 844×390; chụp lỗi camera/va chạm/cầm ly/ngồi nếu gặp.
Kiểm tra đặc biệt mái hiên, ban công, góc tường, xe và việc dừng chính xác khi
thả joystick. Không dùng camera fixture làm bằng chứng đã chơi trọn nhiệm vụ.

Nếu có máy Android/iOS thật: ghi model máy, trình duyệt, thời gian tải lần đầu
và cache, thời gian khung hình, nhiệt/giật sau 10 phút. Nếu không có, ghi rõ
chưa đo và không tuyên bố đạt cấu hình thấp. Đối chiếu hình ảnh với ảnh người
dùng yêu cầu trước khi thêm asset hoặc mở rộng bản đồ. Chỉ sửa các lỗi ghi nhận
trong lượt chơi này; không thêm cơ chế mới. Chạy test/build và browser smoke
liên quan; cập nhật báo cáo, nguồn asset, commit/push nhánh codex và kiểm CI.
