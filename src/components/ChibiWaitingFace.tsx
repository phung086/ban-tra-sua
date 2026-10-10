import type { CustomerMood } from "../game/types";

/** Visual expression labels for the waiting customer; renderer-independent. */
export const WAITING_FACE: Record<CustomerMood, string> = {
  delighted: "rạng rỡ",
  happy: "vui vẻ",
  neutral: "bình thản",
  restless: "sốt ruột",
  upset: "khó chịu",
};
