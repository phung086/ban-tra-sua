import { predictedQuickMixScore, quickMixDrink, restartCarefulMix } from "../game/quickMix";
import type { GameState } from "../game/types";

interface Props {
  game: GameState;
  onGame: (next: GameState) => void;
}

/** A real player-facing decision between two timing challenges and a quicker,
 * lower-scoring technique. The existing patience clock keeps ticking.
 */
export function QuickMixChoice({ game, onGame }: Props) {
  if (game.phase !== "open" || !game.currentOrder) return null;
  const rushed = game.draft.rushed === true;
  const estimate = predictedQuickMixScore(game);
  return (
    <section className={`quick-mix-choice ${rushed ? "is-rushed" : ""}`} aria-label="Lựa chọn nhịp pha trà">
      <div className="quick-mix-copy">
        <strong>{rushed ? "⚡ Đã chọn pha nhanh" : "⏱ Pha kỹ hay pha nhanh?"}</strong>
        <p>{rushed
          ? "Đã bỏ qua hai lượt canh kim. Kỹ thuật kém chuẩn hơn 12 điểm; khách vẫn đang chờ."
          : "Pha kỹ: canh kim rót và lắc để đạt điểm cao. Pha nhanh: bỏ qua hai lượt canh kim, kỹ thuật mất 12 điểm."}</p>
        {!rushed && estimate !== null && <small>Ước tính nếu pha nhanh và dập nắp: <b>{estimate}/100</b> (trước thưởng máy/nâng cấp).</small>}
      </div>
      <div className="quick-mix-actions">
        {rushed ? (
          <button type="button" disabled={game.draft.sealed} onClick={() => onGame(restartCarefulMix(game))}>
            🎯 Pha kỹ lại · canh cả hai bước
          </button>
        ) : (
          <button type="button" disabled={game.draft.sealed} onClick={() => onGame(quickMixDrink(game))}>
            ⚡ Pha nhanh · bỏ qua 2 lượt canh
          </button>
        )}
      </div>
    </section>
  );
}
