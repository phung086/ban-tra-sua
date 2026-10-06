import type { CSSProperties } from "react";
import type { Customer } from "../game/types";

interface Props {
  customer: Customer;
  talking?: boolean;
}

export function ChibiCustomer({ customer, talking = false }: Props) {
  const style = {
    "--hair": customer.hair,
    "--shirt": customer.shirt,
    "--skin": customer.skin,
  } as CSSProperties;

  return (
    <div className={`chibi ${talking ? "is-talking" : ""}`} style={style} aria-label={`Khách hàng ${customer.name}`}>
      <div className="chibi-shadow" />
      <div className="chibi-body">
        <div className="chibi-arm chibi-arm-left" />
        <div className="chibi-shirt">
          <span className="chibi-shirt-heart">♥</span>
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
      </div>
      <div className="chibi-name">{customer.name}</div>
    </div>
  );
}
