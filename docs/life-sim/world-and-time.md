# WORLD & TIME — Thiết kế đời sống trong thành phố

## Thế giới, thời gian và bản chất phiên chơi

Vị trí bắt đầu là **phường An Hòa hư cấu, Hà Nội**, giữ toàn bộ 12 điểm `CITY_PLACES`. Nhà trọ/chung cư (HOME) và tiệm (SHOP) là hai không gian nhỏ có nội thất có thể tương tác; ngoài phố là hub. Thêm district IDs `an-hoa`, `pho-lo-gom`, `dong-phong`, `ben-song`, kế tiếp `ngoai-o`, `thanh-pho-ben-canh`, `mien-bien`. Địa danh mới là hư cấu, không giả mạo tọa độ hiện hữu.

**Ngày trong game** thường 20–35 phút chơi (cho phép nhảy giờ không mất event quan trọng); thời gian in-game 06:00–24:00, ngủ mở ngày mới. Ngày đặc biệt có thể dài hơn nhưng người chơi có thể ngừng/resume và save. Có chế độ chơi thư giãn giảm áp lực hạn giờ.

Chu trình trạng thái đề xuất:

`ASLEEP -> WAKE_UP -> MORNING_CHOICE -> CITY/FAMILY/SHOP -> EVENING_RECAP -> SLEEP -> NEXT_DAY`.

Buổi sáng 06–10: thức dậy, tắm/đánh răng (tương tác nhẹ, có thể skip), ăn sáng/mua đồ/chợ, mở tiệm đúng giờ hoặc muộn. Trưa 11–14: khách/đơn + bữa ăn/công việc gia đình. Chiều 14–18: giao hàng, NPC/đi phố, mua sắm, bác sĩ khi cần. Tối 18–24: nấu cơm, ăn cùng bạn, gia đình, thanh toán, nhật ký, nghỉ ngủ.

**Không chuyển ngày khi chỉ reload;** chuyển ngày là một action `sleep`/chọn ngủ đã xác nhận. Trang bị khóa giờ thực: tab nền không đẩy lịch vô hạn. Đồng hồ gameplay dùng tick có giới hạn, interval tích lũy theo mô phỏng, không lấy `Date.now()` làm nguồn thời gian chính. Khoản đến hạn theo calendar game, không tự trừ do đã đóng tab.

## Mỗi người có lịch và trí nhớ

`NPC profile`: id, householdId, relationships, temperament (6 chiều), occupation, favoritePlace, work/school hours, schedule constraints, preferred foods/drinks, health/mood riêng, inventory đơn giản, trust/bonds, promises, social group, memoryLedger, currentIntent. Một NPC có thể đi làm, trễ hẹn, từ chối đi ăn, chủ động nhắn tin; không teleport khi ở trong tầm mắt người chơi. NPC ở zone ngoài camera vẫn được cập nhật **mức logic trừu tượng** chứ không cần chạy animation/physics thật.

Các mức mô phỏng:
- **Near (≤ khoảng hoạt động)**: animation + đơn giản tránh người/xe, có collider.
- **Same district off-screen**: cập nhật waypoint/lịch từng bước thưa, không render.
- **District khác**: event/schedule state, không instantiate 3D, chỉ spawn khi load scene mới.

Mỗi NPC có ít nhất 1 sự kiện cá nhân, 1 quan hệ với NPC khác, 1 mâu thuẫn nhỏ và 1 đường hòa giải qua nhiều ngày. Ví dụ cô Hạnh ở chợ thẳng tính, đôi khi tốt bụng cho mua chịu nhưng sẽ nhắc đúng hẹn.

## Nhu cầu sống và lựa chọn

Needs: hunger (0..100), energy, cleanliness, mood (-100..100), stress, social, health; **không** đếm mỗi 1s cho toàn bộ NPC. `hunger=100` là no hay đói? Quy ước rõ: **0 đói — 100 no**. Nấu ở nhà, mua cơm, nhờ người thân, ăn bữa bạn bè đều thỏa nhu cầu theo cách và chi phí khác nhau. Bữa tối cùng mẹ tiết kiệm nhưng tăng quan hệ; đi ăn nhóm tăng vui nhưng trả tiền có thể bất ngờ.

Thức muộn không auto game over: mất khách giờ sớm, có thể nhờ bạn mở hộ, thuê người, xin lỗi hoặc rút giờ mở cửa. Nghỉ ốm không phạt kép: nghỉ/khám giúp phục hồi và có lựa chọn giảm việc. Va quệt/xây xát chỉ xảy ra khi người chơi chọn hành vi hoặc sự kiện có điều kiện, có trợ giúp an toàn; xe không cố ý tông nhân vật chỉ để tạo drama. Bệnh viện là gameplay trao đổi lịch/chi phí/phục hồi, không cung cấp lời khuyên y khoa thật.

**Lựa chọn xã hội có mức độ**: rủ nhau ăn, có thể cả nhóm 4 đi đủ, 2 người tách bàn, một người hủy phút cuối, tự thanh toán, chia đều, một người đãi, trả hộ và nhận lại hôm sau. Quy tắc random bị ràng buộc bởi tài chính, văn hóa quan hệ và lời hứa; không phạt vô căn cứ. Sau đó ghi memory event để NPC nói lại ở một ngày khác.

## Khoảng cách và di chuyển

Đi bộ chỉ khi route có lối đi hợp lệ. Di chuyển quận xa bằng xe buýt/xe máy qua hub portal với fade/loading và chi phí/giờ; **không** dựng một world mesh khổng lồ duy nhất. Thành phố kề bên và khu biển mở sau nhiều chương; chuyến đi có lịch, vé, lưu trú nếu qua đêm, mang theo một số đồ, NPC có thể đi chung.

Đồ ăn/chợ/nhà/tiệm/bệnh viện/quán là không gian gameplay; khu không tương tác chỉ có cửa khóa/câu thông báo hợp lý, không xuyên tường. Thang máy/cửa/nội thất có collider và interaction proxy; nếu không hỗ trợ vào trong, hiển thị rõ đang đóng.

## Tính chân thật ≠ mô phỏng mọi điều

Thiết kế ưu tiên **quyết định có hệ quả + nhịp sống + hồi phục**, không ép rửa từng cái bát. Cho phép auto-cook, auto-restock, skip commute với chi phí rõ, giảm animation trong chế độ Light và chọn Easy/Relaxed. Tránh bạo lực đồ họa, chi tiết y khoa gây sốc và cơ chế bệnh/khổ nghèo vô lối.

## Hệ thống input/event

Hành động lõi: `wake | eat | cook | buyGroceries | openShop | serve | travel | talk | acceptInvite | shareBill | visitClinic | payBill | sleep`. Action có điều kiện (vị trí, thời gian, tài nguyên, quan hệ), reducer trả `nextState + journalEvents`. Mỗi event có idempotencyKey; cùng một action không phát thưởng hai lần. Scene/UI chỉ trình bày state, không tự tính tiền hoặc quyết định kết quả may rủi.