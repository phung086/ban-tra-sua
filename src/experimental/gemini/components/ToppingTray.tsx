import { useState } from 'react';
import { TOPPINGS } from '../../../game/content';
import type { ToppingId } from '../../../game/types';
import { pulseFeedback } from '../../../game/feedback';

interface Props {
  unlockedIds: ToppingId[];
  selected: ToppingId;
  onSelect: (id: ToppingId) => void;
}

export function ToppingTray({ unlockedIds, selected, onSelect }: Props) {
  const [dragging, setDragging] = useState<ToppingId | null>(null);
  const [stagedScoop, setStagedScoop] = useState<ToppingId | null>(null);
  const [overCup, setOverCup] = useState(false);
  const [justDropped, setJustDropped] = useState(false);

  const choose = (id: ToppingId) => {
    if (!unlockedIds.includes(id)) return;
    onSelect(id);
    setStagedScoop(null);
    setJustDropped(true);
    pulseFeedback('tap');
    setTimeout(() => setJustDropped(false), 360);
  };

  const handleCupTap = () => {
    if (stagedScoop && unlockedIds.includes(stagedScoop)) {
      choose(stagedScoop);
    }
  };

  const current = Object.values(TOPPINGS).find((t) => t.id === selected);
  const staged = stagedScoop ? Object.values(TOPPINGS).find((t) => t.id === stagedScoop) : null;

  return (
    <div className="topping-tray" role="region" aria-label="Khay múc topping">
      <div className="topping-items">
        {Object.values(TOPPINGS).filter((t) => unlockedIds.includes(t.id)).map((t) => {
          const active = selected === t.id;
          const scooped = stagedScoop === t.id;
          return (
            <button
              key={t.id}
              type="button"
              draggable
              aria-pressed={active}
              className={`topping-chip ${active ? 'active' : ''} ${
                dragging === t.id || scooped ? 'dragging' : ''
              }`}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', t.id);
                e.dataTransfer.effectAllowed = 'copy';
                setDragging(t.id);
                setStagedScoop(t.id);
              }}
              onDragEnd={() => {
                setDragging(null);
                setOverCup(false);
              }}
              onClick={() => {
                setStagedScoop(t.id);
                choose(t.id);
              }}
            >
              <span className="topping-emoji" aria-hidden="true">
                {t.emoji}
              </span>
              <span className="topping-name">{t.name}</span>
              {active && <span className="topping-badge">Đã múc</span>}
            </button>
          );
        })}
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={
          current
            ? `Ly đang có ${current.name}. Chạm hoặc thả để đổi topping`
            : 'Khu vực thả topping vào ly'
        }
        className={`topping-drop-cup ${overCup ? 'over' : ''} ${
          justDropped ? 'dropped-bounce' : ''
        }`}
        onClick={handleCupTap}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCupTap();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          setOverCup(true);
        }}
        onDragLeave={() => setOverCup(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOverCup(false);
          const id = e.dataTransfer.getData('text/plain') as ToppingId;
          if (unlockedIds.includes(id)) {
            choose(id);
          }
        }}
      >
        <div className="mini-cup" aria-hidden="true">
          <span>{current?.emoji ?? staged?.emoji ?? '🫧'}</span>
        </div>
        <div className="topping-cup-copy">
          <strong>
            {current ? `Đã thêm: ${current.name}` : 'Ly chưa có topping'}
          </strong>
          <span>
            {staged && staged.id !== selected
              ? `Đang cầm muỗng ${staged.name} — chạm vào ly để thả!`
              : 'Chạm chọn nhanh hoặc kéo-thả muỗng topping vào ly'}
          </span>
        </div>
      </div>
    </div>
  );
}
