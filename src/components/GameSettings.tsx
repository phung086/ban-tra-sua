import { useState } from "react";
import { getUiPreferences, updateUiPreferences } from "../game/preferences";

export function GameSettings() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(() => getUiPreferences());

  const toggle = (key: "sound" | "haptics" | "motion" | "oneHand" | "highContrast") => {
    setPrefs(updateUiPreferences({ [key]: !prefs[key] }));
  };

  return (
    <div className={`game-settings ${open ? "open" : ""}`}>
      <button className="settings-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        ⚙️
      </button>
      {open && (
        <div className="settings-popover">
          <span className="settings-eyebrow">TRẢI NGHIỆM</span>
          <h3>Cài đặt game</h3>
          <button type="button" onClick={() => toggle("sound")}><span>🔊 Âm thanh</span><b>{prefs.sound ? "ON" : "OFF"}</b></button>
          <button type="button" onClick={() => toggle("haptics")}><span>📳 Rung</span><b>{prefs.haptics ? "ON" : "OFF"}</b></button>
          <button type="button" onClick={() => toggle("motion")}><span>✨ Chuyển động</span><b>{prefs.motion ? "ON" : "OFF"}</b></button>
          <button type="button" onClick={() => toggle("oneHand")}><span>👍 Chế độ một tay</span><b>{prefs.oneHand ? "ON" : "OFF"}</b></button>
          <button type="button" onClick={() => toggle("highContrast")}><span>◐ Tương phản cao</span><b>{prefs.highContrast ? "ON" : "OFF"}</b></button>
          <small>Các lựa chọn này được lưu riêng, không ảnh hưởng save gameplay.</small>
        </div>
      )}
    </div>
  );
}
