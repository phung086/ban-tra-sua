import type { GameState } from '../../game/types';
import { DRINKS } from '../../game/content';
import {
  THAO_MENU_OPTIONS, canChooseThaoMenu, chooseThaoMenu, getThaoMenuCallback,
  getThaoMenuChoice, getThaoMenuSign, getThaoMenuStage, type ThaoMenuChoice,
} from '../../game/lifeSim/thaoMenu';

/** Live pre-shop choices, persisted by App through the existing v3 save. */
export function ThaoMenuPanel({ game, onGame }: {
  game: GameState;
  onGame: (state: GameState) => void;
}) {
  const stage = getThaoMenuStage(game);
  const callback = getThaoMenuCallback(game);
  const sign = game.phase === 'prep' && game.morning.day === game.day &&
    game.morning.step !== 'asleep' ? getThaoMenuSign(game) : null;
  if (!stage && !callback && !sign) return null;
  const visibleDrinks = Object.values(DRINKS).filter(drink => game.unlockedBaseIds.includes(drink.id));
  const selected = getThaoMenuChoice(game);
  const choices: readonly ThaoMenuChoice[] = stage === 'invite'
    ? ['book', 'decline'] : ['print', 'handwrite', 'later'];

  return <section className="life-family-call life-thao-menu" aria-label="Bảng thực đơn cùng Thảo">
    <span className="life-morning-label">BẠN BÈ · TIỆM TRÀ PHỐ NHỎ</span>
    <h3>🎨 Thảo và bảng thực đơn trước cửa tiệm</h3>
    {callback && <p role="status">💌 {callback}</p>}
    {sign && <div className="life-thao-sign" role="group" aria-label="Bảng giá trước cửa tiệm"
      style={{ margin: '12px 0', padding: 12, border: '1px solid #e7b5cf', borderRadius: 14,
        background: '#fff9fc', color: '#58304a' }}>
      <p style={{ margin: '0 0 8px', fontWeight: 700 }}>🪧 {sign.label} · từ ngày {sign.day} · Giá đã niêm yết</p>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
        {visibleDrinks.map(drink => <li key={drink.id} style={{ display: 'flex', flexWrap: 'wrap',
          justifyContent: 'space-between', gap: '4px 12px', borderBottom: '1px solid #f1d8e4',
          padding: '6px 0', fontSize: 13 }}>
          <span>{drink.emoji} {drink.name}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>M {drink.priceM.toLocaleString('vi-VN')} ₫ · L {drink.priceL.toLocaleString('vi-VN')} ₫</span>
        </li>)}
      </ul>
    </div>}
    {stage && <p>{selected
      ? THAO_MENU_OPTIONS[selected].text
      : stage === 'invite'
        ? 'Thảo ghé thăm: “Bảng giá trước cửa hơi khó đọc. Mai mình giúp bạn làm lại nhé?” Bạn có thể hẹn hoặc từ chối.'
        : 'Thảo giữ lời hẹn và mang mẫu thực đơn đến. Chọn in bảng rõ giá, viết bảng tay miễn phí hoặc giữ bảng cũ.'}</p>}
    {stage && (selected
      ? <p role="status">✓ Đã lưu quyết định. {stage === 'invite' && selected === 'book'
        ? 'Thảo sẽ quay lại vào sáng mai.' : 'Có thể tiếp tục mở tiệm.'}</p>
      : <div className="life-morning-options" aria-label="Lựa chọn cùng Thảo">
        {choices.map(choice => {
          const option = THAO_MENU_OPTIONS[choice];
          const available = canChooseThaoMenu(game, choice);
          const reason = game.cash < option.cost ? 'Chưa đủ tiền'
            : game.city.energy < option.energy ? 'Chưa đủ sức'
              : game.city.minutes + option.minutes > 1260 ? 'Không đủ thời gian' : null;
          return <button type="button" key={choice} className="life-morning-option"
            disabled={!available}
            onClick={() => onGame(chooseThaoMenu(game, choice))}>
            <strong>{option.label}</strong>
            <small>{option.cost ? option.cost.toLocaleString('vi-VN') + ' ₫' : 'Miễn phí'}
              {' · '}{option.minutes} phút · -{option.energy} sức · +{option.fans} fan</small>
            {!available && reason && <small>{reason}</small>}
          </button>;
        })}
      </div>)}
    {stage === 'make' && !selected && !canChooseThaoMenu(game, 'print') &&
      <small role="status">Không đủ tiền hoặc sức? Vẫn có thể giữ bảng cũ miễn phí và mở tiệm bình thường.</small>}
  </section>;
}
