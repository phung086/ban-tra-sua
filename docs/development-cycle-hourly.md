# Chu kỳ phát triển game liên tục — 60 phút/lần

Ngày thiết lập: 08/10/2026. Tần suất tự động hỗ trợ: **mỗi giờ** (không có lịch tự động 30 phút). Đây là quy trình thực thi khi công cụ/runner sẵn sàng, không phải cam kết mỗi giờ có một bản phát hành.

## Mỗi vòng phát triển

1. Kiểm tra `main`, các PR, SHA, CI và nhánh đang hoạt động. Không sửa nhánh do AI khác đang sử dụng. Nếu đang có thao tác dang dở, tiếp tục từ báo cáo bằng chứng thay vì bắt đầu lại.
2. Chọn **một mục tiêu nhỏ, kiểm chứng được**: P0/P1, hiệu năng mobile, joystick/camera/va chạm, đồ họa chất lượng, rồi mới mở rộng nội dung NPC/giao trà. Đảm bảo không làm mất save và playable path.
3. Tạo nhánh `codex/<chủ-đề>-<vòng>` **từ SHA main vừa kiểm chứng** hoặc tiếp tục nhánh riêng của vòng chưa xong. Không sửa trực tiếp `main`, `codex/mobile-beta-foundation` và `codex/m1-benchmark-gate-isolated` để làm việc khác.
4. Với thay đổi hiệu năng, đo baseline trước/sau **cùng browser/thiết bị, save, DPR, camera, góc nhìn, chất lượng**; warm-up 10 giây, sample 30 giây. Ghi calls/triangles, frame P50/P95, CPU simulation/submission và memory. Rõ GPU time không đo được. Không tuyên bố chạy mượt trên thiết bị yếu khi chỉ có Chromium SwiftShader.
5. Chạy `npm ci`, `npm test`, `npm run build`, production preview. Smoke mobile 360×800, 390×844, 844×390 và desktop; joystick/camera/modal/collision/NPC/tiệm/pha/giao trà. Kiểm screenshot và console.
6. Ghi báo cáo `docs/iterations/<vòng>.md`, lưu ảnh/trace/artifact ở CI, commit/push, mở PR. Merge vào `main` **chỉ khi** CI đúng SHA xanh, regression không xảy ra và mọi cổng của phần thay đổi đạt. Thay đổi chưa đủ bằng chứng để ở nhánh riêng; không đưa vào main bằng suy đoán.
7. Kiểm chứng CI của SHA merge trên `main`, cập nhật báo cáo/trạng thái và tiếp tục vòng kế tiếp. Chỉ yêu cầu chủ dự án khi cần quyền, thông tin/thiết bị thật, hoặc có quyết định sản phẩm không thể tự lựa chọn.

## Chính sách ưu tiên và dừng

- P0/P1, dữ liệu save, lỗi collision/input và regression FPS: chặn merge.
- M1 scene benchmark: yêu cầu tổng thể chế độ light giảm draw calls **≥40%**, P95 không tăng quá **10%**; thêm kiểm nghiệm thiết bị thật theo `docs/production-roadmap.md`. Không mở M2 trước khi đạt.
- UI/đồ họa phải đẹp hơn ở camera gần **và** xa, không hy sinh khung hình. Asset có manifest giấy phép, ngân sách và trạng thái lazy loading.
- Vòng tự động có thể kết thúc ở trạng thái *pending runner*, *blocked by rights/device*, hoặc *failed gate*; không ghi sai là đã nghiệm thu. Lượt kế tiếp tiếp tục cùng mục tiêu, không tích thêm thay đổi chưa đo.

## Bảng theo dõi nhanh

Mỗi vòng ghi: bắt đầu SHA/nhánh, thay đổi, CI link đúng SHA, build/test counts, viewport và thiết bị thật, screen before/after, benchmark light/balanced, blocker, PR, SHA merge, vòng tiếp theo.

Thông tin bổ sung: `docs/production-roadmap.md`, `docs/iteration-protocol.md`, `docs/visual-gameplay-direction.md`.
