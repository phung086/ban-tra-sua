# STORY BIBLE — Con người, quan hệ, ký ức, cung cảm xúc

## Premise

Người chơi là chủ tiệm trà Phố Nhỏ vừa bắt đầu sống tự lập tại An Hòa; thành phố đẹp nhưng không chỉ để chụp ảnh. Người chơi vừa gây dựng kế sinh nhai, vừa chăm mình, giữ lời hứa, gặp bạn và quan tâm người thân. **Chủ đề:** “Đời sống không hoàn hảo vẫn đáng sống; có thể nhờ nhau mà bước tiếp”. Truyện có vui, xúc động, đôi lúc buồn/tổn thương, nhưng tránh trả thù và sốc rẻ tiền.

### Dàn vai hiện có — phải giữ ID

| ID hiện có | Vai trò | Tật xấu / điểm tốt | Arc liên tục |
| --- | --- | --- | --- |
| `hanh` | Cô Hạnh, bán chợ | Nói thẳng, quý chữ tín | Gia đình chợ, nguồn hàng, bài học về tin nhau |
| `thu` | Cô Thu, khu tập thể | Kỹ tính, chăm hàng xóm | Từ “khách khó” thành người góp ý chất lượng |
| `nam` | Anh Nam, hiệu sách | Dịu, đôi khi né tranh luận | Sự kiện đọc sách, hóa giải mâu thuẫn nhóm |
| `minh` | Bác Minh, hồ | Hay quên, tình cảm | Ký ức xóm cũ, ảnh kỷ niệm, người thân |
| `binh` | Bác Bình, công viên | Nghiêm, quan tâm cây | Bảo vệ góc xanh, an toàn đường đi |
| `lan` | Lan, nhóm bạn/hội chợ | Bốc đồng, nhiệt thành | Tình bạn, đi ăn, học cách chia sẻ gánh nặng |

### Nhân vật mới — ID đề xuất, chưa tích hợp

- `family-mother-mai`: mẹ Mai, yêu thương nhưng hay lo và gọi đúng lúc mình bận; không chỉ tồn tại để giao việc.
- `family-father-quang`: bố Quang, thợ điện nghỉ hưu, tự trọng; giúp sửa đồ nhưng cũng cần người lắng nghe.
- `family-sibling-an`: em An, sinh viên, nhiệt huyết; hay mượn đồ/đến chơi bất ngờ; có lịch học riêng.
- `friend-thao`: Thảo, bạn thân làm thiết kế; tinh tế, có lúc ngại mở lòng.
- `friend-duy`: Duy, bạn vui tính nhưng đang quản lý chi tiêu kém; có thể từ chối một buổi ăn tốn tiền.
- `friend-khanh`: Khánh, nhân viên văn phòng, thích lên kế hoạch; hay tranh cãi ai bao tiền.
- `regular-linh`: Linh, khách quen thích ít ngọt, đôi khi tip lớn nhưng không vì vậy được đối xử tốt hơn khách khác.
- `regular-phuc`: Phúc, khách cầu kỳ, dễ thất vọng nhưng có lý do và có thể trở thành bạn tiệm.
- `doctor-vy`: Bác sĩ Vy tại trạm y tế hư cấu (vai trò chuyên môn, thông điệp gameplay an toàn, không cố chẩn đoán thật).
- `neighbor-ha`: Hà, chủ quán cơm nhỏ; mời ăn khi khó khăn nhưng cũng có hóa đơn và cuộc sống của mình.

**Social graph** ví dụ: Lan ↔ Thảo (bạn học cũ), Nam ↔ Khánh (câu lạc bộ sách), Hạnh ↔ Hà (nguồn thực phẩm), Minh ↔ Bình (kỷ niệm sân đình), An ↔ Duy (nhóm chạy bộ). Các liên kết này tạo hội thoại *giữa NPC* chứ không chỉ quanh người chơi.

## Cách thiết kế nhiều cảm xúc

Mỗi chương phải có ít nhất một khoảnh khắc vui, một sự lựa chọn phức tạp và một đường hậu quả kéo dài. “Buồn/khóc/đau” khi phục vụ câu chuyện đã gây dựng, không xuất hiện chỉ vì tung xúc xắc. Điều quan trọng: người chơi có quyền nghỉ, xin lỗi, thương lượng, đi khám hoặc nhờ giúp; bệnh và nghèo không bị viết thành thất bại đạo đức.

