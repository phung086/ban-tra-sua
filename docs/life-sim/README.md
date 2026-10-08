# TIỆM TRÀ PHỐ NHỎ — WORLD BIBLE V1 / ĐIỂM ĐỌC ĐẦU TIÊN

**Trạng thái:** DESIGN APPROVED FOR IMPLEMENTATION PLANNING, **NOT IMPLEMENTED**. Ngày 08/10/2026. Một nguồn sự thật cho tất cả AI và thành viên phát triển. Chủ đích: từ game bán trà trở thành **mô phỏng đời sống và thành phố có cốt truyện dài hạn**; không mất bản save/gameplay hiện có.

## Người chơi sẽ trải nghiệm gì

Mỗi lần ngủ và thức dậy mở ra một **ngày chơi riêng** gồm buổi sáng, công việc tiệm, sự kiện phát sinh và buổi tối. Có ngày thức muộn, có ngày mưa, khách dễ tính hay khó tính, bạn bè rủ đi ăn, gia đình cần giúp, tiền nhà đến hạn, sức khỏe phải chăm sóc. Một lời hứa hôm nay có thể được nhắc lại trong nhiều ngày. Thất bại không kết thúc game vô lý; có đường sửa sai.

**Ngày = Episode có mục tiêu, nhịp cảm xúc, bối cảnh, biến cố, lựa chọn và hệ quả**; không phải reset lại ngày cũ đổi màu trời. Một ngày bình thường cũng có sức hấp dẫn, không ép lúc nào cũng có drama. Hệ thống đi theo calendar liên tục, với các chương viết tay + event theo luật có seed, giữ trí nhớ NPC.

## Thứ tự bắt buộc để agent mới đọc

1. [README này](README.md) → định nghĩa phạm vi, cổng thực hiện.
2. [WORLD & TIME](world-and-time.md) → bản đồ vũ trụ, đồng hồ, hệ thống sống.
3. [SIMULATION CONTRACTS](simulation-contracts.md) → schema, seeded RNG, persistence, atomic transitions.
4. [DAY GENERATOR](day-generator.md) → chọn ngày, tính đa dạng, không re-roll reload.
5. [STORY BIBLE](story-bible.md) → cast, cung phát triển, xung đột, đạo đức viết.
6. [EPISODE CATALOG](episode-catalog.md) → cụ thể từng ngày 01–30.
7. [ECONOMY & NEEDS](economy-needs.md) → quỹ, bữa ăn, sức khỏe, hóa đơn.
8. [CITY & RENDERING](city-rendering.md) → phân khu, xe cộ, collider, animation, hiệu năng.
9. [AGENTS & DELIVERY](agents-and-delivery.md) → chia ownership, vòng lặp, kiểm thử, PR.
10. [QA & ACCEPTANCE](qa-and-content-standards.md) → day playable, save, collider, 3D/mobile gates.
11. [AGENT BACKLOG](agent-backlog.json) → 47 nhiệm vụ có dependency + owner + trạng thái.
12. [DAY 001 EXAMPLE](examples/day-001.design.json) → manifest mẫu để agent thiết kế, **chưa thực thi**.
13. [AGENT START PROMPT](agent-start-prompt.md) → ngữ cảnh chuyển giao nguyên vẹn.

## Mã nguồn thực tế cần hiểu

| Nguồn hiện hữu | Dùng làm gì | Nguyên tắc |
| --- | --- | --- |
| `src/game/types.ts` + `storage.ts` | Save v3, pha/giao, khách, ngày | Không ghi đè save; schema v4 cần migration tường minh |
| `src/game/engine.ts` | Pha trà, đơn hàng, tick logic và chuyển ngày | Bảo toàn hành vi; tích hợp ngày đời sống qua adapter |
| `src/game/city.ts` + `cityLife.ts` | Giờ/energy, việc phố | Không tạo một đồng hồ thứ hai không đồng bộ |
| `src/game/neighborhoodStories.ts` + `cityEpisodes.ts` | NPC, choice/mission hiện có | Migrate ID ổn định; hệ episode mới không phá câu chuyện cũ |
| `src/game/cityMap.ts` + `collision.ts` + `movement.ts` | 12 địa điểm, vật cản, định tuyến | Không biến art mesh thành collider |
| `src/scene/runtime.ts`, `renderQuality.ts`, `threeRenderer.ts` | Three.js/quality/camera/input | Phải benchmark trước/sau trên mobile thực |

