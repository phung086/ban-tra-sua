# Tiệm 3D hồng pastel

Bản này thay thế thế giới phẳng bằng không gian Three.js chạy trực tiếp trong game. Tone hồng là yêu cầu cố định ở cả nội thất và giao diện. Nhân vật là 16 người hàng xóm có chiều cao, tuổi, màu da, tóc, áo quần và phụ kiện khác nhau. Đây là 3D cách điệu dựng bằng mã, chưa phải chất lượng nhân vật dựng thủ công bằng Blender.

## Chơi

1. Đứng gần quầy để pha qua bốn trạm; giữ nút để định lượng, canh rót/lắc rồi dập nắp.
2. Bê ly. Bảng khách ghi rõ mang đi hay dùng tại bàn 01/02.
3. Di chuyển bằng WASD/mũi tên, nút đi bộ hoặc chọn địa điểm. Kéo khung hình để nhìn. Nút toàn tiệm mở góc nhìn cao, kéo để xoay; chạm sàn để đi.
4. Đến gần đúng vị trí mới giao được. Khách nhận đúng ly vừa pha, đứng dậy và rời tiệm. Kho trừ và phần thưởng cập nhật đúng một lần.

Màn quản lý giữ kho, nâng máy, nhân sự, decor, nghiên cứu, đánh giá, mục tiêu và quan hệ. Save vẫn version 3, khách cũ giữ ID và bond; khách mới được bổ sung khi nạp save. Thiết bị không mở được WebGL vẫn có các nút địa điểm và luồng giao ly.

## Đồ vật và chất liệu

Bình ủ inox có vòi và tay xách; bình đào trong có lát đào; bình matcha gốm có quai và chổi tre; ấm ô long có thân tròn và vòi cong. Máy ủ có màn hình, máy dập có cần ép, shaker có vạch đo. Ly M/L khác tỉ lệ, có đá, tầng sữa, lát quả và topping theo công thức; nắp màng và nắp foam khác nhau. Kho dùng khay đá, chồng ly và hũ nguyên liệu có mức tồn thực.

Phố đối diện có tiệm tạp hóa, sửa xe, bánh mì, cắt tóc và giặt ủi với cửa, biển và chi tiết riêng. Gỗ, đá và vải dùng texture thủ tục; kim loại dùng environment reflection. Toàn bộ tài sản mới được dựng trong mã; không tải thư viện mô hình bên ngoài.

## Hiệu năng và kiểm chứng

- Một vòng render giới hạn 30fps, ngừng khi tab ẩn hoặc cảnh ngoài màn hình.
- Pixel ratio tối đa 1.25 trên điện thoại và 1.75 trên desktop; shadow map 512/1024.
- Geometry/material dùng chung; các chi tiết tĩnh cùng geometry/material được gộp bằng InstancedMesh. Ly, nhân vật, máy chuyển động và tồn kho vẫn độc lập.
- Portrait chỉ dựng khi gần vùng nhìn, cache theo khách và dùng chung renderer theo đợt.
- Quan sát góc quầy trước/sau gộp tĩnh: 592 xuống 341 draw calls, giảm khoảng 42%; chưa phải benchmark FPS hay cam kết máy yếu. Chi tiết ly cũng đã tăng trong quá trình này.
- Engine 3D tải bằng dynamic import, production chunk khoảng 154KB gzip. Vite vẫn cảnh báo chunk thô vượt 500KB; không che cảnh báo.
- 21 kiểm thử bao gồm gameplay hiện có, giao đúng địa điểm, thiếu hàng, giao lặp, tuyến đi tránh vật cản, 16 bộ khớp nhân vật, khách nhận/rời đi, giảm chuyển động và biến đổi mesh sau batching.
- Kiểm tra trình duyệt desktop và phone 375px, các màn quản lý, bê ly tới bàn và giao thật. Các ca thử production dùng origin riêng để không reset save đang chơi.

Không đổi luật điểm/tiền để khớp hoạt họa. Rủi ro còn lại: cần đo FPS trên thiết bị thật, chất lượng nhân vật vẫn là mô hình cách điệu thủ tục, chỉ một khách đang phục vụ cùng lượt khách đang rời tiệm; chưa có hàng loạt người đi đường hoặc chọn vị trí bàn tự do.
