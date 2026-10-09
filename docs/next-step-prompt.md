# Prompt tiếp theo — M1 sau tích hợp các nhánh

Đọc [báo cáo tích hợp 10/10/2026](iterations/integration-20261010.md), [lộ trình](production-roadmap.md), [quy trình từng vòng](iteration-protocol.md), `docs/iterations/m1-01.md` và `docs/iterations/m1-01z.md`. `main` là nguồn khởi đầu sau lần merge được chủ dự án yêu cầu; tạo nhánh `codex/…` mới từ main mới nhất. Kiểm tra các commit sau snapshot, không tiếp tục từ tip thử nghiệm cũ.

> Thực hiện một vòng M1: đo và giảm workload cảnh sau merge, giữ gameplay và save. So sánh cùng source/máy/viewport/camera/quality; warm-up 10 giây, sample 30 giây cho light/balanced ở follow/overview. Ghi CPU simulation/submission, frame interval P50/P95, draw call/triangles, memory/cold-load; GPU không đo được phải ghi rõ.

> Ưu tiên bottleneck batching/culling/LOD đã đo; không giảm assert hoặc đổi baseline để tạo kết quả đẹp. Kiểm ảnh gần/xa, camera chuyển động, va chạm, NPC, joystick, về tiệm và pha/giao đơn. Kiểm 360×800, 390×844, 844×390, desktop; giữ hai renderer hoạt động và một canvas mỗi trang. Mục tiêu M1: giảm ≥40% draw call overview light, P95 tăng ≤10% và tiến tới ngân sách tuyệt đối trong roadmap. Workflow sector hiện tại không tự chứng minh hiệu quả toàn bộ thay đổi shadow. Ghi rõ phương pháp và giới hạn các phép A/B trước khi dùng kết quả cũ.

> Chạy test/build, push và kiểm CI đúng SHA; lưu báo cáo trước/sau rồi cập nhật prompt kế tiếp. Cổng Android 3–4GB/iPhone 15 phút, nhiệt/bộ nhớ/đa chạm cần bằng chứng thiết bị thật trước nghiệm thu M1/beta. Chưa mở scene/chương mới trong vòng này. Lỗi elapsed time reset khi reload đã ghi trong báo cáo tích hợp, xử lý ở vòng save riêng.
