import type { GameState } from '../../game/types';
import { SHOP_TASTING, canChooseShopTasting, chooseShopTasting, getShopTastingChoice, getShopTastingPrompt, getShopTastingCallback, type ShopTastingChoice } from '../../game/lifeSim/shopTasting';

const choices: ShopTastingChoice[] = ['serve', 'listen', 'later'];

export function ShopTastingPanel({ game, onGame }: { game: GameState; onGame: (next: GameState) => void }) {
  const prompt = getShopTastingPrompt(game);
  const callback = getShopTastingCallback(game);
  if (!prompt && !callback) return null;
  const choice = getShopTastingChoice(game);
  return <section className="life-morning" aria-label="Góp ý trà với cô Thu">
    {callback && <p role="status">{callback}</p>}
    {prompt && <>
      <h3>🧋 Một ly trà, một lời góp ý</h3>
      <p>{choice ? SHOP_TASTING[choice].reply : prompt}</p>
      {choice ? <p role="status">Đã ghi vào nhật ký.</p> :
        <div className="life-morning-options">{choices.map(option =>
          <button type="button" key={option} className="life-morning-option"
            disabled={!canChooseShopTasting(game, option)}
            onClick={() => onGame(chooseShopTasting(game, option))}>
            <strong>{SHOP_TASTING[option].label}</strong>
            <small>{SHOP_TASTING[option].detail}</small>
          </button>)}</div>}
    </>}
  </section>;
}
