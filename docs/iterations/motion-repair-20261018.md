# Sửa chuyển động và camera — 18/10/2026

## Lỗi xác nhận từ code và kiểm tra trình duyệt

- Walk chạy theo thời gian cố định, bỏ qua quãng đường sau va chạm và mức kéo joystick.
- Dừng khi cầm đồ đóng băng Walk_Carry giữa bước; cử chỉ chào cũng bị nhận thành cầm đồ.
- GLTFLoader chuẩn hóa `Fist.R` thành `FistR`; socket cũ rơi về gốc model.
- Camera tự tránh nhà sửa cùng góc dùng cho joystick; mái hiên có thể che kín màn hình hoặc ép camera vào đầu nhân vật.

## Thay đổi

- Pha Walk và Walk_Carry lấy từ quãng đường thật; dùng chung pha khi chuyển trạng thái. Nhịp avatar dùng cùng hệ số 3.6 rad/m với khách.
- Idle_Carry ghép tay cầm đồ với thân/chân Idle, không thêm asset tải xuống. Crossfade 160 ms, bỏ time warping.
- Tách cầm đồ khỏi gesture và sửa tra cứu xương theo tên đã chuẩn hóa. Ly ở camera chỉ hiện khi đứng quầy.
- Khóa hướng tham chiếu trong một lần kéo joystick; camera tránh vật cản có góc riêng, vẫn giữ thao tác xoay bằng tay.
- Năm mặt tiền được batch riêng để cutaway theo đường nhìn. Collision nhà vẫn giữ nguyên. Không tính mái hiên như tường kín ép camera vào avatar.

## Bằng chứng

- `npm test`: 134 file / 654 Vitest tests, 6 acceptance checks và life-design validator qua.
- `npm run build`: qua; còn cảnh báo kích thước chunk của bundle 3D.
- `scripts/motion-browser-check.mjs`: CDP touch trên viewport 390×844; lấy mẫu pha bước, hướng kéo, nhả núm, socket tay; lưu chuỗi khung hình trong `.impeccable/review/motion`.
- `scripts/rebuild-browser-smoke.mjs`: kiểm tra lại joystick, sổ tay, đổi hướng màn hình, trở về quầy và mở ca. Kết quả cụ thể lưu trong thư mục review tương ứng.

Đây là Chromium với WebGL phần mềm và màn hình cảm ứng giả lập, chưa phải số đo Android/iOS thật. Không tuyên bố đã đạt 30/60 FPS trên điện thoại yếu hoặc nghiệm thu toàn bộ thành phố. Tiếp theo cần chơi trên thiết bị thật, kiểm tra bước chân/cầm đồ sát tường và đủ một ca phục vụ.
