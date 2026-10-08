import { GameIcon } from "./GameIcon";
import { useEffect,useState } from "react";
import { getUiPreferences, updateUiPreferences } from "../game/preferences";

export function GameSettings() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(() => getUiPreferences());
  const [musicState,setMusicState]=useState('waiting');
  useEffect(()=>{const sync=()=>setMusicState(document.documentElement.dataset.music??'waiting');sync();window.addEventListener('tea-audio-state',sync);return()=>window.removeEventListener('tea-audio-state',sync);},[]);

  const toggle = (key: "sound" | "music" | "haptics" | "motion" | "oneHand" | "highContrast" | "focusMode") => {
    setPrefs(updateUiPreferences({ [key]: !prefs[key] }));
  };

  return (
    <div className={`game-settings ${open ? "open" : ""}`}>
      <button className="settings-trigger" aria-label="Cài đặt game" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}
        onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
        <GameIcon name="settings" />
      </button>
      {open && (
        <div className="settings-popover" onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
          <h3>Cài đặt game</h3>
          <div className="music-settings">
            <button type="button" aria-pressed={prefs.music} onClick={()=>toggle('music')}><span><GameIcon name="volume"/>Nhạc nền</span><b>{prefs.music?'Bật':'Tắt'}</b></button>
            <label>Âm lượng nhạc <output>{Math.round(prefs.musicVolume*100)}%</output><input aria-label="Âm lượng nhạc" type="range" min="0" max="100" step="5" value={Math.round(prefs.musicVolume*100)} disabled={!prefs.music} onChange={e=>setPrefs(updateUiPreferences({musicVolume:Number(e.target.value)/100}))}/></label>
            <small role="status">{!prefs.music?'Nhạc đã tắt':musicState==='playing'?'Đang nghe: Một sáng Phố Nhỏ':prefs.musicVolume===0?'Âm lượng đang ở 0%':'Chạm vào game để nghe nhạc nhẹ nhàng.'}</small>
          </div>
          {([['sound','Hiệu ứng âm thanh','volume'],['haptics','Rung','phone'],['motion','Chuyển động','leaf'],['oneHand','Chế độ một tay','person'],['highContrast','Tương phản cao','contrast'],['focusMode','Tập trung ở quầy','focus']] as const).map(([key,label,icon])=><button key={key} type="button" aria-pressed={prefs[key]} onClick={()=>toggle(key)}><span><GameIcon name={icon}/>{label}</span><b>{prefs[key]?'Bật':'Tắt'}</b></button>)}
          <label className="graphics-choice">Chất lượng hình ảnh<select value={prefs.graphics} onChange={e=>setPrefs(updateUiPreferences({graphics:e.target.value as typeof prefs.graphics}))}><option value="auto">Tự điều chỉnh</option><option value="light">Nhẹ · tiết kiệm pin</option><option value="balanced">Cân bằng</option><option value="high">Chi tiết cao</option></select><small>Tự điều chỉnh giảm độ phân giải khi khung hình chậm.</small></label>
          <details className="graphics-advanced"><summary>Tương thích đồ họa</summary><label>Bộ dựng hình<select value={prefs.renderEngine} onChange={e=>setPrefs(updateUiPreferences({renderEngine:e.target.value as typeof prefs.renderEngine}))}><option value="three">Three.js</option><option value="babylon">Babylon.js</option></select></label><p>Đổi bộ dựng hình nếu cảnh hiển thị không phù hợp với thiết bị. Vị trí và tiến trình chơi được giữ lại.</p></details>
          <small>Các lựa chọn này được lưu riêng, không ảnh hưởng save gameplay.</small>
        </div>
      )}
    </div>
  );
}
