import { useEffect, useRef, useState } from "react";
import { pulseFeedback } from "../game/feedback";
import { advancePour, pourVerdict, type PourSpeed } from "../game/pourControl";
import "./PourControl.css";

interface Props {
  value: number;
  target: number;
  brewerLevel: number;
  onCommit: (value: number) => void;
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

/** The amount is persisted in the existing DrinkDraft.fill; no new save fields. */
export function PourControl({ value, target, brewerLevel, onCommit }: Props) {
  const [amount, setAmount] = useState(() => clampPercent(value));
  const [speed, setSpeed] = useState<PourSpeed>("careful");
  const [holding, setHolding] = useState(false);
  const [assisting, setAssisting] = useState(false);
  const amountRef = useRef(clampPercent(value));
  const holdingRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const previousFrameRef = useRef<number | null>(null);
  const assistRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  useEffect(() => {
    if (holdingRef.current || assistRef.current !== null) return;
    amountRef.current = clampPercent(value);
    setAmount(amountRef.current);
  }, [value]);

  const stop = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    const poured = Math.round(amountRef.current);
    onCommitRef.current(poured);
    pulseFeedback(pourVerdict(poured, target, 5 + brewerLevel) === "perfect" ? "good" : "tap");
  };

  useEffect(() => {
    if (!holding) return;
    const tick = (now: number) => {
      const previous = previousFrameRef.current ?? now;
      previousFrameRef.current = now;
      amountRef.current = advancePour(amountRef.current, now - previous, speed, brewerLevel);
      setAmount(amountRef.current);
      if (amountRef.current >= 100) {
        holdingRef.current = false;
        setHolding(false);
        onCommitRef.current(100);
        pulseFeedback("tap");
      } else {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    previousFrameRef.current = null;
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      previousFrameRef.current = null;
    };
  }, [holding, speed, brewerLevel]);

  useEffect(() => {
    const onPause = () => {
      if (document.hidden || !document.hasFocus()) {
        if (holdingRef.current) {
          holdingRef.current = false;
          setHolding(false);
          onCommitRef.current(Math.round(amountRef.current));
        }
        if (assistRef.current !== null) {
          clearTimeout(assistRef.current);
          assistRef.current = null;
          setAssisting(false);
        }
      }
    };
    document.addEventListener("visibilitychange", onPause);
    window.addEventListener("blur", onPause);
    return () => {
      document.removeEventListener("visibilitychange", onPause);
      window.removeEventListener("blur", onPause);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      if (assistRef.current !== null) clearTimeout(assistRef.current);
    };
  }, []);

  const begin = () => {
    if (holdingRef.current || assistRef.current !== null || amountRef.current >= 100) return;
    holdingRef.current = true;
    setHolding(true);
    pulseFeedback("tap");
  };
  const autoPour = () => {
    if (holdingRef.current || assistRef.current !== null || amountRef.current > 0) return;
    setAssisting(true);
    assistRef.current = setTimeout(() => {
      assistRef.current = null;
      const poured = Math.round(clampPercent(target));
      amountRef.current = poured;
      setAmount(poured);
      setAssisting(false);
      onCommitRef.current(poured);
      pulseFeedback("good");
    }, 4000);
  };
  const cancelAuto = () => {
    if (assistRef.current === null) return;
    clearTimeout(assistRef.current);
    assistRef.current = null;
    setAssisting(false);
  };

  const grade = pourVerdict(amount, target, 5 + brewerLevel);
  const hasPoured = amountRef.current > 0;
  return (
    <section className="manual-pour" aria-label="Rót trà thủ công">
      <div className="manual-pour-heading">
        <strong>🫗 Rót trà vào ly</strong>
        <span aria-live="polite">{Math.round(amount)}% / cần {target}%</span>
      </div>
      <div className={`manual-pour-vessel ${holding ? "pouring" : ""}`} role="progressbar"
        aria-label="Lượng trà trong ly" aria-valuemin={0} aria-valuemax={100}
        aria-valuenow={Math.round(amount)}>
        <div className="manual-pour-stream" aria-hidden="true" />
        <div className="manual-pour-liquid" style={{ height: `${amount}%` }} />
        <div className="manual-pour-target" style={{ bottom: `${clampPercent(target)}%` }}>
          <span>Mốc {target}%</span>
        </div>
      </div>
      <p className={`manual-pour-verdict grade-${grade}`} aria-live="polite">
        {assisting ? "Đang rót tự động · còn khoảng 4 giây" :
          !hasPoured ? "Giữ nút để bắt đầu, thả khi đạt vạch mục tiêu." :
          grade === "perfect" ? "Đúng mốc! Chuyển sang lắc hoặc giao ly." :
          amount < target ? "Còn thiếu trà. Có thể giữ để rót tiếp." :
          "Đã quá mốc: chất lượng ly sẽ giảm nếu giao ngay."}
      </p>
      <p className="manual-pour-tradeoff">Rót kỹ dễ canh; rót nhanh tiết kiệm thời gian nhưng dễ vượt mốc. Không thể lấy trà đã rót ra khỏi ly.</p>
      <div className="manual-pour-speeds" role="group" aria-label="Chọn tốc độ rót">
        <button type="button" aria-pressed={speed === "careful"} disabled={holding || assisting}
          onClick={() => setSpeed("careful")}>Rót kỹ · dễ canh</button>
        <button type="button" aria-pressed={speed === "quick"} disabled={holding || assisting}
          onClick={() => setSpeed("quick")}>Rót nhanh · tiết kiệm giờ</button>
      </div>
      <button className="manual-pour-hold" type="button" disabled={assisting || amount >= 100}
        onPointerDown={event => { if (event.pointerType !== "mouse" || event.button === 0) {
          event.currentTarget.setPointerCapture(event.pointerId); begin();
        } }}
        onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onBlur={stop}
        onKeyDown={event => { if (!event.repeat && (event.key === " " || event.key === "Enter")) {
          event.preventDefault(); begin();
        } }}
        onKeyUp={event => { if (event.key === " " || event.key === "Enter") {
          event.preventDefault(); stop();
        } }}>
        {holding ? "🫗 ĐANG RÓT · THẢ ĐỂ DỪNG" : hasPoured ? "🫗 GIỮ ĐỂ RÓT TIẾP" : "🫗 GIỮ ĐỂ RÓT"}
      </button>
      <button type="button" className="manual-pour-assist"
        disabled={holding || (hasPoured && !assisting)}
        onClick={assisting ? cancelAuto : autoPour}>
        {assisting ? "Hủy rót tự động" : hasPoured ? "Đã rót thủ công" : "Rót tự động đúng mốc · 4 giây"}
      </button>
    </section>
  );
}
