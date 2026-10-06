import type { ReactNode } from "react";
import { AdaptiveCraftHint } from "./AdaptiveCraftHint";
import { CraftGauge } from "./CraftGauge";
import { CraftHotkeys } from "./CraftHotkeys";
import { DrinkCup } from "./DrinkCup";
import { HoldDispenser } from "./HoldDispenser";
import { RecipeChecklist } from "./RecipeChecklist";
import { ToppingTray } from "./ToppingTray";
import { DRINKS } from "../game/content";
import { updateDraft } from "../game/engine";
import type { BaseId, GameState, ToppingId } from "../game/types";

interface Props {
  game: GameState;
  customerName: string;
  onGame: (state: GameState) => void;
  onServe: () => void;
  station: number;
  onStation: (station: number) => void;
}

export function CraftWorkbench({ game, customerName, onGame, onServe: serveDrink, station, onStation: setStation }: Props) {
  const order = game.currentOrder!;
  return (
      <div className="panel workstation v6-brew-bench v7-workbench" id="craft-workbench">
        <div className="workstation-head">
          <div>
            <h2>Pha một ly thật ngon</h2>
            <p>Cho {customerName} · Đơn {game.served + 1}/{game.targetOrders}</p>
            <a href="#current-order">Xem lại đơn ↑</a>
          </div>
          <span className="workstation-badge">🔥 best x{game.bestCombo}</span>
        </div>

        <nav className="craft-stations" aria-label="Các bước pha chế">
          {["Lắp ly", "Đường & đá", "Rót & lắc", "Giao khách"].map((label, index) => (
            <button key={label} type="button" aria-current={station === index ? "step" : undefined}
              onClick={() => setStation(index)} aria-controls="craft-station">
              <span>{index + 1}</span><b>{label}</b>
            </button>
          ))}
        </nav>

        <div className="craft-grid v6-craft-grid">
          <DrinkCup draft={game.draft} />

          <div className="craft-controls v6-craft-controls" id="craft-station">
            {station === 0 && (<section id="craft-station-0" aria-label="Lắp ly">
            <ControlGroup title="1. Chọn nền trà" icon="🫖">
              <div className="choice-grid drink-choices v2-drink-choices">
                {game.unlockedBaseIds.map((id) => {
                  const drink = DRINKS[id];
                  const selected = game.draft.base === id;
                  const freshness = game.freshness[drink.ingredient] ?? 100;
                  return (
                    <button
                      key={id}
                      className={`choice-card ${selected ? "selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() => onGame(updateDraft(game, { base: id as BaseId, sealed: false }))}
                    >
                      <span>{drink.emoji}</span>
                      <b>{drink.shortName}</b>
                      <small>Còn {game.inventory[drink.ingredient]} · {freshness}% tươi</small>
                    </button>
                  );
                })}
              </div>
            </ControlGroup>

            <div className="two-col-controls">
              <ControlGroup title="2. Size ly" icon="🥤">
                <div className="segmented">
                  {(["M", "L"] as const).map((size) => (
                    <button
                      key={size}
                      className={game.draft.size === size ? "selected" : ""}
                      aria-pressed={game.draft.size === size}
                      onClick={() => onGame(updateDraft(game, { size, sealed: false }))}
                    >
                      {size}<small>còn {game.inventory[size === "M" ? "cupsM" : "cupsL"]}</small>
                    </button>
                  ))}
                </div>
              </ControlGroup>

              <ControlGroup title="3. Topping · kéo thả" icon="🍮">
                <ToppingTray
                  unlockedIds={game.unlockedToppingIds}
                  selected={game.draft.topping}
                  onSelect={(id) => onGame(updateDraft(game, { topping: id as ToppingId, sealed: false }))}
                />
              </ControlGroup>
            </div>
            </section>)}

            {station === 1 && (<section id="craft-station-1" aria-label="Đường và đá">
            <ControlGroup title="4. Định lượng · giữ để rót" icon="🎚️">
              <div className="dosing-grid">
                <HoldDispenser
                  label="Đường"
                  icon="🍬"
                  value={game.draft.sugar}
                  target={order.sugar}
                  onChange={(value) => onGame(updateDraft(game, { sugar: value, sealed: false }))}
                />
                <HoldDispenser
                  label="Đá"
                  icon="🧊"
                  value={game.draft.ice}
                  target={order.ice}
                  onChange={(value) => onGame(updateDraft(game, { ice: value, sealed: false }))}
                />
              </div>
            </ControlGroup>
            </section>)}

            {station === 2 && (<section id="craft-station-2" aria-label="Rót và lắc">
            <ControlGroup title="5. Kỹ thuật tay · timing" icon="🪄">
              <div className="timing-grid">
                <CraftGauge
                  label="Rót"
                  icon="🫗"
                  value={game.draft.fill}
                  target={order.targetFill}
                  tolerance={5 + game.upgrades.brewer}
                  speed={62 - Math.min(15, game.upgrades.brewer * 3)}
                  helper="Bấm bắt đầu, canh kim vào vùng hồng rồi CHỐT."
                  onCommit={(value) => onGame(updateDraft(game, { fill: value, sealed: false }))}
                />
                <CraftGauge
                  label="Lắc"
                  icon="🌀"
                  value={game.draft.shake}
                  target={order.targetShake}
                  tolerance={5 + game.upgrades.shaker * 2}
                  speed={72 - Math.min(20, game.upgrades.shaker * 4)}
                  helper="Máy lắc cấp cao làm kim chậm hơn và vùng chuẩn rộng hơn."
                  onCommit={(value) => onGame(updateDraft(game, { shake: value, sealed: false }))}
                />
              </div>
            </ControlGroup>
            </section>)}

            {station === 3 && (<section id="craft-station-3" aria-label="Hoàn thiện và giao khách">
            <AdaptiveCraftHint order={order} draft={game.draft} />
            <RecipeChecklist order={order} draft={game.draft} />
            <CraftHotkeys
              enabled={station === 3}
              sealed={game.draft.sealed}
              onSeal={() => onGame(updateDraft(game, { sealed: true }))}
              onServe={serveDrink}
            />

            <div className="finish-actions">
              <button
                className={`seal-button ${game.draft.sealed ? "sealed" : ""}`}
                onClick={() => onGame(updateDraft(game, { sealed: !game.draft.sealed }))}
              >
                <span>{game.draft.sealed ? "🎀" : "🔘"}</span>
                {game.draft.sealed ? "Nắp đã chuẩn" : "Dập nắp ly"}
              </button>
              <button className="primary-button serve-button" onClick={serveDrink}>
                <span>💗</span> Giao cho {customerName}
              </button>
            </div>
            </section>)}
            <div className="station-pagination">
              <button type="button" disabled={station === 0} onClick={() => setStation(station - 1)}>← Quay lại</button>
              <span>Bước {station + 1} / 4</span>
              {station < 3 && <button type="button" className="station-next" onClick={() => setStation(station + 1)}>
                {station === 2 ? "Kiểm tra ly →" : "Bước tiếp →"}
              </button>}
            </div>
          </div>
        </div>
      </div>
  );
}

function ControlGroup({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <div className="control-group v6-control-drawer">
      <h4><span>{icon}</span>{title}</h4>
      {children}
    </div>
  );
}
