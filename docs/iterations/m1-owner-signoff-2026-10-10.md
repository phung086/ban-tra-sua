# M1 — Chủ dự án xác nhận nghiệm thu (10/10/2026)

**Branch:** `codex/mobile-beta-foundation`. **HEAD trước khi ghi nhận:** `6b01c95b5878c27779ab4181ff07d49940b4a389`. Chủ dự án tuyên bố trực tiếp trong cuộc hội thoại ngày **10/10/2026**: “tôi xác nhận đã test toàn bộ và pass m1, sang bước tiếp theo luôn”. Đây là **nghiệm thu của chủ dự án và chỉ định mở M2**. Không phải kết quả đo mới do AI tạo; mọi cổng lịch sử chưa có log thiết bị trong repository không được gán số liệu giả.

## Evidence có trên remote trước xác nhận
- [CI #38016294199](https://github.com/phung086/ban-tra-sua/actions/runs/38016294199): **success** tại đúng SHA `6b01c95b5878c27779ab4181ff07d49940b4a389`.
- [Near-radius A/B #38016294174](https://github.com/phung086/ban-tra-sua/actions/runs/38016294174) và [near-sector A/B #38016294235](https://github.com/phung086/ban-tra-sua/actions/runs/38016294235): **success** tại SHA này. Đây là phép A/B culling, không thay full production gameplay trên SHA này.
- [Full production #37928850991](https://github.com/phung086/ban-tra-sua/actions/runs/37928850991): **success** tại SHA code cũ `1124fa38994c6dab215404b0c7356bce73a1abfe`, overview light calls −51.90%, P95 −54.84%, 10/10 craft/delivery và browser camera/NPC/collision smoke theo báo cáo trước. Những số này **không phải dữ liệu đo trên SHA hiện tại**.
- Chủ dự án tự xác nhận đã kiểm thử toàn bộ M1: **OWNER-ACCEPTED**. Không có trong bản xác nhận cụ thể model Android, iPhone, file frame traces, nhiệt độ, bộ nhớ hoặc raw benchmark của thiết bị; đánh dấu **OWNER-REPORTED / ARTIFACT NOT ATTACHED** thay vì tuyên bố AI đã trực tiếp đo.

## Quyết định và giới hạn
M1 được **đóng theo xác nhận chủ dự án**, bắt đầu M2 từ remote HEAD vừa xác minh. Không diễn giải quyết định này thành việc SwiftShader đạt 30 FPS hoặc tự ghi đạt mobile budgets. M2 vẫn có **cổng độc lập** về ≤200 follow/≤300 overview draw calls, ≤150k/≤250k triangles, ≤40ms P95 máy yếu, không mất NPC/collider khi chuyển vùng, và memory plateau sau 10 lượt qua vùng. Phải đo lại khi triển khai và trước beta/production. Nếu regression P0 được phát hiện ở M2, sửa hoặc revert dù M1 đã được chủ dự án chấp thuận.

**Không thay main, nhánh AI khác, không merge/deploy.** Các tài liệu M1 cũ vẫn là lịch sử của phép đo tại thời điểm viết, không xóa các ghi chú “chưa nghiệm thu” lịch sử.
