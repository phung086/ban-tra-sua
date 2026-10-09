# Kế hoạch 30 ngày chơi đầu — Tiệm Trà Phố Nhỏ

> Backlog kịch bản, **chưa phải các màn đã triển khai**. Quy chuẩn engine và kiến trúc: [life-sim-game-design](life-sim-game-design.md).

## Cấu trúc ngày

Mỗi ngày có: mở mắt/thời tiết/tâm trạng → một lựa chọn buổi sáng → công việc tại tiệm hoặc đi chợ → sự kiện chính có ít nhất hai cách xử lý → buổi tối (ăn, gia đình, bạn bè hoặc nghỉ) → chốt tiền/quan hệ/nhật ký và lưu. Một ngày có 1 sự kiện chính và tối đa 2 sự kiện phụ. Các hệ quả phải tác động đến ngày sau, không chỉ đổi câu thoại.

| Ngày | Chủ đề | Quyết định có hệ quả |
| --- | --- | --- |
| 01 | Ly trà đầu tiên, thiếu nguyên liệu | Mua gấp hoặc giúp cô Hạnh; thay giá và niềm tin |
| 02 | Ngủ quên trước giờ mở cửa | Xin lỗi khách hoặc nhờ người nhà hỗ trợ; đổi lịch và uy tín |
| 03 | Khách khó tính gọi trà ít đường | Pha lại hoặc thương lượng; khách nhớ thái độ |
| 04 | Trời mưa, đơn giao trễ | Đổi tuyến hoặc xin dời giờ; lời hứa được ghi nhớ |
| 05 | Hóa đơn điện nước tới hạn | Trả hoặc xin gia hạn; ledger cập nhật |
| 06 | Bữa cơm gia đình trùng giờ đông khách | Đóng đúng giờ hoặc nhờ nhân viên; năng lượng và quan hệ |
| 07 | Buổi trà chung ở quảng trường | Ưu tiên cộng đồng hoặc hợp đồng; hai kết thúc tuần |
| 08 | Nhóm bạn rủ ăn tối | Chọn quán và chia tiền minh bạch; bạn bè nhớ sự công bằng |
| 09 | Nhặt được đồ bỏ quên ngoài phố | Tìm chủ trực tiếp hoặc nhờ người quen; đổi thời gian/thiện cảm |
| 10 | Khách hào phóng để lại tip | Cảm ơn hoặc kết nối thêm; tần suất ghé sau thay đổi |
| 11 | Sáng đói, quỹ hạn chế | Tự nấu hoặc ăn ngoài; thời gian và chi phí |
| 12 | Hai lời mời cùng giờ | Chọn một nhóm hoặc hẹn lại; thay lịch gặp |
| 13 | Hẹn chụp ảnh ở phố cổ | Phối đồ sẵn hoặc mua đồ hợp ngân sách |
| 14 | Người thân đến chơi bất ngờ | Cùng nấu hoặc gọi món; thay mức thân thiết |
| 15 | Một ngày mệt | Nghỉ nửa buổi hoặc nhờ hỗ trợ; tránh kiệt sức |
| 16 | Va quệt nhẹ trên đường mưa | Nghỉ, sơ cứu và chọn đến phòng khám khi cần; điều chỉnh lịch |
| 17 | Khách quen đang buồn | Lắng nghe hoặc cho không gian riêng; trust khác nhau |
| 18 | Giá nhập trà thay đổi | Đổi menu hoặc thương lượng nguồn hàng |
| 19 | Tiền thuê mặt bằng đến hạn | Trả, thương lượng hoặc nhận việc phụ; không softlock |
| 20 | Bạn giận vì lỡ hẹn | Xin lỗi bằng hành động hoặc giải thích ranh giới |
| 21 | Tối mưa và bữa cơm ấm | Ở nhà hoặc giúp người thân; khép tuần |
| 22 | Đi xe buýt sang khu mới | Tiết kiệm chi phí hoặc nhờ bạn chở nếu thân |
| 23 | Gặp chủ tiệm khác bên sông | Hợp tác hoặc giữ cách làm riêng; mở tuyến nghề |
| 24 | Lên kế hoạch đi biển | Đi khi đủ quỹ hoặc hoãn; giữ quyền quyết định |
| 25 | Giúp một người mới gặp | Tự hỗ trợ hoặc nhờ cộng đồng; có giới hạn trách nhiệm |
| 26 | Ngày nghỉ | Đi dạo, nấu ăn hoặc nghỉ nhà; hồi phục nhu cầu |
| 27 | Mưa lớn làm thay đổi đường | Hoãn đơn hoặc đi tuyến an toàn; khách nhận thông báo |
| 28 | Cùng hàng xóm sửa sang tiệm | Trả công hoặc tổ chức buổi trà cảm ơn |
| 29 | Chuyến đi biển cùng bạn bè | Nhóm đủ/thiếu người tùy lịch; chia chi phí |
| 30 | Bưu thiếp cuối tháng | Giữ tiệm nhỏ hoặc chuẩn bị mở chi nhánh; dẫn mùa sau |

## Công thức mở rộng dài hạn

Chu kỳ nội dung 28 ngày gồm 4 mảng: tiệm & nghề, bạn bè & gia đình, sức khỏe & tài chính, khám phá & lễ hội. Mỗi tháng có tuyến canon viết tay 4–7 ngày, các ngày còn lại chọn episode có điều kiện và seed ổn định. Không lặp y nguyên kịch bản chỉ thay tên. Thành phố mới chỉ mở khi khu cũ có gameplay đủ sâu, collider và sector loading đã kiểm chứng.

**Random có ký ức**: `hash(saveId, day, contentRevision)` quyết định kế hoạch ngày; lưu kết quả ngay khi bắt đầu ngày. Lịch NPC, quan hệ, ngân sách, thời tiết và lời hứa là điều kiện chọn sự kiện. Không thay kết quả khi reload. Có cooldown cho khách khó tính, tình huống mệt và chi phí lớn; không để nhiều sự kiện bất lợi liên tiếp. Ai trả tiền trong nhóm phụ thuộc lời mời, thỏa thuận và khả năng chi trả; luôn có lựa chọn chia hóa đơn/hẹn lại.

## Hợp đồng phát hành một màn

1. ID và revision ổn định, mở/đóng màn hợp lệ; không node không tới được.
2. Ít nhất 2 lựa chọn có hệ quả gameplay sang ngày sau; một tương tác thật tại tiệm/nhà/chợ/phố.
3. Không softlock khi thiếu tiền, đồ hoặc NPC; có cách hoãn, thay thế hoặc sửa sai.
4. Reward/expense áp dụng đúng một lần, save/reload và migration pass.
5. Mobile UI, input, collision, camera, hiệu năng không regression.
6. Có báo cáo test/build/CI đúng SHA, screenshot/benchmark khi thay scene; M1 chưa đạt thì không mở M2.

Mỗi lượt AI **ưu tiên hoàn tất ngày đang dở**. Chỉ khi tất cả điều kiện trên đạt mới đánh dấu ngày `released` và bắt đầu ngày kế. Nếu nền tảng chưa sẵn sàng, triển khai prerequisite nhỏ thay vì tạo thêm nội dung chưa chơi được.
