# Quality gates & evidence — không biến một game xấu thành “đã pass” bằng CI

**Vai trò:** tiêu chí đánh giá người chơi, hình ảnh, chuyển động, độ tin được, cảm giác tương tác và ngân sách kỹ thuật cho các task ở [backlog](backlog.md). Đây là **bộ chỉ số mục tiêu và giao thức kiểm tra**, không phải điểm đã đo. Quyết định nghiệm thu milestone vẫn thuộc [roadmap](../production-roadmap.md). Nhiều tiêu chí nghệ thuật cần người review trực tiếp, không thay bằng pixel diff hoặc bình luận tự động.

## 1. Phiếu trước/sau bắt buộc cho mỗi task runtime

Trước sửa ghi: SHA baseline, bản đồ/seed/save fixture, build Vite production, renderer (Three/Babylon), quality, viewport/DPR, cách di chuyển, thời gian warm-up/sampling, input route, độ dài clip, ảnh mặt/gần/xa, người review và quan sát lỗi. Sau sửa lặp lại cùng fixture; nếu có variation NPC/giờ/ngẫu nhiên, cố định seed hoặc giải thích sai biệt. So sánh *same device/browser/viewport/route*. Phải phân tách:
- **Tính đúng:** quest/collision/tiền/tiến trình/save/audio lifecycle.
- **Độ thích thú:** người mới có hiểu mục tiêu không; 3 hành động chính có khác cảm giác nhau không; có dừng chờ không rõ lý do không.
- **Thẩm mỹ:** anatomy, rig, frame composition, vật liệu, ánh sáng, animation timing, SFX/VFX.
- **Kỹ thuật:** draw calls main/shadow, triangles, P50/P95 frame intervals, over-100ms frames, JS/render submission vs GPU, memory/asset/network.
- **Thiết bị thật:** Android RAM 3–4GB và iPhone ở phạm vi support; chênh nhiệt/memory/battery nếu đo được, không bịa phần API không cung cấp.

**Evidence bundle:** screenshots trước/sau, video 20–60s nếu liên quan motion, raw JSON/log/trace và command tái hiện, baseline/new SHA + CI. Nếu không có video cho task animation hay camera thì chỉ đạt IMPLEMENTED_UNVERIFIED tối đa.

## 2. Rubric có người chấm (0–4; mốc chưa nghiệm thu)

Review tối thiểu 1 người không phải người chỉnh sửa, tốt hơn 2–3 người; reviewer phải chơi hoặc xem cùng clip trước/sau ẩn nhãn nếu khả thi. Không suy ra số liệu từ dự đoán của AI.

| Điểm | Cảm giác điều khiển | Nhân vật/animation | Cảnh/ánh sáng/đồ họa | Gameplay/pacing | Tính tự nhiên/tương tác |
| --- | --- | --- | --- | --- | --- |
| 0 | lỗi chặn/không điều khiển | mesh lỗi hoặc biến mất | khó nhìn/không tải | không hoàn thành đơn | teleport/xuyên/khóa |
| 1 | giật, kẹt, chậm, khó định hướng | tỷ lệ khó chịu, pose đơ | phố hộp, vật liệu rời rạc | thao tác lặp khô, thiếu phản hồi | động tác/collider thiếu hợp lý |
| 2 | dùng được nhưng máy móc | nhận diện được nhưng thô | đọc được bối cảnh, thiếu điểm nhấn | hoàn thành việc nhưng ít thú vị | lỗi nhỏ thường thấy |
| 3 | rõ phản hồi, mượt hợp máy | silhouette và bước đi thuyết phục | đồng bộ style, near/far tốt | mục tiêu và lựa chọn rõ, có nhịp | đa số tương tác tin được |
| 4 | tự nhiên, ít phải nghĩ về controls | diễn xuất có cá tính và không lỗi rõ | vật liệu/ánh sáng kể chuyện, chất lượng ổn định | muốn tiếp tục chơi, có hệ quả đáng nhớ | vật lý/đạo cụ/NPC nhất quán |

