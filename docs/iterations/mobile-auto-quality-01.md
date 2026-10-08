# Vòng dev mobile-auto-quality-01 — trình khởi tạo đồ họa thích ứng

Ngày: 08/10/2026. Source đầu: main merge `a0863d5998b7db88dc8dc1b77df9d4419e961005`. Nhánh độc lập: `codex/mobile-auto-quality-cycle-01`. Không sửa nhánh của AI khác.

## Lỗi và mục tiêu

Viewport CSS width <=700 trước đây được dùng để phân biệt mobile. Điện thoại xoay ngang 844×390 bị coi như desktop, khiến auto mặc định chọn high thay vì balanced. Trên phần cứng <=4 GB RAM (nếu browser cung cấp hint) hoặc <=4 logical CPUs, tự động bắt đầu light sẽ giảm tải trước khi cần nhiều frame chậm để hạ mức. Mức chất lượng do người chơi chọn thủ công vẫn giữ nguyên.

## Thay đổi

- `src/scene/renderQuality.ts`: hàm thuần `mobileViewport(width,height,coarsePointer)`, `constrainedHardware(memoryGB,cpuCores)`; `AdaptiveQuality` nhận tùy chọn constrained, bắt đầu light và giữ trần light ở chế độ auto cho phần cứng yếu.
- `src/scene/runtime.ts`: truy cập `deviceMemory` có điều kiện và `hardwareConcurrency`; nhận diện thiết bị di động dựa vào kích thước và pointer coarse; resize/rotation dùng cùng logic.
- `src/scene/renderQuality.test.ts`: regression tests cho portrait/landscape, máy không có hardware hints, nâng quality chậm và manual high override.
- `docs/development-cycle-hourly.md`: quy trình kiểm thử, nhánh độc lập, PR và merge gate cho vòng tự động mỗi giờ.
- `docs/visual-gameplay-direction.md`: art direction Hà Nội/hồng phấn và lộ trình nội dung game; tham chiếu tài liệu chính thức Three.js và ảnh tham khảo Hà Nội (không sao chép asset).

## Bằng chứng và nghiệm thu

- CI nguồn `main`: https://github.com/phung086/ban-tra-sua/actions/runs/37732246133 — success trên `a0863d5998b7db88dc8dc1b77df9d4419e961005`.
- CI nhánh mới: **chờ kiểm tra GitHub Actions trên SHA cuối**. `npm ci`, `npm test`, `npm run build` do CI chạy.
- Phạm vi thay đổi là lựa chọn preset ban đầu, không chỉnh mesh/collider/renderer chất lượng ở chế độ thủ công. **Chưa có benchmark mới trên Android/iPhone thật**; không được dùng CI để khẳng định bảo đảm 30 FPS.
- Chỉ merge branch mới nếu CI success trên SHA cuối và PR CI success. Nếu test/build fail, sửa tiếp trên nhánh riêng.

## Bước kế

Tiếp tục M1 benchmark và giảm draw calls độc lập trên `codex/m1-benchmark-gate-isolated`, xác minh hardware/performance và đồ họa trước khi nâng chất lượng asset. Hoàn thiện art slice mẫu rồi mới mở rộng gameplay; bảo toàn save và collision.
