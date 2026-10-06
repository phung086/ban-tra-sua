export interface PerformanceEntry {
  score: number;
  combo: number;
  at: number;
}

export interface PerformanceSnapshot {
  recent: PerformanceEntry[];
  average: number;
  best: number;
  trend: number;
  strongRun: number;
}

const KEY = "tiem-tra-chibi-performance-v1";
const EVENT = "tiem-tra-performance-update";
const LIMIT = 40;

function loadEntries(): PerformanceEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PerformanceEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry) =>
        Number.isFinite(entry?.score) &&
        Number.isFinite(entry?.combo) &&
        Number.isFinite(entry?.at),
      )
      .slice(-LIMIT);
  } catch {
    return [];
  }
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function getPerformanceSnapshot(): PerformanceSnapshot {
  const entries = loadEntries();
  const recent = entries.slice(-12);
  const lastThree = entries.slice(-3).map((entry) => entry.score);
  const previousThree = entries.slice(-6, -3).map((entry) => entry.score);
  const strongRun = [...entries]
    .reverse()
    .findIndex((entry) => entry.score < 85);

  return {
    recent,
    average: average(recent.map((entry) => entry.score)),
    best: entries.length ? Math.max(...entries.map((entry) => entry.score)) : 0,
    trend:
      lastThree.length === 3 && previousThree.length === 3
        ? average(lastThree) - average(previousThree)
        : 0,
    strongRun: strongRun === -1 ? entries.length : strongRun,
  };
}

export function recordCraftPerformance(score: number, combo: number) {
  const entries = loadEntries();
  const next = [...entries, { score, combo, at: Date.now() }].slice(-LIMIT);

  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Performance history is optional and must never block gameplay.
  }

  window.dispatchEvent(new Event(EVENT));
}

export function subscribePerformance(listener: () => void) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
