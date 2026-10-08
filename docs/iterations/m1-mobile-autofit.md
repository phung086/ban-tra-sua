# M1 bổ sung — Mobile landscape/portrait autofit (08/10/2026)

Nhánh: `codex/mobile-beta-foundation`. Source đầu vòng: `739558a13b9a6cceffecf0dde6065dc84f71458a`. Không thay đổi main, dữ liệu save, collision solver, quy trình đơn hàng hay kịch bản truyện.

## Vấn đề và phạm vi

Layout cũ đặt chiều cao `.street-world` ở 530–570px khi màn <=900px, khiến điện thoại ngang cao 320–430px phải cuộn rất xa mới tới nơi pha trà. `App` dùng chỉ breakpoint rộng 900px nên điện thoại landscape 932×430 không được coi là mobile, sổ tay không pause đúng. Bán kính vẽ núm trước đây luôn 42px dù CSS giảm vòng tròn.

Đã triển khai:
- `src/game/playLayout.ts`: 3 chế độ `portrait/landscape/desktop` dựa vào kích thước CSS viewport và pointer coarse; phủ điện thoại ngang >900px. Có unit tests.
- `src/App.tsx`: đồng bộ layout khi orientationchange/window resize/visualViewport resize, CSS height theo vùng nhìn hữu dụng; không remount `StreetWorld`.
- `src/styles-responsive-play.css`: import cuối, chế độ ngang 2 vùng (scene 53%, service 47%) cao bằng viewport và độc lập scroll, HUD compact, nút ít nhất 44px; chế độ dọc canvas theo 54dvh, service cuộn trang; city full screen với sổ tay nổi thu gọn/mở bên phải; safe-area; không transform-scale toàn app.
- `MovementStick`: tính bán kính knob từ clientWidth để không vượt vòng; cancel input khi xoay/resize.
- `StreetRuntime`: reset drag camera và input khi xoay/resize; ResizeObserver đang có cập nhật Three.js aspect.
- `scripts/mobile-layout-smoke.mjs` và workflow riêng: production build, Chromium `isMobile/hasTouch`, xoay tại chỗ và giữ nguyên phần tử canvas, kiểm scene/service/joystick không bị cắt, không tràn ngang, mở ca pha trà, sổ tay phố; screenshot và kết quả JSON.

## Lệnh và kiểm thử

```bash
npm ci
npm test
npm run build
npx vite preview --host 127.0.0.1 --port 5192 --strictPort
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install --with-deps chromium
node scripts/mobile-layout-smoke.mjs
```

Các kích thước e2e: 320×568, 360×800, 390×844, 568×320, 667×375, 844×390, 932×430, 1024×480, 1280×800. Lượt kiểm city còn 390×844, 667×375, 844×390, 932×430. Touch được giả lập, không phải điện thoại thật. Thực hiện portrait→landscape→portrait trong một page và xác minh canvas identity/joystick release. Screenshot trước/sau không thay thế kiểm thủ công thiết bị thật.

Workflow: [Mobile orientation and autofit](https://github.com/phung086/ban-tra-sua/actions/workflows/mobile-layout.yml). Artifact (khi job hoàn tất) gồm ảnh `shop-<WxH>.png`, `landscape-crafting-844x390.png`, `city-<WxH>.png`, `city-sheet-<WxH>.png`, `results.json`. Cần kiểm log + ảnh trước khi đánh dấu đạt.

## Cổng nghiệm thu và giới hạn

- [x] Lớp layout responsive + phản ứng resize/orientation trong code.
- [x] Unit tests cho breakpoint, giá trị lỗi, tablet/desktop; CI test/build cần kiểm trên SHA cuối.
- [ ] Browser production không tràn ngang/không che núm hoặc khu pha: chờ workflow screenshots + log.
- [ ] Đi phố, open sheet, pha/giao và collision trên thiết bị thật, Android/iPhone và xoay khi đang giữ núm.
- [ ] M1 draw call tổng thể giảm >=40% / frame P95 <=10% theo `m1-01.md`: **độc lập, chưa đủ bằng chứng**.

Không cập nhật trạng thái đạt M1 hay chuyển M2 vì mục tiêu performance chưa được xác nhận và chưa có thiết bị mobile thật.
