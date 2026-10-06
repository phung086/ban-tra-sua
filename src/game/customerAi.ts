import type {
  Customer,
  CustomerMood,
  CustomerServiceFeedback,
  GameState,
} from "./types";

export const CUSTOMER_QUEUE_SIZE = 2;
export const QUEUE_ARRIVAL_SPACING_MS = 10000;

const BASE_PATIENCE_SECONDS: Record<Customer["patience"], number> = {
  chill: 92,
  normal: 76,
  impatient: 60,
};

function getPatienceMultiplier(state: GameState) {
  const rushFlow = state.researchedIds.includes("rush-flow") ? 0.12 : 0;
  const momoOnShift =
    state.activeStaff === "momo" && state.hiredStaff.includes("momo") ? 0.1 : 0;
  return 1 + rushFlow + momoOnShift;
}

export function getCustomerPatienceSeconds(state: GameState, customer: Customer) {
  const bond = state.customerBond[customer.id] ?? 0;
  const regularToleranceSeconds = Math.min(20, Math.round(bond * 0.6));
  return Math.round(
    (BASE_PATIENCE_SECONDS[customer.patience] + regularToleranceSeconds) *
      getPatienceMultiplier(state),
  );
}

function moodForRatio(ratio: number): CustomerMood {
  if (ratio <= 0.35) return "delighted";
  if (ratio <= 0.65) return "happy";
  if (ratio <= 0.9) return "neutral";
  if (ratio <= 1.15) return "restless";
  return "upset";
}

function tipMultiplierForMood(mood: CustomerMood) {
  if (mood === "delighted") return 1.15;
  if (mood === "happy") return 1.05;
  if (mood === "neutral") return 1;
  if (mood === "restless") return 0.75;
  return 0.4;
}

export function getCustomerServiceFeedback(
  state: GameState,
  customer: Customer,
  joinedAt: number,
  now = Date.now(),
): CustomerServiceFeedback {
  const waitedSeconds = Math.max(0, Math.round((now - joinedAt) / 1000));
  const patienceSeconds = getCustomerPatienceSeconds(state, customer);
  const patienceRatio = patienceSeconds > 0 ? waitedSeconds / patienceSeconds : 0;
  const mood = moodForRatio(patienceRatio);

  return {
    customerId: customer.id,
    waitedSeconds,
    patienceSeconds,
    patienceRatio,
    remainingPercent: Math.max(0, Math.round((1 - patienceRatio) * 100)),
    mood,
    tipMultiplier: tipMultiplierForMood(mood),
  };
}

export function getCustomerMoodMeta(mood: CustomerMood) {
  if (mood === "delighted") return { emoji: "✨", label: "rất vui", tone: "Nhanh tay, khách đang ấn tượng." };
  if (mood === "happy") return { emoji: "😊", label: "vui", tone: "Nhịp phục vụ đang ổn." };
  if (mood === "neutral") return { emoji: "🙂", label: "ổn", tone: "Khách bắt đầu để ý thời gian." };
  if (mood === "restless") return { emoji: "😣", label: "sốt ruột", tone: "Tip sẽ giảm nếu chậm thêm." };
  return { emoji: "💢", label: "khó chịu", tone: "Ưu tiên giao ly sớm để cứu trải nghiệm." };
}