Điểm 3 là **mục tiêu đề xuất cho mẫu vertical slice** mỗi trụ cột; chỉ xem là đủ tốt nếu không có P0/P1, không giảm mạnh bất kỳ trụ cột nào và đạt tất cả gates roadmap. Score 4 không đồng nghĩa photoreal hay phải chạy 60fps. Lưu file note từng reviewer, số người, thiết bị và clip. So sánh delta so với baseline, không báo "trung bình 3.7" nếu chưa có phiếu.

## 3. Kịch bản playtest người mới

| Kịch bản | Quy trình | Quan sát bắt buộc | Ngưỡng mục tiêu có nguồn |
| --- | --- | --- | --- |
| FT-01 30s | mở save mới, không giải thích | thấy shop/người chơi/mục tiêu/joystick, chạm thử | reviewer chỉ đúng việc tiếp theo trong <=10s sau khi mở HUD là mục tiêu giả định cần kiểm |
| FT-02 first order | tự đi đến quầy, chọn base/topping, pha, giao | thời gian, số sai, số modal, tutorial cần đọc | **3–5 phút** từ roadmap beta |
| FT-03 2-finger | một ngón giữ di chuyển, ngón kia xoay camera; đổi hướng, nhả từng ngón | dính input, mất focus, camera xuyên | không kẹt hướng sau release/cancel/blur; xác minh điện thoại |
| FT-04 physical street | đi 10 đoạn sát tường, xe máy, cửa, cây, NPC | kẹt, xuyên, jitter, popping, foot slide | không P0/P1 va chạm theo roadmap |
| FT-05 NPC | tương tác ba cư dân, chọn câu trả lời, rời/đến lại | phản ứng khác nhau, UI có hiểu, state có lưu | ít nhất 1 lựa chọn đổi tình huống gameplay trong vertical slice M5/6 |
| FT-06 15-min loop | hoạt động shop + đi phố + NPC + giao nhiều đơn | thời gian rỗi, thao tác bị lặp, lý do tiếp tục chơi | không dead-end, crash, mất save; 15 phút **trên thiết bị thật** |
| FT-07 resume | đóng/reload sau pha, hội thoại, giao đơn | trùng thưởng, mất cờ, âm chồng | invariant save/ledger nguyên vẹn |
| FT-08 accessibility | rotate dọc/ngang, tăng font, reduce motion, mute | text cắt, chồng nút, mất tín hiệu trạng thái | touch target >=48px; khi tắt âm/hiệu ứng không mất thông tin |

Khi team có playtester, ghi **từng cá nhân** completion/time/confusion/fun-moment và mã phiên. Mẫu nhỏ không là kết luận retention thị trường. Không đặt mục tiêu "100% thấy vui" hoặc tự diễn giải cảm xúc người dùng.

## 4. Kiểm ảnh và chuyển động

Ảnh cố định: character front/3-quarter/profile/back, NPC giao tiếp, storefront, 1 ngõ, lake, overview; cùng thời điểm/ánh sáng và camera; 360×800, 390×844, 844×390, 1280×800; light/balanced (high khi có). Cần **cả camera chơi thật lẫn cận nhân vật** để không che lỗi anatomy. Dùng annotation rõ vấn đề: chân xuyên nền, tóc xuyên mặt, ly lệch tay, gạch lặp, bóng bệt, cửa không đúng tỷ lệ, cây che camera, shader quá bóng.

Chuyển động: 20–60s clip 30°/90°/180° turn; idle 20s; walk/run 15s; 10 chu kỳ cầm/giao ly; NPC quay đầu/né; camera quay liên tục; một tình huống trời/sáng thay đổi. Review frame-by-frame cho pop-in, jitter, foot sliding, mesh clipping. **Ảnh tĩnh chỉ chứng minh khung hình đã chụp**, không phủ định lỗi giữa các khung. Ảnh bị sai góc/khác save phải ghi "không so sánh hợp lệ", không chọn ảnh đẹp nhất sau sửa.

