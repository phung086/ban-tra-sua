# 🧋 Tiệm Trà Chibi

Game web/PWA quản lý tiệm trà sữa phong cách **chibi + tone hồng**, xây theo hướng data-driven và có thể mở rộng thành game vận hành tiệm dài hạn.

## Gameplay loop hiện tại

```
Chuẩn bị ngày mới
→ xem event / kiểm kho / chọn nhân viên / decor / research
→ mở tiệm
→ khách tới theo cả random + relationship
→ nhận order
→ chọn món / size / topping / đường / đá
→ mini-game timing rót + lắc
→ dập nắp
→ giao khách
→ score / combo / tip / XP / RP / fan / viral / bond
→ review
→ rep review theo phong cách
→ quest / achievement / story khách quen
→ tổng kết ngày
→ freshness giảm / waste
→ nâng máy / decor / research / nhân viên
→ ngày tiếp theo
```

## Hệ thống đã có

- **8 món nước** + **7 topping**, unlock theo level.
- Customer archetype, món yêu thích, patience, visit count và relationship bond.
- Khách có bond cao quay lại thường xuyên hơn; có story milestone riêng.
- Scoring theo món, size, topping, đường, đá, mức rót, độ lắc và dập nắp.
- **Mini-game timing real-time** bằng `requestAnimationFrame` cho rót và lắc.
- Haptic + sound feedback nhẹ, không phụ thuộc asset ngoài.
- Combo, perfect order, XP, level, reputation, fan, viral và research point.
- Event theo ngày: thường, mưa, tan học, cuối tuần, lễ hội.
- Inventory + freshness + spoilage + waste.
- 5 nhánh upgrade máy/quán.
- 3 nhân viên có perk và chọn người trực.
- **6 món decor** có buff thật lên tip, revenue, fan, viral hoặc RP.
- **6 research node** có prerequisite và thay đổi luật game.
- Daily quest + achievement dài hạn.
- Review loop với 3 kiểu rep: ngọt, duyên, cà khịa.
- Customer story log.
- Collection menu/topping.
- Save local **version 3**, migrate được v1 → v2 → v3.
- PWA/offline shell.
- Responsive mobile/desktop.
- GitHub Actions kiểm tra TypeScript + production build.

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
│   ├── CraftGauge.tsx
│   └── DrinkCup.tsx
├── game/
│   ├── content.ts      # catalog: drink, topping, customer, decor, research...
│   ├── engine.ts       # gameplay systems + economy + progression
│   ├── feedback.ts     # haptic/audio generated in browser
│   ├── storage.ts      # save/load + migration
│   └── types.ts        # domain model
├── App.tsx             # orchestration + screens
├── main.tsx
├── styles.css
├── styles-v2.css
└── styles-v3.css
```

## Nguyên tắc phát triển

1. Content nằm trong catalog; UI không hardcode curriculum/game data.
2. Gameplay rule nằm trong engine; component chỉ gọi action.
3. Save luôn versioned và phải migrate được.
4. Mỗi milestone phải giữ game chơi được từ đầu tới cuối.
5. Mobile-first nhưng desktop có layout riêng.
6. Không sao chép source code hay asset của sản phẩm tham khảo.

## Hướng phát triển tiếp

- Drag/drop topping và thao tác vật lý sâu hơn.
- Shop decoration placement tự do theo grid.
- Seasonal menu / limited event.
- Customer quest chain và story chapter dài hơn.
- Cloud save/account.
- Visit/friends/leaderboard sau khi core loop ổn định.
