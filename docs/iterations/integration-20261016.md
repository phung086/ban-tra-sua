# Tích hợp Git và chạy thử — 16/10/2026

## Phạm vi

Nguồn: `origin/main` tại `36153f6` và toàn bộ đầu nhánh `origin` đã fetch ngày
16/10/2026. Nhánh thực hiện: `codex/integrate-game-20261016`.
Hợp nhất bằng merge commit, giữ lịch sử và không force push các nhánh AI.
486 commit được đưa vào lịch sử kể từ main khởi đầu, gồm các merge commit.
Các bản cũ của cùng một tính năng được đối chiếu với bản mới, không cộng dồn UI.

## Những phần đang chạy trong app

- Buổi sáng: thức dậy, nấu ăn có hai bước, bánh mì hoặc bỏ bữa; giữ khóa mở tiệm
  đến khi lựa chọn bữa sáng hoàn tất.
- Gia đình, bạn bè, cô Thu, chăm cây, cơm hộp; các lựa chọn tồn tại đồng thời
  trong save v3. Cốt truyện các chương có nội dung đến ngày 51.
- Chợ hoa quả và chợ rau/nấu cơm dùng chung giới hạn một lượt chợ trong ngày.
  Nấu cơm cần đã mua rau; không thể lấy thưởng hoặc trả tiền lặp sau reload.
- Pha nhanh có đánh đổi điểm, rót thủ công, xử lý thiếu nguyên liệu, phản hồi
  khách quen, hệ quả pha lại, kế hoạch ca đông và dọn quầy cuối ngày.
- Animation giữ blend bước đi/ngồi, chớp mắt, ánh nhìn, tay bê ly và thêm chào
  hàng xóm. Sửa transform instancing để cập nhật cả cây cha trước khi batch.
- Chỉ một nút mở tiệm và một `RushShiftPanel` trong màn chuẩn bị.

## Giải quyết khác biệt giữa nhánh

Hợp nhất constructor/hydration và reducer riêng, bảo toàn tiền và bữa sáng đã trả.
Giữ triển khai hội thoại/ghi nhớ mới hơn khi nhánh cũ mang cùng chức năng.
Lan đi dạo thực tế là 15 phút; cập nhật chú thích UI cho khớp reducer.
Test cũ dùng ly mặc định đầy, bỏ qua bữa sáng hoặc yêu cầu đầu nhân vật đứng
yên tuyệt đối được sửa fixture theo luật hiện tại. Kiểm tra chào so với cùng
nhân vật ở idle, đảm bảo vẫn có chào một lần và không chào khi bê đồ.
Node test runner và Vitest được gọi riêng để tránh nhận nhầm suite.

## Nhánh Gemini cần đọc kỹ

`faca800` chỉ chứa installer đóng gói 42 tệp. Installer có lỗi cú pháp và patch
pose khác chữ ký đang dùng; các engine có state/NPC ID khác app hiện tại.
Đã phục hồi 41 tệp source/style/test vào
[`src/experimental/gemini`](../../src/experimental/gemini/README.md), sửa lỗi
kiểu/import và kiểm tra bằng TypeScript + unit tests. Chúng **chưa nối vào app**.
Không quảng cáo weather/mastery/ledger/animation prototype là gameplay đã hoạt động.
Installer gốc được giữ trong lịch sử; extractor hiện tại chỉ cho xuất vào staging
riêng và không patch animation. Payload workflow chạy AI mỗi giờ được giữ dưới
dạng dữ liệu, không kích hoạt automation ghi Git.

## Kiểm chứng

- `npm test`: 129 file Vitest, 629 test passed, 1 todo; Node acceptance gate 6/6;
  validator world/story dependency DAG passed.
- `npm run build`: TypeScript và Vite production passed. Cảnh báo chunk lớn còn
  tồn tại (Babylon khoảng 1,66 MB trước gzip); chưa đạt production budget mobile.
- `node --check` toàn bộ script `.mjs` và extractor passed; `git diff --check` passed.
- Chạy bản production tại `http://127.0.0.1:5188/`. Kiểm tra trực tiếp mua bánh mì,
  mua trái cây, reload còn 188.000 ₫, mở tiệm, dập nắp, bê ly, đến bàn và giao khách.
- Bằng chứng local và log browser ở `.impeccable/review/integration-20261016/`
  (ignored); kết quả browser/CI cuối cùng cập nhật sau khi hoàn tất.

## Giới hạn đã thấy

Buổi sáng sau khi ghép nhiều tính năng thành một danh sách rất dài. Cần một
luồng ưu tiên rõ ràng cho điện thoại; không nên thêm tiếp các modal prototype.
Nhiều chương có test reducer/UI nhưng chưa đi thủ công trọn 51 ngày.
Đồ họa vẫn là procedural stylized. Chưa có chứng cứ FPS/P95, nhiệt hoặc bộ nhớ
trên Android RAM 3–4 GB và iPhone thật; giả lập Chromium không thay thế việc đó.
