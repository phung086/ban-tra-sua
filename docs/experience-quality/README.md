# Experience Quality Initiative — làm trò chơi thực sự đáng chơi

**Nguồn yêu cầu:** phản hồi chủ dự án ngày 10/10/2026: gameplay nhàm chán, nhân vật chưa đẹp, hiệu ứng yếu, thiếu chân thực, đồ họa chưa đạt. Đây là **nhận xét sản phẩm của chủ dự án**, không phải kết quả khảo sát hoặc chứng cứ benchmark. Chuyển nhận xét thành công việc có thể kiểm chứng, không coi là đã sửa.

**Status:** PLAN. **Nhánh phát triển:** codex/mobile-beta-foundation. **Roadmap vẫn có thẩm quyền cao nhất:** [production-roadmap](../production-roadmap.md), [iteration-protocol](../iteration-protocol.md), [active next step](../next-step-prompt.md). **Cập nhật 10/10/2026:** chủ dự án xác nhận nghiệm thu M1, M2 đang hoạt động (xem docs/iterations/m1-owner-signoff-2026-10-10.md). Không triển khai đại trà hạng mục M3/M4/M6/M7 khi M2 chưa qua gate. Có thể làm tài liệu, concept, audit và tooling kiểm thử độc lập, nhưng không lén thay đổi runtime lớn.

## Đọc theo thứ tự

1. [Danh sách công việc có ID, dependency, ưu tiên và acceptance](backlog.md) — danh mục thực thi của mọi AI.
2. [Quality bar và checklist cảm giác/hình ảnh/hiệu năng](quality-gates.md) — điều kiện quyết định giữ/revert.
3. [Quy trình chia nhiệm vụ, ownership, handoff giữa AI](ai-handoff.md) — tránh làm trùng hoặc phá sản phẩm.
4. [Game Design Bible](../game-design/README.md) — nội dung/tính cách/thành phố; [world & performance](../game-design/world-and-performance.md) — budgets; [playbook](../game-design/ai-delivery-playbook.md) — các epic LC tương lai.

## Định nghĩa “ra chất” thay cho cảm giác chung chung

- **Cảm giác thao tác:** trong 30 giây người mới hiểu đi đâu, có gì để chạm; thao tác hai ngón không bị khóa, nhân vật có quán tính đọc được mà không trễ khó chịu; camera không giật/xuyên nhà; hành động có phản hồi ngay.
- **Nhân vật:** dễ nhận diện từ silhouette ở camera chơi, tỷ lệ nhất quán, không xuyên khớp, chuyển từ đứng sang đi, dừng và quay đầu tự nhiên; NPC có hành vi, chứ không chỉ đứng cạnh biển tên.
- **Đồ họa:** bán cách điệu ấm áp, phố Việt Nam hiện đại có tỷ lệ, chất liệu và ánh sáng tin được; gần camera có điểm nhấn và xa camera có thứ bậc chi tiết; không đánh đổi mọi khung hình lấy hiệu ứng bóng bẩy.
- **Hiệu ứng/âm thanh:** rót trà, bỏ topping, đóng nắp, trao ly, tiền/tip và tương tác có tín hiệu có nguyên nhân, thời lượng ngắn, âm lượng hợp lý, bật tắt/reduced-motion được.
- **Nhịp chơi:** vòng pha–giao có quyết định nhẹ (ưu tiên tốc độ/chất lượng/khách đang đợi), biến thể nhiệm vụ và khoảnh khắc tương tác nhân vật; phản hồi/hệ quả thật trong state, không chỉ hạt giấy và điểm số.
- **Tính chân thực có chọn lọc:** collider tương ứng dáng vật thể; có lý do NPC rẽ/dừng/chờ; hoạt ảnh chân tay kết nối với chuyển động, ly bám tay; không bắt người chơi làm các thao tác lao động tẻ nhạt một cách máy móc.
- **Chạy được:** một thay đổi cảm giác đẹp hơn nhưng phá budget, save hoặc thao tác máy yếu sẽ bị giữ ở prototype hoặc rollback, không hợp thức hóa.

