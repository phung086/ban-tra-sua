import { useState } from "react";
import { DECORATIONS } from "../game/content";
import { pulseFeedback } from "../game/feedback";
import type { DecorationId } from "../game/types";

interface Props {
  ownedIds: DecorationId[];
  equippedIds: DecorationId[];
  onToggle: (id: DecorationId) => void;
  onReorder: (ids: DecorationId[]) => void;
}

export function DecorPlanner({ ownedIds, equippedIds, onToggle, onReorder }: Props) {
  const [dragging, setDragging] = useState<DecorationId | null>(null);

  const move = (from: DecorationId, to: DecorationId) => {
    if (from === to) return;
    const next = [...equippedIds];
    const fromIndex = next.indexOf(from);
    const toIndex = next.indexOf(to);
    if (fromIndex < 0 || toIndex < 0) return;
    next.splice(fromIndex, 1);
    next.splice(toIndex, 0, from);
    onReorder(next);
    pulseFeedback("tap");
  };

  return (
    <div className="decor-planner">
      <div className="decor-stage" aria-label="Sơ đồ trang trí đang trưng">
        {Array.from({ length: 3 }).map((_, index) => {
          const id = equippedIds[index];
          const decor = id ? DECORATIONS.find((item) => item.id === id) : undefined;
          return (
            <div
              key={index}
              className={`decor-stage-slot ${decor ? "filled" : "empty"}`}
              onDragOver={(event) => {
                if (!decor) return;
                event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const from = event.dataTransfer.getData("text/plain") as DecorationId;
                if (decor) move(from, decor.id);
              }}
            >
              {decor ? (
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", decor.id);
                    setDragging(decor.id);
                  }}
                  onDragEnd={() => setDragging(null)}
                  className={dragging === decor.id ? "dragging" : ""}
                  title="Kéo để đổi vị trí"
                >
                  <span>{decor.emoji}</span>
                  <b>{decor.name}</b>
                  <small>Vị trí {index + 1}</small>
                </button>
              ) : (
                <div>
                  <span>＋</span>
                  <small>Ô trống {index + 1}</small>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="decor-owned-strip">
        {ownedIds.length === 0 ? (
          <p>Chưa sở hữu decor. Mua một món bên dưới để bắt đầu trang trí.</p>
        ) : (
          ownedIds.map((id) => {
            const decor = DECORATIONS.find((item) => item.id === id);
            if (!decor) return null;
            const equipped = equippedIds.includes(id);
            return (
              <button
                type="button"
                key={id}
                className={equipped ? "equipped" : ""}
                onClick={() => onToggle(id)}
              >
                <span>{decor.emoji}</span>
                <b>{decor.name}</b>
                <small>{equipped ? "Đang trưng" : "Đặt vào tiệm"}</small>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
