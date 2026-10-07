import { useEffect, useRef, useState } from "react";
import {
  deliveryFor,
  PLACES,
  type Place,
  type Position,
} from "../game/service";
import { getCustomer } from "../game/engine";
import type { GameState, Screen } from "../game/types";
import type { StreetRuntime } from "../scene/runtime";

interface Props {
  game: GameState;
  screen: Screen;
  station: number;
  carrying: boolean;
  onPosition: (p: Position) => void;
  position: Position;
  onDeliver: () => void;
}
export function StreetWorld(props: Props) {
  const container = useRef<HTMLDivElement>(null),
    runtime = useRef<StreetRuntime | null>(null),
    latest = useRef(props);
  latest.current = props;
  const [status, setStatus] = useState("loading"),
    [overview, setOverview] = useState(false);
  const [fallbackPlace, setFallbackPlace] = useState<Place>("counter");
  useEffect(() => {
    let cancelled = false;
    import("../scene/runtime")
      .then(({ StreetRuntime }) => {
        if (cancelled || !container.current) return;
        try {
          runtime.current = new StreetRuntime(
            container.current,
            latest.current,
            (p) => latest.current.onPosition(p),
            () => setStatus("fallback"),
          );
          setStatus("ready");
        } catch {
          setStatus("fallback");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("fallback");
      });
    return () => {
      cancelled = true;
      runtime.current?.dispose();
      runtime.current = null;
    };
  }, []);
  useEffect(() => {
    runtime.current?.update(props);
  }, [props]);
  const go = (place: Place) => {
    if (runtime.current && status === "ready") runtime.current.go(place);
    else {
      setFallbackPlace(place);
      props.onPosition(PLACES[place]);
    }
  };
  const order = props.game.currentOrder,
    location = order ? deliveryFor(order) : null;
  const near = location
    ? Math.hypot(
        props.position.x - PLACES[location].x,
        props.position.z - PLACES[location].z,
      ) <= 1.15
    : false;
  return (
    <section className="street-world" aria-label="Tiệm trà và khu phố">
      <div
        className="world-viewport"
        ref={container}
        data-renderer={status}
        onKeyDownCapture={(event) => {
          if (
            [
              "w",
              "a",
              "s",
              "d",
              "arrowup",
              "arrowdown",
              "arrowleft",
              "arrowright",
            ].includes(event.key.toLowerCase())
          )
            setOverview(false);
        }}
      >
        {status !== "ready" && (
          <div className="world-fallback">
            <span>TIỆM TRÀ • PHỐ NHỎ</span>
            <h2>
              {status === "loading" ? "Đang mở cửa tiệm…" : "Đi quanh tiệm"}
            </h2>
            <p>
              {status === "loading"
                ? "Dựng quầy, bàn ghế và khách trong xóm."
                : `Thiết bị chưa mở được đồ họa 3D. Bạn vẫn pha chế và giao tại ${PLACES[fallbackPlace].label.toLowerCase()} bằng các nút địa điểm.`}
            </p>
          </div>
        )}
      </div>
      <div className="world-heading">
        <span className="live-dot" />
        <b>
          {props.game.phase === "open"
            ? "ĐANG ĐÓN KHÁCH"
            : props.game.phase === "prep"
              ? "TRƯỚC GIỜ MỞ CỬA"
              : "SAU MỘT CA BÁN"}
        </b>
        <small>Hẻm nhỏ · ngày {props.game.day}</small>
      </div>
      {props.screen === "shop" && (
        <>
          <div className="view-controls">
            <button
              disabled={status !== "ready"}
              aria-pressed={overview}
              onClick={() => {
                const next = !overview;
                setOverview(next);
                if (runtime.current) runtime.current.overview = next;
              }}
            >
              {overview ? "Đứng tại quầy" : "Nhìn toàn tiệm"}
            </button>
          </div>
          {order && (
            <div
              className={`delivery-tag ${props.carrying ? "carrying" : ""}`}
              role="status"
            >
              <small>
                {location === "counter"
                  ? "MANG ĐI · GIAO TẠI QUẦY"
                  : `DÙNG TẠI TIỆM · ${PLACES[location!].label.toUpperCase()}`}
              </small>
              <b>{getCustomer(order.customerId).name}</b>
              <p>
                {props.carrying
                  ? near
                    ? "Đã đến đúng chỗ. Giao ly cho khách nhé."
                    : "Ly đã trên tay. Mang đến đúng vị trí của khách."
                  : getCustomer(order.customerId).greeting}
              </p>
              {props.carrying && (
                <button
                  className="primary-button"
                  disabled={!near}
                  onClick={props.onDeliver}
                >
                  Giao ly cho {getCustomer(order.customerId).name}
                </button>
              )}
            </div>
          )}
          <div className="walk-ui">
            <div className="place-buttons" aria-label="Đi đến địa điểm">
              {(
                Object.entries(PLACES) as [Place, (typeof PLACES)[Place]][]
              ).map(([id, place]) => (
                <button
                  key={id}
                  className={location === id ? "destination" : ""}
                  onClick={() => go(id)}
                >
                  <span>
                    {id === "counter"
                      ? "▰"
                      : id === "door"
                        ? "↗"
                        : id.slice(-1).padStart(2, "0")}
                  </span>
                  {place.label}
                  {location === id && <i>Khách chờ</i>}
                </button>
              ))}
            </div>
            <div className="movement-row">
              <small>
                {overview
                  ? "Chạm sàn để đi · kéo để đổi hướng nhìn"
                  : "WASD / ↑↓←→ để đi · kéo để nhìn"}
              </small>
              <div className="walk-pad" aria-label="Đi bộ bằng nút">
                {[
                  ["a", "←", "Đi sang trái"],
                  ["w", "↑", "Đi tới"],
                  ["s", "↓", "Lùi lại"],
                  ["d", "→", "Đi sang phải"],
                ].map(([key, glyph, label]) => (
                  <button
                    key={key}
                    aria-label={label}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      runtime.current?.move(key, true);
                      setOverview(false);
                    }}
                    onPointerUp={() => runtime.current?.move(key, false)}
                    onPointerCancel={() => runtime.current?.move(key, false)}
                    onLostPointerCapture={() =>
                      runtime.current?.move(key, false)
                    }
                    onBlur={() => runtime.current?.move(key, false)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        runtime.current?.move(key, true);
                        setOverview(false);
                      }
                    }}
                    onKeyUp={() => runtime.current?.move(key, false)}
                  >
                    {glyph}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
