# Nền đồ họa và giao diện

Lượt này củng cố nền nhìn và thao tác trước khi thêm gameplay. Các nhiệm vụ, công thức, nền kinh tế và save version 3 giữ nguyên.

## Hai bộ dựng hình

Three.js xây mô hình, chuyển động, camera và raycast trong một scene graph dùng chung. Bộ dựng hình mặc định dùng Three.js. Có thể chọn Babylon.js trong **Cài đặt → Tương thích đồ họa**: Babylon tạo mesh, geometry dùng chung, PBR material, texture, shadow và thin instances trên canvas riêng. Engine cũ được hủy trước khi tạo engine mới; vị trí và hướng nhìn được chuyển tiếp. Không chạy hai vòng dựng hình chính cùng lúc.

Babylon chỉ tải khi được chọn. Nó là lựa chọn tương thích để kiểm tra trên từng thiết bị, không phải cam kết sẽ nhanh hơn Three.js. Portrait nhỏ vẫn dùng Three.js và cache ảnh, với context tạm được hủy sau khi tạo.

## Ngân sách hình ảnh

| Mức | DPR tối đa | Shadow map | Khoảng nhìn theo chân |
|---|---:|---:|---:|
| Nhẹ | 1 | 256 | 42 |
| Cân bằng | 1,25 | 512 | 64 |
| Chi tiết cao | 1,75 | 1024 | 100 |

Tự điều chỉnh bắt đầu ở Cân bằng trên màn hình nhỏ, Chi tiết cao trên desktop. Chỉ hạ sau khi tích lũy 90 mẫu chậm, có giảm bộ đếm khi khung ổn định, và phục hồi sau 450 mẫu ổn định; bỏ qua khoảng nghỉ tab dài. Giới hạn phục hồi tự động trên mobile ở Cân bằng. Vòng cảnh giữ giới hạn 30fps, dừng khi tab ẩn hoặc cảnh ngoài viewport. Chất lượng không đổi tốc độ đi hay thời gian nhiệm vụ.

Nếu chính việc xử lý cảnh vượt 80ms trong 12 mẫu liên tiếp, tự điều chỉnh hạ một mức sớm. Khoảng frame dài nhưng CPU xử lý nhanh được bỏ qua; nhờ đó tab nghỉ không bị nhầm với quá tải dựng hình.

Three.js cập nhật shadow ở nhịp 70/100/150ms tương ứng, giảm số lượt vẽ shadow trong khi chuyển động vẫn theo vòng cảnh. Babylon dùng chung geometry, PBR material và texture; cập nhật matrix khi thay đổi, thin instances cho đồ vật lặp và shadow camera theo cùng phạm vi.

`data-engine`, `data-quality`, `data-draw-calls`, `data-triangles`, `data-cpu-ms`, `data-frame-ms` trên canvas phục vụ kiểm tra. Draw calls và triangles lấy trung bình 15 khung; triangles của Babylon là số indices active của scene, không hoàn toàn cùng phép đo với Three.js. CPU time là thời gian xử lý và gửi lệnh trong trình duyệt, chưa phải thời gian GPU hoặc benchmark điện thoại.

## Nền nhìn và tương tác

Ánh sáng mặt trời ấm, trời xanh và fill nhẹ giúp khối nhà rõ hơn. Cây có tán riêng, mặt hồ có các gợn hình học và nhân vật có contact shadow mềm. Camera theo chân cao hơn, chuyển độ cao có damping khi tránh footprint nhà; chưa phải bộ giải mọi vật che camera.

Cảnh phố chiếm viewport. HUD nhỏ giữ vị trí, giờ và sức; bản đồ thu nhỏ mở bản đồ đầy đủ. Sổ tay nằm dưới trên điện thoại và góc phải trên desktop, thu gọn để lộ cảnh. Quán dùng bảng chuẩn bị gọn, icon SVG và một thao tác mở cửa rõ ràng.

## Xác nhận

Kiểm thử kiểm tra giới hạn chất lượng, chống dao động, phục hồi chậm, lựa chọn thủ công và bỏ qua khoảng tab nghỉ, cùng tất cả kiểm thử gameplay trước đó. Build TypeScript/Vite phải thành công. Kiểm tra trình duyệt cả hai engine, hướng texture, chuyển engine khi đã đi và bố cục 390px/desktop. Hiệu năng GPU, pin, nhiệt và đa chạm vẫn cần đo trên điện thoại Android/iOS thật.

Nguồn kỹ thuật: [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html), [Babylon scene optimization](https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene/), [Babylon thin instances](https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/thinInstances/).
