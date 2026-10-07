# UI/UX v8 · Hồng sữa & khách chibi

## Thay đổi

- Hồng sữa, kem và chữ màu mận cho HUD, quầy, các trạm pha và các phòng. Giảm viền gỗ nâu và bóng cứng.
- Bộ hình 8 khách riêng biệt, atlas PNG có alpha thật, 4 cột × 2 hàng. Dùng chung tại quầy, đánh giá, album khách quen và màn mở tiệm.
- Mobile có cảnh khách cao 212px thay vì ẩn nhân vật. Desktop cao 320px. Không làm thay đổi công thức, điểm hay save v3.
- Khách nghiêng chào khi tới, đung đưa nhẹ lúc chờ, nhún vui khi dập nắp và khi giao ly đạt từ 80 điểm. Đây là chuyển động trên hình minh họa một tư thế, chưa phải rig xương hoặc sprite biểu cảm khuôn mặt.
- Lời thoại đổi khi chờ quá lâu hoặc ly đã dập nắp; quầy và hàng đợi dùng cùng một đồng hồ.
- Hiệu ứng giao ly chụp lại ID khách vừa phục vụ; không lấy hình khách tiếp theo. Phản hồi tồn tại 2,4 giây.
- Dừng chuyển động khi ngoài viewport, tab ẩn, cài đặt motion OFF hoặc hệ điều hành yêu cầu reduced motion.
- Cache PWA v8 precache bộ hình để dùng offline sau khi service worker cài xong.

## Kiểm tra

- npm test: 6/6; npm run build: thành công.
- Browser desktop 1440×1000 và mobile 390×844: không tràn ngang; ảnh hiện đúng vùng atlas.
- Chọn nền trà/size, chuyển trạm, dập nắp, giao ly, tải lại giữ draft; kiểm tra bằng chuột và bàn phím.
- Giao ly Đức: hiệu ứng hiện Đức đã nhận ly, quầy chuyển sang Ly Ly. Không có lỗi console.
- Motion OFF: animation-name none; cuộn xuống trạm: animation-play-state paused.
- Tương phản token thường: ink/paper 9,51:1; muted/soft 5,84:1; rose/blush 5,02:1; trắng/rose 6,21:1. Chế độ tương phản cao tăng độ đậm chữ.

## Asset và prompt

Asset: public/assets/chibi-guests-v8.png (khoảng 1,34 MB). Tạo bằng công cụ imagegen tích hợp; giữ alpha và chỉnh vị trí bằng CSS background-position. Bản nguồn được giữ tại thư mục generated_images của Codex.

Prompt tạo:

Use case: illustration-story. Asset type: production transparent character sprite atlas for a cute Vietnamese pastel pink bubble tea browser game. Create ONE precisely aligned 4-column by 2-row sprite sheet, landscape aspect ratio exactly 2:1. All eight equal square cells have a single complete full-body chibi customer, perfectly centered within its own cell with 8% clear padding all around. Transparent background, no cell borders, no grid, no text, no ground, no props outside the silhouette. Consistent premium hand-painted anime chibi style: oversized round heads, tiny soft bodies, glossy expressive cocoa eyes with big highlights, warm rosy cheeks, delicate colored outlines, fluffy beautifully shaded hair, pastel cute casual outfits, rounded little hands and shoes. Friendly smiling neutral standing poses with one hand lifted in a small greeting; 3/4 front view. Each fills ~84% of its cell vertically. Palette blush pink, strawberry milk, creamy ivory with soft lilac and mint accents. Exact left to right order: TOP ROW 1 Miu: girl plum-brown shoulder-length wavy hair with pink bow, pink cardigan and cream pleated skirt, fair peach skin. 2 Bo: boy fluffy chestnut hair, butter yellow hoodie, cream shorts, warm peach skin. 3 Nana: girl glossy black straight bob, lavender pinafore dress over cream blouse, peach skin. 4 Sunny: boy tousled caramel brown hair, mint sweater, cream trousers, medium warm brown skin. BOTTOM ROW 1 Chii: girl rose brown long hair in two rounded low pigtails, pale pink sweater and ivory skirt, warm peach skin. 2 Khanh: boy short dark brown fluffy hair, pale blue collared shirt and cream trousers, peach skin. 3 Lyly: girl dusty rose pink hair in two buns with strawberry clips, coral pink dress, fair peach skin. 4 Duc: boy short deep dark hair with round glasses, sage green cardigan and ivory trousers, warm peach skin. Delicate charming professional game illustration, affectionate and cute, cohesive across all eight sprites. Keep every sprite strictly inside its own equal square cell. No letters or names printed.

Prompt chỉnh một lượt để tránh cắt tóc/giày:

Edit this transparent 4-column 2-row chibi sprite atlas for browser game production. Keep the exact same eight characters, faces, outfits, palette, hand-painted art style, ordering, and transparent background. Only adjust layout and padding: all eight cells must be equal perfect squares in a 2:1 landscape image. Scale each character DOWN to 80% of its square cell height, and center it EXACTLY in its respective square cell. Add clear transparent padding above every hair silhouette and below every shoe so no hair, hand, or shoe touches or crosses cell boundaries. Ensure each whole character is completely visible and no sprite touches any neighboring sprite or outer canvas edge. No ground shadows, no text, no borders, no grid. Preserve alpha transparency.