## Trải nghiệm mẫu dùng để đo tính “chơi được”

**30 giây đầu:** nhìn rõ tiệm, nhân vật, mục tiêu đầu, điều khiển thử; nhận tín hiệu môi trường dễ hiểu. **3–5 phút:** người chưa biết game đi vào thao tác pha và hoàn thành một đơn; không phải tự mò qua nhiều modal. **10–15 phút:** giao vài đơn khác nhau, gặp ít nhất một cư dân có phản ứng theo lựa chọn, có một hoạt động thư giãn/đi phố, không cùng một thao tác lặp y hệt. **30–45 phút (mục tiêu beta, chưa đạt):** 3 NPC liên hệ chéo, 3 quyết định và hai ending của roadmap; ghi hệ quả trong gameplay. Mọi nội dung chưa có được ghi PLAN; không thêm nhãn IMPLEMENTED vì viết ra ở đây.

## Roadmap dependency: làm chất lượng nhưng không bỏ gate

| Lớp | Giai đoạn | Việc có thể làm | Việc chưa được tuyên bố |
| --- | --- | --- | --- |
| Quality infrastructure | NOW / M1.1 | baseline screenshot, metric instrumentation, audit asset/license, storyboard, playback checklist, thiết kế A/B; tối ưu renderer trong scope M1 | nhân vật đã đẹp, gameplay đã hay, M1 hoàn thành |
| World budgets | M2 | streaming, LOD, instancing được kiểm chứng | asset đẹp nhưng vượt ngân sách vẫn được nhận |
| Character & visual vertical slice | M3 | 1 nhân vật chính + 1 NPC + 1 tiệm/đường, material/rig/light, duyệt near/far | nhân rộng toàn thành phố trước khi mẫu đạt |
| Feel / interaction / collisions | M4 | nhân vật, camera, joystick, NPC interaction, collider, focus, animation state | nghiệm thu cảm giác chỉ từ unit test |
| Meaningful play | M5–M6 | lựa chọn/hệ quả, tiệm, khách, nhiệm vụ, nhịp chuyện | lặp việc cũ với skin khác được gọi nội dung mới |
| Feedback / audio / accessibility | M7 | VFX, âm thanh, HUD, controls help, reduce motion | âm thanh autoplay hoặc mobile yếu bị bỏ rơi |
| Integrity / beta / production | M8–M10 | save, test devices, retention/playtest, shipping gates | “production-ready” từ một ảnh hoặc CI xanh |
| Living city | LC sau gates core | gia đình, chợ, bạn bè, lịch ngày, nghỉ dưỡng, vùng biển | tự chuyển sang LC khi core yếu |

**Các vòng sau khi chủ dự án nghiệm thu M1** vẫn phải tuân [next-step-prompt](../next-step-prompt.md): phát triển M2 với QR-05/QR-10 từng bước có đo hiệu năng, chọn **một** nhiệm vụ có tác động; mọi AI có thể đọc backlog song song để chuẩn bị scope. Tất cả cải tiến phải lưu ảnh/clip trước–sau + thước đo chơi + hiệu năng same-device, tránh vòng chỉ viết báo cáo.

## Chế độ quyết định hàng vòng

Chọn vấn đề theo ưu tiên **P0 blocker > M1 gate > trải nghiệm dễ nhận thấy > mức độ rủi ro > chi phí nội dung**. Mỗi vòng tối đa 1 work-item runtime và hạng mục phụ trực tiếp hỗ trợ test/tài liệu; bản thay đổi phải nhỏ đủ để rollback. Ghi trạng thái riêng: PLAN / PROTOTYPE / IMPLEMENTED_UNVERIFIED / MEASURED / BLOCKED / ACCEPTED. Không có “DONE” nếu thiếu ảnh/UX/CI/thiết bị theo gate.

Nếu còn thiếu Android 3–4 GB và iPhone thật, vẫn tiếp tục hoàn thiện tooling và tài liệu kiểm thử nhưng ghi rõ blocker; không hạ tiêu chí mobile. Không can thiệp main, nhánh AI khác, không tự merge/deploy.
