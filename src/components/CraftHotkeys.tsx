import { useEffect } from "react";

interface Props {
  enabled: boolean;
  sealed: boolean;
  onSeal: () => void;
  onServe: () => void;
}

function isTypingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName.toLowerCase();
  return tag === "input" || tag === "select" || tag === "textarea" || element.isContentEditable;
}

export function CraftHotkeys({ enabled, sealed, onSeal, onServe }: Props) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) return;

      if (event.key.toLowerCase() === "d") {
        event.preventDefault();
        onSeal();
      }

      if (event.key.toLowerCase() === "g") {
        event.preventDefault();
        onServe();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, onSeal, onServe]);

  if (!enabled) return null;

  return (
    <div className="craft-hotkeys" aria-label="Phím tắt quầy pha chế">
      <span><kbd>D</kbd> {sealed ? "Nắp đã dập" : "Dập nắp"}</span>
      <span><kbd>G</kbd> Giao khách</span>
      <small>Phím tắt tự bỏ qua khi bạn đang nhập/chọn form.</small>
    </div>
  );
}
