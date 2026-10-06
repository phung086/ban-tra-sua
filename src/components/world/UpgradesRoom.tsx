import { useState } from "react";
import { DECORATIONS, RESEARCH, STAFF, UPGRADES } from "../../game/content";
import {
  buyDecoration,
  buyResearch,
  buyUpgrade,
  formatMoney,
  getUpgradeCost,
  hireStaff,
  setActiveStaff,
  toggleDecoration,
} from "../../game/engine";
import type {
  DecorationId,
  GameState,
  ResearchId,
  StaffId,
  UpgradeId,
} from "../../game/types";
import { DecorPlanner } from "../DecorPlanner";
import { RoomBackdrop } from "./RoomBackdrop";

type WorkshopMode = "equipment" | "staff" | "decor" | "research";

interface Props {
  game: GameState;
  onGame: (state: GameState) => void;
}

export function UpgradesRoom({ game, onGame }: Props) {
  const [mode, setMode] = useState<WorkshopMode>("equipment");

  return (
    <section className="v6-room v6-upgrades-room">
      <RoomBackdrop kind="upgrades">
        <div className="v6-room-title">
          <small>WORKSHOP · PEOPLE · DECOR · RESEARCH</small>
          <h2>Xưởng sau tiệm</h2>
          <p>Chọn khu trên bàn để nâng cấp đúng thứ đang cần cho ca kế tiếp.</p>
        </div>

        <div className="v6-workshop-tabs">
          {([
            ["equipment", "⚙️", "Máy móc"],
            ["staff", "👩🏻‍🍳", "Nhân sự"],
            ["decor", "🌷", "Decor"],
            ["research", "🧠", "Research"],
          ] as const).map(([id, icon, label]) => (
            <button key={id} className={mode === id ? "active" : ""} onClick={() => setMode(id)}>
              <span>{icon}</span><b>{label}</b>
            </button>
          ))}
        </div>

        {mode === "equipment" && (
          <div className="v6-workbench v6-equipment-bench">
            {UPGRADES.map((upgrade, index) => {
              const level = game.upgrades[upgrade.id];
              const cost = getUpgradeCost(game, upgrade.id);
              const maxed = level >= upgrade.maxLevel;
              return (
                <article className="v6-machine" key={upgrade.id} style={{ "--machine-index": index } as React.CSSProperties}>
                  <div className="v6-machine-body">
                    <span>{upgrade.emoji}</span>
                    <i />
                    <i />
                  </div>
                  <div className="v6-machine-label">
                    <small>Lv.{level}/{upgrade.maxLevel}</small>
                    <b>{upgrade.name}</b>
                    <p>{upgrade.description}</p>
                  </div>
                  <div className="v6-machine-pips">
                    {Array.from({ length: upgrade.maxLevel }).map((_, dot) => <i className={dot < level ? "on" : ""} key={dot} />)}
                  </div>
                  <button
                    disabled={maxed || game.cash < cost}
                    onClick={() => onGame(buyUpgrade(game, upgrade.id as UpgradeId))}
                  >
                    {maxed ? "MAX" : formatMoney(cost)}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {mode === "staff" && (
          <div className="v6-workbench v6-staff-floor">
            {STAFF.map((staff, index) => {
              const hired = game.hiredStaff.includes(staff.id);
              const active = game.activeStaff === staff.id;
              return (
                <article className={`v6-staff-stand ${active ? "active" : ""}`} key={staff.id}>
                  <div className="v6-staff-character">
                    <span>{staff.emoji}</span>
                    <i className="v6-staff-shadow" />
                    {active && <em>ON SHIFT</em>}
                  </div>
                  <div>
                    <small>{staff.role}</small>
                    <h3>{staff.name}</h3>
                    <p>{staff.description}</p>
                  </div>
                  {hired ? (
                    <button onClick={() => onGame(setActiveStaff(game, active ? null : staff.id as StaffId))}>
                      {active ? "Cho nghỉ ca" : "Cho trực"}
                    </button>
                  ) : (
                    <button disabled={game.cash < staff.hireCost} onClick={() => onGame(hireStaff(game, staff.id as StaffId))}>
                      Tuyển · {formatMoney(staff.hireCost)}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {mode === "decor" && (
          <div className="v6-workbench v6-decor-workbench">
            <DecorPlanner
              ownedIds={game.ownedDecorations}
              equippedIds={game.equippedDecorations}
              onToggle={(id) => onGame(toggleDecoration(game, id))}
              onReorder={(ids) => onGame({ ...game, equippedDecorations: ids })}
            />
            <div className="v6-decor-shelf">
              {DECORATIONS.map((decoration) => {
                const owned = game.ownedDecorations.includes(decoration.id);
                const equipped = game.equippedDecorations.includes(decoration.id);
                const locked = decoration.unlockLevel > game.level;
                return (
                  <article className={`v6-decor-object ${equipped ? "equipped" : ""}`} key={decoration.id}>
                    <span>{decoration.emoji}</span>
                    <div><b>{decoration.name}</b><small>{locked ? `Mở Lv.${decoration.unlockLevel}` : decoration.description}</small></div>
                    {owned ? (
                      <button onClick={() => onGame(toggleDecoration(game, decoration.id as DecorationId))}>
                        {equipped ? "Cất" : "Trưng"}
                      </button>
                    ) : (
                      <button
                        disabled={locked || game.cash < decoration.cost}
                        onClick={() => onGame(buyDecoration(game, decoration.id as DecorationId))}
                      >
                        {locked ? "LOCK" : formatMoney(decoration.cost)}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {mode === "research" && (
          <div className="v6-workbench v6-blueprint-wall">
            <div className="v6-rp-meter"><span>RESEARCH POINT</span><b>{game.researchPoints} RP</b></div>
            {RESEARCH.map((research, index) => {
              const done = game.researchedIds.includes(research.id);
              const missing = research.prerequisiteIds.filter((id) => !game.researchedIds.includes(id));
              return (
                <article className={`v6-blueprint ${done ? "done" : ""}`} key={research.id} style={{ "--blueprint-index": index } as React.CSSProperties}>
                  <span>{research.emoji}</span>
                  <small>{research.category}</small>
                  <h3>{research.name}</h3>
                  <p>{research.description}</p>
                  {missing.length > 0 && <em>Cần research trước</em>}
                  <button
                    disabled={done || missing.length > 0 || game.researchPoints < research.cost}
                    onClick={() => onGame(buyResearch(game, research.id as ResearchId))}
                  >
                    {done ? "ĐÃ XONG" : `${research.cost} RP`}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        <div className="v6-workshop-cash"><span>🪙</span><b>{formatMoney(game.cash)}</b></div>
      </RoomBackdrop>
    </section>
  );
}
