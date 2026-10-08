# Định hướng mỹ thuật và gameplay — Tiệm Trà Phố Nhỏ

Ngày tham khảo: 08/10/2026. Đây là **đề xuất cho các vòng tới**, không phải asset mới đã sản xuất hay bằng chứng hiệu năng đạt.

## Hình ảnh: Hà Nội chibi 3D có chiều sâu, hồng vừa phải

- **Điểm nhấn thương hiệu:** tiệm trà tone hồng phấn + kem sữa, biển chữ Việt dễ đọc, cốc trà và hàng hoa trước cửa. Phối cùng vàng tường cũ, xanh ngọc cửa chớp, cây xanh và nhựa đường xám để không bị toàn bộ thế giới nhuộm hồng.
- **Phố Hà Nội:** mặt tiền nhà ống, ban công sắt và chậu cây, mái hiên, dây điện, vỉa hè, bảng hiệu Việt, xe máy; chiều rộng và tỷ lệ phố hợp lý. Đưa chi tiết vào texture/atlas ở xa, geometry ở nơi tạo silhouette đặc sắc.
- **Nhân vật:** chibi có bàn tay ôm cốc rõ, tóc/trang phục và nét mặt phân biệt NPC; animation idle/bước/giao cốc không trượt chân. Thử 1 NPC gần/xa trước khi thay toàn bộ.
- **Tiệm:** tương tác chế biến phải trực quan: lấy trà, chọn sữa/đường/đá, topping, đóng nắp, giao đúng khách. Feedback bằng ánh sáng nhẹ/âm thanh ngắn, không dùng hiệu ứng GPU nặng.
- **UI:** HUD khi đi phố chỉ chứa mục tiêu ngắn, joystick và nút tương tác; sổ nhiệm vụ thành bottom sheet; button tối thiểu 48px, safe area, landscape; chế độ giảm chuyển động và chữ Việt rõ.

## Gameplay: việc nhỏ nhưng có hệ quả

1. **Vòng pha trà:** đặt đơn → chọn công thức → pha → kiểm tra → giao → nhận tiền/quan hệ, có nguyên liệu hữu hạn và thất bại mềm.
2. **Sống trong phố:** chợ, hồ, hàng xóm có thời gian/lịch; NPC ghi nhớ lời hứa; lời thoại 2–4 lựa chọn khác nhau và thay đổi cả điều kiện đơn hàng hoặc mối quan hệ.
3. **Mục tiêu 30–45 phút:** ba NPC liên kết chéo, ba quyết định A/B có hai kết thúc; có đường sửa sai. Save cũ migrate an toàn, thưởng idempotent.
4. **Trải nghiệm đầu:** người mới hoàn thành đơn đầu trong 3–5 phút; gợi ý theo ngữ cảnh chứ không mở 5 modal một lúc.

## Performance trước khi nhân rộng đồ họa

- **Light** dành cho RAM/CPU hạn chế: DPR≤1, đổ bóng rẻ, shadow texture chỉ khi đo đạt, tránh bloom/SSAO. Điều chỉnh bằng số liệu P95, không suy luận từ ảnh.
- **Batched/instanced tĩnh cùng geometry/material** và culling theo sector có bounds; giữ vật thể động/collider/NPC/marker ngoài gộp. Không merge thành một khối toàn thành phố.
- **LOD và progressive asset:** chất lượng gần/vừa/xa, atlas chung, thử KTX2 khi có pipeline kiểm tra support/fallback. Không ép điện thoại yếu tải texture HD ban đầu.
- **Mức chặn M1:** ≥40% giảm draw call overview light vs baseline cùng cấu hình, P95 tăng ≤10%. Thiết bị Android 3–4 GB và iPhone cần test trực tiếp, kể cả 15 phút di chuyển/chế biến.

## Tài liệu gốc để triển khai, không sao chép asset không phép

- Nhà phố và mặt tiền Hà Nội: https://kinhtedothi.vn/gia-tri-kho-dong-dem-cua-nhung-can-nha-pho-co-ha-noi-tu-ly-giai-quoc-te.html
- Phố cà phê Phan Huy Ích, màu tường, ban công: https://visitbadinh.com.vn/vi/blog/details/pho-phan-huy-ich-khu-pho-ca-phe-mang-net-hoai-co-cua-ha-thanh-xua-78
- Three.js instancing: https://threejs.org/docs/pages/InstancedMesh.html
- Three.js geometry merging tradeoffs: https://threejs.org/manual/pages/optimize-lots-of-objects.html
- Three.js LOD: https://threejs.org/docs/pages/LOD.html
- Three.js compressed textures/GLTF: https://threejs.org/docs/pages/GLTFLoader.html

## Tình trạng thực thi

Vòng `codex/mobile-auto-quality-cycle-01`: tập trung **nhận diện đúng màn hình ngang, khởi tạo light khi phần cứng hạn chế, giữ quyền chọn manual**, có unit tests. Không tuyên bố đã nâng tất cả asset/gameplay hoặc bảo đảm 30FPS trên máy thật. Sau CI và merge, tiếp tục theo thứ tự hiệu năng → art slice → gameplay slice.
