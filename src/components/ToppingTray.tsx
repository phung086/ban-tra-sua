import { useState } from "react";
import { TOPPINGS } from "../game/content";
import { pulseFeedback } from "../game/feedback";
import type { ToppingId } from "../game/types";

interface Props {
  unlockedIds: ToppingId[];
  selected: ToppingId;
  onSelect: (id: ToppingId) => void;
}

export function ToppingTray({ unlockedIds, selected, onSelect }: Props) {
  const [dragging, setDragging] = useState<ToppingId | null>(null);
  const [overCup, setOverCup] = useState(false);

  const choose = (id: ToppingId) => {
    onSelect(id);
    pulseFeedback("tap");
  };

  return (
    <div className="topping-tray">
      <div className="topping-items" aria-label="Khay topping">
        {unlockedIds.map((id) => {
          const topping = TOPPINGS[id];
          return (
            <button
              type="button"
              key={id}
              className={`topping-chip ${selected === id ? "selected" : ""} ${dragging === id ? "dragging" : ""}`}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "copy";
                event.dataTransfer.setData("text/plain", id);
                setDragging(id);
              }}
              onDragEnd={() => {
                setDragging(null);
                setOverCup(false);
              }}
              onClick={() => choose(id)}
              aria-pressed={selected === id}
            >
              <span>{topping.emoji}</span>
              <b>{topping.name}</b>
            </button>
          );
        })}
      </div>

      <div
        className={`topping-drop-cup ${overCup ? "is-over" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setOverCup(true);
        }}
        onDragLeave={() => setOverCup(false)}
        onDrop={(event) => {
          event.preventDefault();
          const id = event.dataTransfer.getData("text/plain") as ToppingId;
          if (unlockedIds.includes(id)) choose(id);
          setDragging(null);
          setOverCup(false);
        }}
      >
        <div className="mini-cup">
          <span>{TOPPINGS[selected].emoji}</span>
        </div>
        <div>
          <b>{TOPPINGS[selected].name}</b>
          <small>{selected === "none" ? "Ly chưa có topping" : "Đã thêm vào ly"}</small>
        </div>
        <em>Kéo topping vào ly hoặc chạm để chọn</em>
      </div>
    </div>
  );
}
