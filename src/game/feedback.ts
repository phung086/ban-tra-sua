export type FeedbackKind = "tap" | "good" | "perfect" | "bad";

const vibration: Record<FeedbackKind, number | number[]> = {
  tap: 10,
  good: [18, 25, 18],
  perfect: [25, 35, 25, 35, 45],
  bad: 35,
};

const tone: Record<FeedbackKind, { frequency: number; duration: number; gain: number }> = {
  tap: { frequency: 430, duration: 0.045, gain: 0.025 },
  good: { frequency: 620, duration: 0.08, gain: 0.035 },
  perfect: { frequency: 820, duration: 0.12, gain: 0.045 },
  bad: { frequency: 210, duration: 0.09, gain: 0.025 },
};

export function pulseFeedback(kind: FeedbackKind) {
  try {
    if ("vibrate" in navigator) navigator.vibrate(vibration[kind]);
  } catch {
    // Haptics are an enhancement only.
  }

  try {
    const AudioCtor = window.AudioContext;
    if (!AudioCtor) return;

    const context = new AudioCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const config = tone[kind];
    const now = context.currentTime;

    oscillator.type = kind === "bad" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(config.frequency, now);
    gain.gain.setValueAtTime(config.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + config.duration);

    oscillator.addEventListener("ended", () => {
      void context.close();
    });
  } catch {
    // Audio can be blocked by browser policy. Gameplay still works.
  }
}

export function feedbackForScore(score: number) {
  if (score >= 95) pulseFeedback("perfect");
  else if (score >= 80) pulseFeedback("good");
  else if (score < 55) pulseFeedback("bad");
  else pulseFeedback("tap");
}
