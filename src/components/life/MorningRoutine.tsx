import { BREAKFAST_OPTIONS, chooseBreakfast, wakeMorning, type BreakfastChoice } from '../../game/lifeSim/morning';
import { MARKET_OPTIONS, marketChoice, visitMorningMarket, type MarketChoice } from '../../game/lifeSim/marketEncounter';
import { formatMoney } from '../../game/engine';
import type { GameState } from '../../game/types';

const breakfast: { id: BreakfastChoice; emoji: string; hint: string }[] = [
  { id: 'cook', emoji: '🍳', hint: 'Nấu ở nhà · 20 phút' },
  { id: 'street', emoji: '🥖', hint: 'Đầu ngõ · 10 phút' },
  { id: 'skip', emoji: '🚶', hint: 'Đi làm luôn · 0 phút' },
];
const market: { id: MarketChoice; emoji: string; hint: string }[] = [
  { id: 'fruit', emoji: '🍎', hint: '8 phút · no thêm 12 · thân cô Hạnh +1' },
  { id: 'chat', emoji: '💬', hint: '5 phút · thân cô Hạnh +2' },
  { id: 'leave', emoji: '🏪', hint: '0 phút · miễn phí' },
];
const clock = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

export function MorningRoutine({ game, onGame }: { game: GameState; onGame: (state: GameState) => void }) {
  const { morning } = game;
  const visited = marketChoice(game);
  const finished = morning.step === 'finished';
  return <section className="life-morning" aria-label="Sinh hoạt buổi sáng" data-step={morning.step}>
    <header className="life-morning-heading">
      <span className="life-morning-sun" aria-hidden="true">🌤️</span>
      <div>
        <span className="life-morning-label">NHẬT KÝ ĐỜI SỐNG · NGÀY {game.day}</span>
        <h3>{morning.plan.wakeVariant === 'overslept' ? 'Ôi, sáng nay ngủ quên rồi!' : 'Một ngày mới ở Phố Nhỏ'}</h3>
        <p>{finished ? 'Ăn sáng xong rồi. Mình ghé chợ hay mở tiệm?' : 'Chăm mình trước khi bắt đầu bán trà.'}</p>
      </div>
      <strong className="life-morning-clock" aria-label="Giờ trong game">{clock(game.city.minutes)}</strong>
    </header>
    {morning.step === 'asleep' && <button className="life-morning-wake" onClick={() => onGame(wakeMorning(game))}>☀️ Thức dậy bắt đầu ngày mới</button>}
    {morning.step === 'awake' && <>
      <p className="life-morning-prompt">Sáng nay ăn gì?</p>
      <div className="life-morning-options">{breakfast.map(({ id, emoji, hint }) => {
        const option = BREAKFAST_OPTIONS[id];
        return <button className="life-morning-option" key={id} disabled={game.cash < option.cost} onClick={() => onGame(chooseBreakfast(game, id))}>
          <span aria-hidden="true">{emoji}</span><strong>{option.label}</strong><small>{hint}</small>
          <b>{option.cost ? formatMoney(option.cost) : 'Miễn phí'}</b>
        </button>;
      })}</div>
    </>}
    {finished && <>
      <div className="life-morning-done" aria-live="polite">✓ {BREAKFAST_OPTIONS[morning.breakfast ?? 'skip'].label} · Độ no {morning.satiety}/100</div>
      <section className="life-market" aria-label="Ghé chợ buổi sáng">
        <h4>🧺 Ghé chợ đầu ngõ</h4>
        {visited === null ? <>
          <p>Cô Hạnh đang xếp hoa quả. Mua trái cây, hỏi thăm hay đi thẳng tới tiệm?</p>
          <div className="life-morning-options">{market.map(({ id, emoji, hint }) => {
            const option = MARKET_OPTIONS[id];
            return <button type="button" className="life-morning-option" key={id} disabled={game.cash < option.cost} onClick={() => onGame(visitMorningMarket(game, id))}>
              <span aria-hidden="true">{emoji}</span><strong>{option.label}</strong><small>{hint}</small>
              <b>{option.cost ? formatMoney(option.cost) : 'Miễn phí'}</b>
            </button>;
          })}</div>
        </> : <div className="life-market-reply" role="status">
          <strong>✓ Đã ghé chợ hôm nay</strong><p>{MARKET_OPTIONS[visited].reply}</p>
          <small>Độ no {morning.satiety}/100 · Mỗi ngày chỉ chọn một lần.</small>
        </div>}
      </section>
    </>}
  </section>;
}
