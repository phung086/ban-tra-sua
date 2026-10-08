# Vật liệu chụp thực tế

Các bản đồ màu và normal OpenGL ở `public/textures` đến từ [Poly Haven](https://polyhaven.com/), theo [giấy phép CC0](https://polyhaven.com/license). Game phân phối chúng tại chỗ, không gọi API hoặc máy chủ Poly Haven trong lúc chơi.

| Chất liệu | Nguồn |
|---|---|
| Gạch lát phố | [Brick Pavement 02](https://polyhaven.com/a/brick_pavement_02) |
| Vỏ cây | [Bark Brown 02](https://polyhaven.com/a/bark_brown_02) |
| Nhựa đường | [Asphalt 02](https://polyhaven.com/a/asphalt_02) |
| Mái ngói | [Clay Roof Tiles 02](https://polyhaven.com/a/clay_roof_tiles_02) |

Tám ảnh JPEG nguồn 1k được đối chiếu MD5 với API chính thức; URL và checksum lưu trong `public/textures/sources.json`. Khi mở cảnh, game tạo bề mặt 512 × 512, dùng lại tài nguyên theo chất liệu, và giữ chất liệu tạo bằng mã làm phương án dự phòng nếu ảnh không tải được. Three.js và Babylon.js đều đọc màu sRGB và normal tuyến tính từ cùng cảnh.

Nhân vật, nhà cửa, đồ dùng và hình học cây là nội dung tạo bằng mã trong dự án. Vật liệu ảnh không biến những mô hình đó thành bản quét người hoặc công trình thực tế.
