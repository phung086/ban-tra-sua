# 🧋 Tiệm Trà Chibi

**Lộ trình beta/production:** [Kế hoạch và tiêu chí nghiệm thu](docs/production-roadmap.md) · [Quy trình từng vòng](docs/iteration-protocol.md) · [Baseline đã kiểm chứng](docs/beta-baseline.md) · [Prompt tiếp theo](docs/next-step-prompt.md).

Game web/PWA quản lý tiệm trà sữa **3D, tone hồng pastel, bối cảnh phố Việt Nam**, xây theo hướng data-driven. Tên Chibi được giữ trong tên dự án; nhân vật hiện tại là những người hàng xóm đa dạng, có chuyển động.

Tiệm nằm trong **khu An Hòa hư cấu tại Hà Nội**. Bản mở rộng ưu tiên điện thoại: núm tròn analog, vuốt camera, gặp cư dân và làm việc trong xóm. Thành phố có **12 điểm đến**, thêm phố Lò Gốm, quảng trường Đông Phong, đường ven sông và sân đình Hạ. [Hướng dẫn khu phố](docs/hanoi-neighborhood.md).

Sáu cư dân có tính cách riêng và nhớ cách trả lời chân thành, vui vẻ hoặc cộc lốc. **30 nhiệm vụ được viết sẵn** trải qua ba chặng chuyện; hai chặng đầu chọn một trong hai việc, nên một lượt chơi hoàn thành tối đa **18 nhiệm vụ**, rồi cùng hàng xóm tổ chức cuộc hẹn uống trà. Sổ khám phá có 12 dấu mốc; giao trà, câu cá và việc ngày tiếp tục đóng góp vào kinh tế của tiệm.

Nhà, mái ngói, cây phân nhánh và người có thêm chi tiết hình học. Mặt đường, nhựa đường, vỏ cây và mái ngói dùng ảnh chất liệu CC0 kèm normal map, đóng gói tại `public/textures`; nguồn ghi trong [sources.json](public/textures/sources.json) và [ghi chú vật liệu](docs/texture-credits.md). Tám JPEG 1k khoảng 7,55 MB được thu xuống 512px khi dựng cảnh. Nhân vật và công trình vẫn là mô hình tạo bằng mã, chưa phải hình ảnh chân thực như ảnh chụp; chưa đo FPS trên điện thoại thật.

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
→ bê ly → đi đến quầy hoặc bàn được chỉ định → giao khách
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
- Nhạc nền nguyên bản nhẹ và vui, bật/tắt và chỉnh âm lượng riêng với hiệu ứng âm thanh.
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

Tiệm 3D giữ bốn trạm pha thủ công và ly đang pha khi ghé kho. Kéo núm tròn để đi, thả để dừng; vuốt cảnh để xoay camera. Bàn phím vẫn dùng WASD/phím mũi tên. Chọn địa điểm để tự đi vòng quầy. “Nhìn toàn tiệm” mở góc nhìn trên cao, có thể kéo để xoay và chạm sàn để đi. Dập nắp và bê ly, rồi đến gần đúng khách để giao. Chi tiết bản hiện tại: [Tiệm 3D hồng pastel](docs/street-shop-3d.md).

```bash
npm ci
npm run dev
```

Production:

```bash
npm run build
npm run preview
```

Kiểm thử:

```bash
npm test
npm run typecheck
```

## Nhân vật, di chuyển và nhạc nền

Thân, khuôn mặt và bề mặt tay/chân được tạo liên tục; khớp xương GPU uốn khuỷu tay và đầu gối trong cả Three.js và Babylon.js. Bàn tay và đồ đang bê đi theo khớp khuỷu tay. Nhịp chân của người chơi theo quãng đường thực tế, với sải chân nhỏ và đổi hướng mềm. Cảnh vẫn là mô hình game tạo bằng mã.

Di chuyển có bán kính người chơi (0,38 đơn vị cảnh) và kiểm tra từng bước nhỏ để chặn tường, đồ trong tiệm, vật trên phố và toàn thân xe theo hướng quay. Xe nhường đường khi đến gần người chơi; lộ trình tự đi tìm đường vòng khi bị xe cản. Khi khám phá, tường sau và mái hiên tiệm tạm ẩn nếu chắn đường nhìn từ camera đến người chơi.

Chạm vào game hoặc nhấn một phím để trình duyệt cho phép phát nhạc. Trong **Cài đặt game**, dùng **Nhạc nền** và thanh **Âm lượng nhạc**; mức mặc định là 45%. **Hiệu ứng âm thanh** có nút riêng. “Một sáng Phố Nhỏ” là giai điệu tám ô nhịp ở 88 BPM, tổng hợp bằng Web Audio, không cần tải tệp nhạc. Nhạc giảm khi hội thoại và tạm dừng khi tab bị ẩn. Các lựa chọn âm thanh lưu cùng tùy chọn giao diện, tách khỏi save gameplay.

Kiểm tra thủ công: đi sát tường và hai đầu xe, thử lộ trình bị xe cản, quan sát tay/chân khi đi và khi bê đồ, rồi đổi bộ dựng hình trong **Tương thích đồ họa**. Kiểm tra nút nhạc, mức âm lượng, lưu sau tải lại, hội thoại và chuyển tab; thanh âm lượng dùng được bằng phím mũi tên. Nhật ký xác nhận 54 kiểm thử qua 15 tệp và build production tại [.impeccable/review/character-repair](.impeccable/review/character-repair/). Các kiểm tra trình duyệt và ảnh màn hình không thay thế phép đo FPS trên điện thoại thật.

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
│   ├── audio.ts        # shared Web Audio context, music/SFX and lifecycle
│   ├── musicScore.ts   # original eight-bar cafe melody
│   ├── storage.ts      # save/load + migration
│   ├── cityMap.ts      # 12 điểm đến, va chạm và giới hạn thành phố
│   ├── collision.ts    # player circle, oriented vehicle bounds and traffic yielding
│   ├── movement.ts     # swept movement and route planning
│   ├── cityEpisodes.ts # tính cách cư dân, chuyện 2–3
│   ├── neighborhoodStories.ts # hội thoại, nhiệm vụ và tiến trình lưu
│   ├── cityLife.ts     # việc ngày, câu cá và sổ 12 dấu mốc
│   └── types.ts        # domain model
├── App.tsx             # orchestration + screens
├── main.tsx
├── scene/              # world, urban expansion, materials, renderer and static batches
│   └── actorGeometry.ts # continuous surfaces and GPU-skinned limbs
├── styles-street.css   # unified pink visual system
└── styles-world-foundation.css # scene layout, notebook and settings refinements
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
- Thêm tình huống và chặng chuyện sau ba chặng hiện có.
- Cloud save/account.
- Visit/friends/leaderboard sau khi core loop ổn định.


## Nhánh thử nghiệm spatial-interactions-v4-sol

Nhánh này cố ý tách biệt khỏi các nhánh v4 khác và không thay đổi order-service. Mục tiêu là phát triển các interaction độc lập, dễ cherry-pick:

- kéo/thả topping với fallback chạm trên mobile;
- decor planner 3 vị trí, kéo để đổi thứ tự hiển thị;
- thứ tự decor được lưu bằng mảng equipped hiện có, không đổi save schema;
- seasonal ambience suy ra trực tiếp từ ngày chơi, không thêm state mới;
- CSS nằm riêng trong `styles-v4-sol.css` để giảm xung đột merge.
