import { useState } from "react";
import type { CSSProperties } from "react";
import { ACHIEVEMENTS, CUSTOMERS, DRINKS, TOPPINGS } from "../../game/content";
import { claimQuest, formatMoney, getRelationshipTier } from "../../game/engine";
import type { GameState } from "../../game/types";
import { RoomBackdrop } from "./RoomBackdrop";
import { ChibiPortrait } from "../ChibiCustomer";

type BoardMode = "quests" | "achievements" | "collection" | "relations";

interface Props {
  game: GameState;
  onGame: (state: GameState) => void;
}

export function GoalsRoom({ game, onGame }: Props) {
  const [mode, setMode] = useState<BoardMode>("quests");

  return (
    <section className="v6-room v6-goals-room">
      <RoomBackdrop kind="goals">
        <div className="v6-room-title">
          <small>BULLETIN BOARD · DAY {game.day}</small>
          <h2>Bảng ghim sau quầy</h2>
          <p>Mọi mục tiêu, thành tựu và khách quen đều nằm trên một bảng vật lý trong tiệm.</p>
        </div>

        <div className="v6-board-tabs">
          {([
            ["quests", "📌", "Hôm nay"],
            ["achievements", "🏆", "Thành tựu"],
            ["collection", "🍹", "Bộ sưu tập"],
            ["relations", "💞", "Khách quen"],
          ] as const).map(([id, icon, label]) => (
            <button key={id} className={mode === id ? "active" : ""} onClick={() => setMode(id)}>
              <span>{icon}</span><b>{label}</b>
            </button>
          ))}
        </div>

        <div className={`v6-corkboard v6-corkboard-${mode}`}>
          {mode === "quests" && game.quests.map((quest, index) => {
            const done = quest.progress >= quest.target;
            const percent = Math.min(100, (quest.progress / quest.target) * 100);
            return (
              <article className={`v6-pinned-note ${done ? "done" : ""}`} key={quest.id} style={{ "--note-index": index } as CSSProperties}>
                <i className="v6-pin" />
                <small>DAILY #{index + 1}</small>
                <h3>{quest.title}</h3>
                <p>{quest.description}</p>
                <div className="v6-note-progress"><i style={{ width: `${percent}%` }} /></div>
                <b>{Math.min(quest.progress, quest.target)}/{quest.target}</b>
                <span>🪙 {formatMoney(quest.rewardCash)} · ✨ {quest.rewardXp} XP · 📱 {quest.rewardFans}</span>
                <button disabled={!done || quest.claimed} onClick={() => onGame(claimQuest(game, quest.id))}>
                  {quest.claimed ? "ĐÃ NHẬN ✓" : done ? "NHẬN THƯỞNG" : "ĐANG LÀM"}
                </button>
              </article>
            );
          })}

          {mode === "achievements" && ACHIEVEMENTS.map((achievement, index) => {
            const unlocked = game.achievementIds.includes(achievement.id);
            const value = achievement.metric === "fans" ? game.fans : game.stats[achievement.metric];
            const percent = Math.min(100, (value / achievement.threshold) * 100);
            return (
              <article className={`v6-polaroid ${unlocked ? "unlocked" : ""}`} key={achievement.id} style={{ "--note-index": index } as CSSProperties}>
                <span>{achievement.emoji}</span>
                <h3>{achievement.name}</h3>
                <p>{achievement.description}</p>
                <div><i style={{ width: `${percent}%` }} /></div>
                <small>{Math.min(value, achievement.threshold).toLocaleString("vi-VN")} / {achievement.threshold.toLocaleString("vi-VN")}</small>
              </article>
            );
          })}

          {mode === "collection" && (
            <div className="v6-collection-wall">
              <div>
                <h3>Món nước</h3>
                <div className="v6-bottle-row">
                  {Object.values(DRINKS).map((drink) => {
                    const unlocked = game.unlockedBaseIds.includes(drink.id);
                    return <span className={unlocked ? "" : "locked"} key={drink.id}><i>{unlocked ? drink.emoji : "🔒"}</i><b>{unlocked ? drink.shortName : `Lv.${drink.unlockLevel}`}</b></span>;
                  })}
                </div>
              </div>
              <div>
                <h3>Topping</h3>
                <div className="v6-bottle-row">
                  {Object.values(TOPPINGS).map((topping) => {
                    const unlocked = game.unlockedToppingIds.includes(topping.id);
                    return <span className={unlocked ? "" : "locked"} key={topping.id}><i>{unlocked ? topping.emoji : "🔒"}</i><b>{unlocked ? topping.name : `Lv.${topping.unlockLevel}`}</b></span>;
                  })}
                </div>
              </div>
            </div>
          )}

          {mode === "relations" && (
            <div className="v6-relations-string">
              {[...CUSTOMERS]
                .sort((a, b) => (game.customerBond[b.id] ?? 0) - (game.customerBond[a.id] ?? 0))
                .map((customer, index) => {
                  const bond = game.customerBond[customer.id] ?? 0;
                  const tier = getRelationshipTier(bond);
                  return (
                    <article className="v6-customer-photo" key={customer.id} style={{ "--note-index": index } as CSSProperties}>
                      <i />
                      <ChibiPortrait customer={customer} className="guest-album-portrait" />
                      <b>{customer.name}</b>
                      <small>{tier.emoji} {tier.label} · bond {bond}</small>
                      <p>{customer.archetype}</p>
                    </article>
                  );
                })}
            </div>
          )}
        </div>

        {game.storyLog.length > 0 && (
          <div className="v6-story-envelope">
            <span>💌</span>
            <div><small>STORY MOMENT</small><b>{game.storyLog[0].title}</b><p>{game.storyLog[0].text}</p></div>
          </div>
        )}
      </RoomBackdrop>
    </section>
  );
}
