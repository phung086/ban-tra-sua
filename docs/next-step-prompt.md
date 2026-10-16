# Prompt tiếp theo: art pass nhân vật và mặt phố tiệm trà

Đọc README.md, docs/iterations/integration-20261016.md, docs/production-roadmap.md,
src/experimental/gemini/README.md. Fetch main, giữ các thay đổi chưa commit của
người khác. Không merge lại prototype chưa nối runtime.

Ưu tiên mới của người dùng: cảnh liền mạch, nhân vật tự nhiên, chuyển động mượt.
Làm một lát cắt hoàn chỉnh từ quầy ra mặt phố tiệm trà Hà Nội: thay nhân vật ghép
hình học bằng một asset rigged có quyền sử dụng rõ ràng, giữ cùng silhouette,
tỷ lệ người/cửa/xe, vật liệu vữa/gạch/gỗ thống nhất. Kiểm tra ở khoảng nhìn thực
khi chơi, không chỉ ảnh quảng cáo hoặc camera fixture. Giữ cổ/vai/tay không hở,
không xuyên áo; cầm ly, ngồi, chào và đi bộ dùng cùng bộ xương. Có fallback nhẹ
khi tải asset lỗi. Không tải đồng thời hai engine, không tăng texture tùy tiện.

Giữ mọi nhiệm vụ, lựa chọn, tiền, thời gian và save hiện tại. Đối chiếu collision
với kích thước asset thật; kiểm tra joystick chéo, sát góc tường, quanh xe và
camera bị công trình che. Không đổi gameplay để che lỗi đồ họa.

Chụp trước/sau cùng góc nhìn ở 360×800, 390×844, 844×390 và desktop. Chạy npm test,
npm run build, mobile-layout và remembered-customer browser smoke. Ghi draw
calls, triangles, dung lượng asset, thời gian tải; phân biệt số đo trình giả lập
và máy thật. Chỉ kết luận mobile cấu hình thấp khi đo trên thiết bị thật.
Cập nhật báo cáo, nguồn/license asset trên Git, push nhánh codex/… và kiểm CI.
Đưa đúng một prompt tiếp theo sau khi có kết quả review, không mở rộng cả thành
phố hay thêm nhiệm vụ trước khi lát cắt này đẹp và ổn định.
