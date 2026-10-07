import { useEffect, useRef, useState } from "react";
import type { Customer, CustomerMood } from "../game/types";
export function ChibiPortrait({
  customer,
  className = "",
}: {
  customer: Customer;
  className?: string;
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
      className={`neighbor-portrait ${className}`}
      aria-hidden="true"
    >
      {url ? <img src={url} alt="" /> : customer.name.slice(0, 1)}
    </span>
  );
}
export function ChibiCustomer({
  customer,
}: {
  customer: Customer;
  mood?: CustomerMood;
  ready?: boolean;
  celebrating?: boolean;
}) {
  return (
    <div className="neighbor-card">
      <ChibiPortrait customer={customer} />
      <b>{customer.name}</b>
    </div>
  );
}
