import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Customer, CustomerMood } from "../game/types";
export function ChibiPortrait({
  customer,
  className = "",
  mood,
}: {
  customer: Customer;
  className?: string;
  mood?: CustomerMood;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const element = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    const load = () =>
      import("../scene/runtime")
        .then(({ portrait }) => {
          if (!cancelled) {
            try {
              setUrl(portrait(customer.id));
            } catch {
              /* Text initials remain readable without WebGL. */
            }
          }
        })
        .catch(() => {});
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        void load();
      },
      { rootMargin: "80px" },
    );
    if (element.current) observer.observe(element.current);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [customer.id]);
  return (
    <span
      ref={element}
      data-mood={mood}
      className={`neighbor-portrait chibi-polished ${url ? "has-rendered-portrait" : "has-chibi-fallback"} ${className}`}
      style={{
        "--chibi-hair": customer.hair,
        "--chibi-shirt": customer.shirt,
        "--chibi-skin": customer.skin,
      } as CSSProperties}
      aria-hidden="true"
    >
      {url ? <img src={url} alt="" /> : (
        <span className="chibi-fallback">
          <span className="chibi-fallback-shoe is-left" />
          <span className="chibi-fallback-shoe is-right" />
          <span className="chibi-fallback-shirt" />
          <span className="chibi-fallback-arm is-left" />
          <span className="chibi-fallback-arm is-right" />
          <span className="chibi-fallback-hair" />
          <span className="chibi-fallback-face">
            <span className="chibi-fallback-brows" />
            <span className="chibi-fallback-blush" />
            <span className="chibi-fallback-smile" />
          </span>
          <span className="chibi-fallback-fringe" />
        </span>
      )}
    </span>
  );
}
export function ChibiCustomer({
  customer,
  mood,
}: {
  customer: Customer;
  mood?: CustomerMood;
  ready?: boolean;
  celebrating?: boolean;
}) {
  return (
    <div className="neighbor-card">
      <ChibiPortrait customer={customer} mood={mood} />
      <b>{customer.name}</b>
    </div>
  );
}
