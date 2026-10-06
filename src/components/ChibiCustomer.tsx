import type { CSSProperties } from "react";
import type { Customer } from "../game/types";

interface Props {
  customer: Customer;
  talking?: boolean;
}

const ACCESSORIES = ["🌸", "🎀", "⭐", "🍀", "🍓"];

export function ChibiCustomer({ customer, talking = false }: Props) {
  const style = {
    "--hair": customer.hair,
    "--shirt": customer.shirt,
    "--skin": customer.skin,
  } as CSSProperties;

  const seed = [...customer.id].reduce((total, char) => total + char.charCodeAt(0), 0);
  const accessory = ACCESSORIES[seed % ACCESSORIES.length];

  return (
    <div className={`chibi ${talking ? "is-talking" : ""}`} style={style} aria-label={`Khách hàng ${customer.name}`}>
      <div className="chibi-shadow" />
      <span className="chibi-sparkle s1">✦</span>
      <span className="chibi-sparkle s2">♡</span>

      <div className="chibi-body">
        <div className="chibi-arm chibi-arm-left" />
        <div className="chibi-shirt">
          <span className="chibi-apron-badge">♡</span>
        </div>
        <div className="chibi-arm chibi-arm-right" />
      </div>

      <div className="chibi-head">
        <div className="chibi-ear chibi-ear-left" />
        <div className="chibi-ear chibi-ear-right" />
        <div className="chibi-hair-back" />
        <div className="chibi-face">
          <div className="chibi-bangs">
            <span />
            <span />
            <span />
          </div>
          <div className="chibi-eyes">
            <i />
            <i />
          </div>
          <div className="chibi-cheeks">
            <i />
            <i />
          </div>
          <div className="chibi-mouth" />
        </div>
        <div className="chibi-hair-shine" />
        <div className="chibi-accessory">{accessory}</div>
      </div>

      <div className="chibi-name">{customer.name}</div>
    </div>
  );
}
