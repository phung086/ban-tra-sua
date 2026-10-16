# Prompt tiếp theo: gọn luồng buổi sáng trên mobile

Đọc README.md, docs/iterations/integration-20261016.md,
src/experimental/gemini/README.md, docs/production-roadmap.md và
docs/iteration-protocol.md. Fetch main mới nhất; kiểm tra thay đổi chưa commit,
không ghi đè nhánh AI khác. Lấy main làm nguồn chuẩn sau đợt tích hợp 16/10.

Làm đúng một việc: cải thiện UI/UX buổi sáng để người chơi trên 360×800 và
390×844 không phải cuộn qua hàng chục nút trước khi mở tiệm. Giữ bước thức dậy
→ chọn bữa sáng rõ ràng. Sau đó hiển thị một hành động chính “Mở tiệm” dễ thấy;
gọi gia đình, gặp bạn, chợ, chăm cây, nấu cơm và chuyện trong ngày nằm trong
các nhóm tùy chọn gọn, mở khi người chơi muốn. Giữ đầy đủ mọi nhánh lựa chọn,
giá, thời gian, hệ quả, lời thoại đã chọn và trạng thái save/reload hiện tại.
Tránh hai trải nghiệm chợ trông như hai chuyến độc lập: một lần ghé chợ mỗi ngày.

Sửa code chạy thật trong PrepWorld/MorningRoutine và CSS liên quan;
không mở thêm hệ thống kinh tế/save hoặc nối toàn bộ prototype Gemini.
Không tăng scene/texture/draw call cho thay đổi DOM này. Giữ joystick, xoay màn,
các trạm pha và đường đi giao ly hoạt động. Kiểm tra không trừ tiền/thưởng lặp.

Chạy npm test, npm run build, mobile-layout và market-cooking browser smoke.
Chụp trước/sau ở 360×800, 390×844, 844×390 và desktop; đo số lần cuộn đến hành
động chính, không tràn ngang, mục tiêu chạm tối thiểu 44px. Thử bằng chạm qua
bữa sáng → tùy chọn chợ → reload → mở tiệm → pha → giao khách. Ghi rõ test nào
dùng fixture và test nào đi từ save mới. Cập nhật báo cáo trong docs, commit,
push nhánh codex/…, kiểm tra CI đúng SHA rồi đưa đúng một prompt tiếp theo.
Không tuyên bố đạt hiệu năng điện thoại cấu hình thấp khi chưa đo máy thật.
