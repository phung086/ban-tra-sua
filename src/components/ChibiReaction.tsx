import type { Customer, CustomerMood } from "../game/types";
import { ChibiCustomer } from "./ChibiCustomer";

const expression: Record<CustomerMood, { emoji: string; label: string }> = {
  delighted: { emoji: "🥰", label: "rất vui" },
  happy: { emoji: "😊", label: "hài lòng" },
  neutral: { emoji: "🙂", label: "bình thường" },
  restless: { emoji: "😕", label: "sốt ruột" },
  upset: { emoji: "😟", label: "thất vọng" },
};

/** CSS-only emotion overlay on the existing licensed/in-repo portrait. */
export function ChibiReaction({
  customer, mood, celebrating,
}: { customer: Customer; mood: CustomerMood; celebrating: boolean }) {
  return (
    <div className={`chibi-reaction ${celebrating ? "is-celebrating" : ""}`}>
      <ChibiCustomer customer={customer} />
      <span className="chibi-reaction-expression" role="img" aria-label={expression[mood].label}>
        {expression[mood].emoji}
      </span>
    </div>
  );
}
