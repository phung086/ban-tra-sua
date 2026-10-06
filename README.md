# 🧋 Tiệm Trà Chibi

Game web/PWA quản lý tiệm trà sữa phong cách **chibi + tone hồng**, xây theo hướng data-driven để có thể tiếp tục mở rộng thành một game vận hành tiệm dài hạn thay vì prototype ngắn.

## Gameplay hiện tại

Core loop đã thành một vòng chơi nhiều ngày:

```
Chuẩn bị ngày mới
→ xem sự kiện ngày / kiểm kho / chọn nhân viên
→ mở tiệm
→ nhận order
→ chọn món + size + topping
→ căn đường / đá / mức rót / độ lắc
→ dập nắp
→ giao khách
→ scoring 0–100 + combo + tip + fan + viral
→ review
→ rep review theo phong cách
→ hoàn thành quest
→ tổng kết ngày
→ freshness giảm / waste
→ nâng máy / tuyển nhân viên / mở món mới
→ ngày tiếp theo
```

## Hệ thống đã có

- **8 món nước** mở dần theo level.
- **7 topping** mở dần theo level.
- Customer archetype, sở thích, lời thoại và review riêng.
- Scoring theo món, size, topping, đường, đá, mức rót, độ lắc và dập nắp.
- Combo, perfect order, XP, level, reputation, fan và viral.
- Event theo ngày: ngày thường, mưa, tan học, cuối tuần, lễ hội.
- Inventory theo nguyên liệu.
- Freshness / spoilage / waste theo ngày.
- Tủ mát giảm hao hụt.
- 5 nhánh upgrade: máy ủ trà, máy lắc, máy dập nắp, tủ mát, trang trí.
- 3 nhân viên có perk khác nhau và chọn người trực ca.
- Daily quests có reward.
- Achievement dài hạn.
- Collection hiển thị món/topping đã mở khóa.
- Review loop có 3 kiểu rep: ngọt ngào, duyên, cà khịa; mỗi kiểu đổi reputation/fan/viral khác nhau.
- Economy: doanh thu, tip, chi phí nguyên liệu, waste, staff/upgrades.
- Save local **version 2** và tự migrate save v1.
- PWA/offline shell.
- Responsive mobile/desktop.
- GitHub Actions chạy TypeScript + production build.

## Chạy local

```bash
npm install
npm run dev
```

Production:

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
│   ├── content.ts      # toàn bộ content/catalog
│   ├── engine.ts       # gameplay systems + progression
│   ├── storage.ts      # save/load + migration
│   └── types.ts        # domain model
├── App.tsx             # orchestration + screens
├── main.tsx
├── styles.css          # visual foundation
└── styles-v2.css       # progression/management/social UI
```

### Quy tắc phát triển

1. Content mới ưu tiên thêm vào catalog, không hardcode vào UI.
2. Gameplay rule nằm trong engine, UI chỉ gọi action.
3. Save luôn versioned và phải migrate được.
4. Mỗi milestone phải giữ game chơi được từ đầu đến cuối.
5. UI mobile-first nhưng desktop có layout riêng.
6. Không sao chép asset/source code của sản phẩm tham khảo.

## Hướng phát triển tiếp

- Mini-game thao tác real-time: giữ để rót, timing zone, drag/drop topping.
- Shop decoration placement và cosmetic inventory.
- Customer relationship / khách quen / story events.
- Recipe research tree và seasonal menu.
- Sound design, haptic, particle và animation nâng cao.
- Cloud save/account.
- Friends/visit/leaderboard sau khi core loop ổn định.

