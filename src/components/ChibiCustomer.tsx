import { useEffect, useRef, type CSSProperties } from "react";
import type { Customer, CustomerMood } from "../game/types";

// Explicit atlas order keeps faces stable when the content catalog changes.
const SPRITES = ["miu", "bo", "nana", "sunny", "chi", "khanh", "lyly", "duc"];

export function ChibiPortrait({ customer, className = "" }: { customer: Customer; className?: string }) {
  const index = Math.max(0, SPRITES.indexOf(customer.id));
  const style = { backgroundPosition: `${(index % 4) * 100 / 3}% ${Math.floor(index / 4) * 100}%` } as CSSProperties;
  return <span className={`chibi-portrait ${className}`} style={style} aria-hidden="true" />;
}

interface Props {
  customer: Customer;
  mood?: CustomerMood;
  ready?: boolean;
  celebrating?: boolean;
}

export function ChibiCustomer({ customer, mood = "happy", ready = false, celebrating = false }: Props) {
  const guest = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = guest.current;
    if (!element) return;
    let inView = true;
    const update = () => { element.dataset.animate = String(inView && !document.hidden); };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    update();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);
  return (
    <div ref={guest} className={`chibi-guest guest-${mood} ${ready ? "guest-ready" : ""} ${celebrating ? "guest-celebrating" : ""}`} role="img" aria-label={`Khách hàng ${customer.name}`}>
      <div className="guest-arrival"><ChibiPortrait customer={customer} /></div>
      <span className="guest-affection" aria-hidden="true">{mood === "restless" || mood === "upset" ? "…" : "♡"}</span>
      <span className="guest-name">{customer.name}</span>
    </div>
  );
}