Lựa chọn ví dụ: “Đi ăn với Lan tối nay” / “Nhờ đổi ngày vì mẹ đang lo” / “Mời Lan đến ăn cùng mẹ” — hệ quả về lịch, quan hệ, chi phí và câu nói ngày mai khác nhau, không phải cộng/trừ 1 điểm ẩn.

### Tình bạn và ai trả tiền

Biến `Invite`: initiator, inviteeIds, acceptedIds, time, location, budgetBand, payerPolicy, uncertainty, previousFavors. Policies: `self`, `split`, `host`, `volunteer`, `treat-by-turn`. Random only when hợp ngữ cảnh: quán có thể tặng món, bạn trả hộ khi đã hứa, người chơi có thể đề nghị trả một phần. **Luôn xác nhận trước** khi bắt người chơi chịu hóa đơn lớn; lời mời không được âm thầm trừ tiền.

Mỗi bữa nhóm có thể phát sinh 1 trong các biến thể: gặp người quen, trò chuyện căng, nhà hàng đông, trời mưa, ai đó đến muộn, chia tiền nhầm, tin vui, quên ví rồi chuyển khoản, một thành viên muốn về sớm. Cách giải quyết và hậu quả viết rõ; nhóm vẫn có khả năng gặp lại.

## Arc dài 30 ngày, có hồi đáp

- **Chương I Ngày 01–07 — Sống tự lập:** học việc, thu nhập, đồng hồ, chợ, mối quan hệ, bữa cơm và khách khó.
- **Chương II Ngày 08–14 — Người thân & bạn bè:** bữa nhóm, sinh nhật, trách nhiệm, lời hứa, giờ giấc, bill đầu.
- **Chương III Ngày 15–21 — Va vấp & hồi phục:** mưa lũ nhỏ, mệt, khám bệnh, lỗi đơn, giúp nhau, lựa chọn nghỉ hay mở tiệm.
- **Chương IV Ngày 22–30 — Ngoại ô & chân trời:** quy hoạch mở rộng, tiền điện/nước, buổi trà cộng đồng, chuyến đi thành phố kề bên; biển chỉ unlock sau scene streaming/QA.
- **Sau 30:** 7/14/28-day recurrent arcs có trí nhớ; người thân lớn lên, quan hệ chuyển biến; các city packs và story packs bổ sung liên tục.

Ngày 7, 14, 21, 30 là milestone **không bắt buộc kết quả duy nhất**. Truyện tốt lưu flags `promise-kept`, `trust-hanh`, `family-supported`, `social-repaired`, `shop-reliable`, `health-rested`, `friend-bill-resolved`; gate có fallback kể cả không có tiền/không làm nhiệm vụ trước.

## Dạng beat và hệ quả

Mỗi day pack tối thiểu: `wake`, `life`, `shop`, `social/street`, `evening`, `sleep`. **Hai tuyến:** tuyến lý tưởng và tuyến thất bại mềm. Một choice ảnh hưởng được ít nhất 1 ngày sau, ví dụ:
- Ngày 4 đến muộn → khách Thu nhắc ở ngày 6 và có cơ hội lấy lại uy tín ngày 9.
- Ngày 8 trả hộ Duy → ngày 16 Duy có thể tự đề nghị đãi hoặc trả một phần.
- Ngày 18 khám/nghỉ hợp lý → ngày 20 lời thoại khác, không trừ tài nguyên vô hạn.

Quy tắc thoại: văn phong tự nhiên Hà Nội hiện đại, không nhồi tục ngữ và stereotype, có subtext, không độc thoại dài trên màn hình nhỏ; mỗi node khoảng 1–3 câu + 2–4 lựa chọn. Các nhân vật có consent và quyền từ chối.

## Không đốt hết câu chuyện sau 30 ngày

Mỗi tháng thêm **một arc liên kết đời sống** thay vì 30 việc rời rạc. Kịch bản mới không được đảo ngược trí nhớ của NPC. Mỗi nội dung có QA cho trạng thái xung đột và ngày mở; khi chưa hoàn thiện dùng calm-day có hoạt động ngắn và event đã được kiểm chứng.
