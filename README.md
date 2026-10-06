# 🧋 Tiệm Trà Chibi

Vertical slice đầu tiên của game web/PWA quản lý tiệm trà sữa phong cách **chibi + tone hồng**, được xây theo hướng data-driven để tiếp tục mở rộng mà không hardcode nội dung vào UI.

## Chơi được gì ở base hiện tại?

- Chu kỳ ngày: chuẩn bị → mở cửa → phục vụ → tổng kết → ngày mới.
- Khách chibi có tên, màu tóc/áo, lời thoại và phong cách review riêng.
- Order gồm món nền, size M/L, % đường, % đá và topping.
- Pha chế thật qua UI: chọn món, size, topping, kéo thanh định lượng, đóng nắp và giao khách.
- Scoring 0–100 theo độ chính xác; điểm ảnh hưởng doanh thu, tip, XP, uy tín và số sao.
- Kho nguyên liệu + nhập hàng theo lô nhỏ.
- Review feed sau mỗi đơn.
- Auto-save bằng `localStorage` với `saveVersion`.
- PWA manifest + service worker; giao diện responsive mobile/desktop.
- CI GitHub Actions chạy typecheck + production build.

## Chạy local

```bash
npm install
npm run dev
```

Mở URL Vite in ra trong terminal.

Build production:

```bash
npm run build
npm run preview
```

## Kiến trúc

```
src/
├── components/
│   ├── ChibiCustomer.tsx
│   └── DrinkCup.tsx
├── game/
│   ├── content.ts      # content/data: món, topping, khách, restock
│   ├── engine.ts       # luật game: order, scoring, economy, day loop
│   ├── storage.ts      # save/load
│   └── types.ts        # domain model
├── App.tsx             # flow + screens
├── main.tsx
└── styles.css          # design system + responsive game UI
```

### Nguyên tắc mở rộng

UI không quyết định luật game. Dữ liệu món/khách/topping nằm ở `game/content.ts`, luật ở `game/engine.ts`. Khi thêm món mới, ưu tiên thêm content thay vì viết `if/else` trong giao diện.

## Roadmap gần

1. Mini-game rót trà/múc topping có animation và timing.
2. Hạn sử dụng + batch nguyên liệu + waste.
3. Unlock recipe, thiết bị và progression tree.
4. Rep review thành gameplay riêng với reputation/viral consequences.
5. Trang trí quán + cosmetic collection.
6. Âm thanh, haptic, particle và onboarding tương tác.
7. Cloud save/account và social layer sau khi core loop ổn định.

## Bản quyền / định hướng

Dự án lấy cảm hứng từ gameplay loop của dòng game quản lý quán nhưng dùng code, UI, nhân vật và visual identity riêng. Không sao chép asset hay source code của sản phẩm tham khảo.
