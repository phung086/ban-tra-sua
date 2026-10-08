import { useState } from "react";
import { getUiPreferences, updateUiPreferences } from "../game/preferences";

const STEPS = [
  { emoji: "↗", title: "Đứng quầy, đi quanh tiệm", text: "Kéo núm tròn theo hướng muốn đi, thả tay để dừng. Vuốt cảnh để xoay camera; các nút địa điểm giúp tự đi đến quầy hoặc bàn. Máy tính cũng dùng được WASD." },
  { emoji: "📌", title: "Đọc order", text: "Nhìn kỹ món, size, topping, đường, đá và hai mốc kỹ thuật trước khi pha." },
  { emoji: "🧋", title: "Lắp ly", text: "Chọn đúng nền trà, size và kéo topping vào ly hoặc chạm để chọn." },
  { emoji: "🍬", title: "Định lượng", text: "Giữ nút đường/đá rồi nhả gần đúng mốc order. Có thể reset và làm lại." },
  { emoji: "🪄", title: "Kỹ thuật", text: "Canh timing rót và lắc. Máy nâng cấp sẽ làm vùng thao tác dễ kiểm soát hơn." },
  { emoji: "🎀", title: "Hoàn thiện", text: "Kiểm tra ly, dập nắp rồi bê ly. Đi đến bàn của khách hoặc quầy mang đi để giao." },
  { emoji: "↗", title: "Làm quen với khu phố", text: "Trước hoặc sau ca bán, mở Khám phá khu phố. Đến gần hàng xóm, chọn Nói chuyện rồi chọn cách giúp. Giữ nút làm việc, quay lại báo tin để kết thúc câu chuyện." },
];

export function PlayCoach() {
  const [visible, setVisible] = useState(() => !getUiPreferences().coachCompleted);
  const [step, setStep] = useState(0);

  if (!visible) return null;
  const current = STEPS[step];

  const finish = () => {
    updateUiPreferences({ coachCompleted: true });
    setVisible(false);
  };

  return (
    <div className="play-coach-backdrop" role="dialog" aria-modal="true" aria-label="Hướng dẫn chơi">
      <div className="play-coach-card">
        <button className="coach-skip" type="button" onClick={finish}>Bỏ qua</button>
        <div className="coach-emoji">{current.emoji}</div>
        <span className="coach-step">BƯỚC {step + 1}/{STEPS.length}</span>
        <h2>{current.title}</h2>
        <p>{current.text}</p>
        <div className="coach-dots">
          {STEPS.map((_, index) => <i className={index === step ? "active" : ""} key={index} />)}
        </div>
        <div className="coach-actions">
          <button type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>← Trước</button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="primary" onClick={() => setStep((value) => value + 1)}>Tiếp →</button>
          ) : (
            <button type="button" className="primary" onClick={finish}>Vào quầy 🧋</button>
          )}
        </div>
      </div>
    </div>
  );
}