Đọc thêm `docs/development-cycle-hourly.md`, `docs/visual-gameplay-direction.md` trên main và **`docs/production-roadmap.md` trên nhánh `codex/m1-benchmark-gate-isolated`** (hiện chưa có trên main).

## Sáu trụ cột và thứ tự

1. **Người thật:** family, bạn bè, khách quen có lịch, tính cách, quan hệ, ưu phiền, kế hoạch và trí nhớ; người khác có đời sống kể cả không có nhân vật chính.
2. **Ngày có ý nghĩa:** calendar/giờ thức/độ mệt, công việc, sự kiện rẽ nhánh, tổng kết tối, ngủ và ngày sau; replay bằng seed chính xác.
3. **Tiền & việc:** bán trà, chợ mua thực phẩm/nguyên liệu, nấu/ăn, trả dịch vụ định kỳ, chia hóa đơn bữa bạn bè, giá tương đối thực tế Việt Nam nhưng được công khai là giá game giả lập.
4. **Thành phố sống:** đường thông nhau, khu dân cư, khu phố cổ, quán ăn, trạm xe, bệnh viện; về sau khu ngoại ô, thành phố lân cận và miền biển bằng cổng chuyển khu.
5. **Cốt truyện:** có tiếng cười, mâu thuẫn, đổ vỡ, chữa lành, ốm đau/khám bệnh/va quệt an toàn; cân bằng để không khai thác đau khổ rẻ tiền.
6. **Mượt & mobile-first:** scene streaming, seeded simulation offscreen, LOD, batching đúng phạm vi; input dọc/ngang, tránh mesh xuyên vật thể.

## Thứ tự phát hành và nguyên tắc không nhảy cổng

- **M1 chưa nghiệm thu**: giảm >=40% draw calls overview light, P95 không tăng >10% trên phép đo chuẩn; không giả định Chromium SwiftShader là Android/iPhone.
- Trong lúc M1 còn mở: **được phép** lập kế hoạch, chuẩn hóa dữ liệu, viết content/story, xây simulation độc lập + unit tests trên nhánh riêng, sửa lỗi P0; **không được** đẩy mở rộng GPU thành phố lên main hoặc gọi là đã đạt M2.
- Sau M1→M2 streaming/culling→M3 art slice→M4 collision/interaction→M5 story/Save v4→M6 ngày mẫu playable→mở rộng day packs/địa danh. Thứ tự gate có thể song song nghiên cứu/viết, nhưng tích hợp theo dependency.
- Mỗi lần chạy automation **nhắm phát triển 1 ngày nội dung / 1 vertical slice**, chỉ merge khi runnable và CI/QA; không tăng bộ đếm “đã hoàn thành” vì mới thêm JSON.
- “Vô hạn” = có thể mở rộng nội dung không trần nhân tạo + procedural tổ hợp có kiểm soát; **không thể bảo đảm mỗi ngày mãi mãi duy nhất** khi nguồn kịch bản hữu hạn.

## Quy ước không thay đổi

- ID ổn định, ngày game != ngày UTC, tất cả giá game VND integer, seed xác định, chơi offline được, các lựa chọn quan trọng apply chính xác một lần.
- Không viết AI text ngẫu nhiên lúc chơi rồi đưa vào save vô điều kiện; nội dung authored, phiên bản hóa, kiểm duyệt, locale vi-VN.
- Không thu dữ liệu sức khỏe cá nhân người chơi; các trạng thái sức khỏe chỉ là fictional gameplay. Không cổ vũ tự điều trị nguy hiểm.
- Không đưa texture/model lấy từ ảnh web nếu thiếu license. Hình tham khảo chỉ là reference.

**Đầu ra vòng đầu tiên:** bộ tài liệu và ví dụ machine-readable, chưa tuyên bố đã có full city/hệ gia đình/30 ngày playable.