## 5. Cổng performance & integrity

M1.1 hiện hành:
- Same-SHA matched production baseline trước/sau 390×844 DPR1 Chromium, light/balanced, 10s warm-up, 30s sample; **giảm >=40% overview-light draw calls** và P95 frame interval **không tăng >10%**; kiểm ảnh + joystick/camera/NPC/tường/xe/10/10 pha-giao/return. Không được xóa assert để pass.
- **Ngân sách thiết bị yếu từ roadmap:** 30 FPS ổn định 15 phút; P95 frame interval <=40ms; frame >100ms <1% ngoài loading; draw calls <=200 follow, <=300 overview; triangles <=150k follow, <=250k overview; JS gzip <=1.5 MB, initial <=5 MB, interactive <=10s trên mạng thử; memory tăng <10% sau 10 lượt qua khu. Đây là mục tiêu, **không khẳng định đã đo đạt**.
- GPU time chỉ ghi nếu có instrument tương thích; không quy conversion CPU/SwiftShader sang GPU mobile. Tách frame interval và CPU submission.
- Chụp screenshot và đo cùng viewport/quality nhưng so ảnh *không* thay thế test trên GPU yếu. Một thay đổi đẹp mắt mà tăng hơn 10% P95 so baseline khi gate áp dụng phải tối ưu/revert hoặc chỉ hiển thị ở quality cao sau review; không lén thay ngân sách.
- Kịch bản save/ledger: không reset người chơi, không double reward, không bỏ mất tiến trình sau update; phản hồi giao hàng không được báo success trước trạng thái đã commit.
- Nếu test không chạy hoặc CI failure: task BLOCKED/IMPLEMENTED_UNVERIFIED, ghi lỗi cụ thể. Không tự động bật hiệu ứng mới trên mobile low khi thiếu baseline.

## 6. Nguyên tắc lựa chọn phương án cải tiến

So sánh 2–3 lựa chọn cùng chức năng; fix bug và sự rõ ràng trước hạt hiệu ứng. Ví dụ ở một mặt tiền nhà: **A** thêm 10 mesh trang trí, **B** texture atlas và normal, **C** shader/time-of-day; chọn bằng ảnh + FPS + đồng bộ style + asset cost, không theo số polygon lớn nhất. Ở nhân vật: silhouette/rig/stride phải thuyết phục trước facial emotes hoặc outfit pack. Ở gameplay: người chơi hiểu hành động và feedback trước khi thêm 10 minigame.

**Dấu hiệu xấu bắt buộc mở task sửa/revert:** hình xấu đi ở tier low, động tác mới trượt chân, chạm nhầm NPC, mất vật thể do culling, UI bị che khi xoay ngang, build/save/CI hỏng, âm thanh chồng, load tăng không theo budget, model asset license không rõ.

## 7. Record một lần review (copy vào báo cáo iteration)

    Task ID:
    STATUS: PLAN | PROTOTYPE | IMPLEMENTED_UNVERIFIED | MEASURED | BLOCKED | ACCEPTED
    Baseline SHA / branch / CI:
    Candidate SHA / branch / CI:
    Render engine / quality / viewport / DPR / device / OS / browser:
    Fixture (save, spawn, yaw/pitch, clock, customer, NPC seed):
    Before/after screenshot(s) & video(s):
    Reviewer 1 (control/character/world/pacing/realism, 0–4 + reason):
    Reviewer 2 (optional):
    Gameplay exact actions / observed state / save integrity:
    Draw calls / triangles / P50-P95 frame interval / over100 / memory / sample counts:
    Test commands / actual CI links:
    Mobile Android 15m: measured | not available | failed
    iPhone 15m: measured | not available | failed
    License/attribution:
    Regression: none observed | observed | not checked
    Decision: keep candidate | iterate | revert | gated prototype
    Next single task ID and reason:

Báo cáo trống hoặc chỉ ghi "đẹp hơn, mượt hơn" không đủ đóng task.
