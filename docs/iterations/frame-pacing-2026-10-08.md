# Vòng phát triển 2026-10-08 — frame pacing 30 FPS

## Phạm vi và trạng thái đầu vào

- Base `main`: `ca3ecd794c1d4edf6d6882c10afa0dfe76de036e` — [CI success](https://github.com/phung086/ban-tra-sua/actions/runs/37733063919).
- PR #15 đã merge; không có PR mở lúc bắt đầu vòng này.
- Nhánh công việc đang dở: `codex/frame-pacing-30fps-20261008`, commit đầu `7e6b29a605efc334f5b12fe57baa0d1edcd3edae`.
- Không sửa `codex/mobile-beta-foundation` hoặc `codex/m1-benchmark-gate-isolated`.
- `docs/production-roadmap.md` không có trên main (GitHub API 404); áp dụng cổng M1 từ `docs/development-cycle-hourly.md`.

## Nguyên nhân và thay đổi

Vòng lặp `StreetRuntime.tick` trước đây dùng `now - lastDraw < 1000 / 30`. Khi 60 Hz và thời điểm callback xấp xỉ 33.333 ms, sai số có thể làm mất cơ hội vẽ tại callback đủ điều kiện, khiến lịch vẽ chỉ khoảng 20 FPS trong mô phỏng lý tưởng. Việc bỏ qua callback này cũng làm bước chuyển động/camera thiếu đều đặn.

- Dùng `FramePacer(30)` trong `src/scene/runtime.ts`, thay thế so sánh `lastDraw` trực tiếp.
- Reset bộ lập lịch cùng `previous` khi resume/visibility thay đổi, tránh burst sau khi quay lại tab.
- Thêm `src/scene/framePacing.test.ts` kiểm tra 30/60/75/90/120/144 Hz trong 10 giây, pause/stall, reset và timestamp không hợp lệ.
- Không thay đổi state save, collider, NPC, scene geometry, shader, quality preset hoặc UI.

## Cổng kiểm chứng

- Mô phỏng lịch callback 10 giây: kỳ vọng **300 cơ hội render** ở mỗi tần số đã nêu; kiểm bằng Vitest.
- CI nhánh và PR phải chạy `npm ci`, `npm test`, `npm run build` đúng SHA.
- Browser production preview + smoke 360×800, 390×844, 844×390 và desktop: **chưa có bằng chứng chạy browser** trong vòng này, cần thực hiện trước khi khẳng định cải thiện cảm nhận.
- Baseline/after GPU, CPU, P50/P95 frame time, Android 3–4 GB và iPhone: **chưa đo**; mô phỏng callback không tương đương FPS thực tế. Không đưa tuyên bố bảo đảm 30 FPS trên máy yếu.
- M1 trên `edd0085d6d52235263bd86728eef16620111caf0`: [CI build success](https://github.com/phung086/ban-tra-sua/actions/runs/37731794586) nhưng [benchmark failure](https://github.com/phung086/ban-tra-sua/actions/runs/37731794614). Giữ riêng M1, không merge M1 và không mở M2.

## Quyết định và bước kế

Mở PR độc lập cho frame pacing, kiểm CI đúng SHA. Chỉ merge nếu kiểm thử và cổng nghiệm thu của thay đổi này được chấp nhận; nếu không, giữ PR để đo thêm và không đẩy thay đổi vào main. Sau khi CI/preview đủ, tiếp tục giải quyết lỗi smoke pha trà và benchmark M1 theo nhánh độc lập.
