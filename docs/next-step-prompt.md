# Prompt tiếp theo — M1.1: đo và giảm tải cảnh mobile

Trạng thái: chờ phản hồi chủ dự án. Source baseline: `c18c87e` trên `codex/mobile-beta-foundation`. Thực hiện theo [quy trình từng vòng](iteration-protocol.md).

> Tiếp tục từ Git mới nhất trên nhánh `codex/mobile-beta-foundation`. Thực hiện M1.1: làm bộ đo hiệu năng có thể tái lập và tối ưu cảnh phố cho mobile yếu, giữ nguyên luồng tiệm/nhiệm vụ hiện có. Đọc `docs/production-roadmap.md` và `docs/beta-baseline.md`; xác nhận source SHA trước khi sửa.
>
> 1. Đo Three.js ở chế độ nhẹ và balanced, góc theo chân và tổng thể, cùng vị trí/route/camera. Warm-up 10 giây rồi lấy mẫu 30 giây cho mỗi cấu hình; ghi frame interval P50/P95, simulation/render CPU, draw call, triangle, geometry/texture/skeleton, dữ liệu tải ban đầu. Phân biệt main/shadow nếu đo được; nêu rõ khi không đo được GPU. Tránh ghi state React mỗi frame, chỉ bật đo chi tiết khi cần.
> 2. Sửa bottleneck có số liệu: ưu tiên instancing/batching vật thể tĩnh lặp, culling theo khu và LOD tổng thể. Giữ bounds, collider, điểm tương tác, animation và texture đúng; không làm phố biến mất hay nhân vật vỡ hình. Chỉ một renderer chạy, Babylon vẫn tải theo lựa chọn và dispose đúng.
> 3. Trước/sau phải cùng máy, viewport, camera, quality và phương pháp. Mục tiêu vòng này: giảm ít nhất 40% draw call tổng thể ở chế độ nhẹ so với baseline đo đầu vòng; không tăng P95 frame time quá 10% hoặc làm hỏng gameplay. Nếu chưa đạt, tiếp tục xử lý bottleneck trong phạm vi rồi ghi kết quả thực tế.
> 4. Kiểm production build ở 360×800, 390×844, 844×390 và desktop; đi bằng núm, xoay camera, mở/đóng sổ, va chạm xe/tường, vào lại tiệm và pha/giao một đơn. Lưu ảnh cùng góc và báo cáo `docs/iterations/m1-01.md`. Máy thật/đa chạm chưa có thì đánh dấu chưa kiểm chứng, không khẳng định đã tối ưu xong điện thoại yếu.
> 5. Chạy test/build, push và xác nhận CI đúng SHA. Cập nhật tracker và prompt kế tiếp; trả lời ngắn với commit, số đo trước/sau, giới hạn và đúng một prompt. Không thêm chương truyện, NPC hay tính năng ngoài M1.1 trong vòng này.
