export interface UiPreferences {
  sound: boolean;
  haptics: boolean;
  motion: boolean;
  oneHand: boolean;
  highContrast: boolean;
  focusMode: boolean;
  coachCompleted: boolean;
}

const KEY = "tiem-tra-chibi-ui-v1";

const defaults: UiPreferences = {
  sound: true,
  haptics: true,
  motion: true,
  oneHand: false,
  highContrast: false,
  focusMode: false,
  coachCompleted: false,
};

export function getUiPreferences(): UiPreferences {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<UiPreferences>;
    return { ...defaults, ...parsed };
  } catch {
    return { ...defaults };
  }
}

export function updateUiPreferences(patch: Partial<UiPreferences>): UiPreferences {
  const next = { ...getUiPreferences(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Preferences are optional; gameplay must remain available.
  }
  document.documentElement.dataset.motion = next.motion ? "on" : "off";
  document.documentElement.dataset.oneHand = next.oneHand ? "on" : "off";
  document.documentElement.dataset.contrast = next.highContrast ? "high" : "normal";
  document.documentElement.dataset.focus = next.focusMode ? "on" : "off";
  return next;
}

export function syncMotionPreference() {
  const prefs = getUiPreferences();
  document.documentElement.dataset.motion = prefs.motion ? "on" : "off";
  document.documentElement.dataset.oneHand = prefs.oneHand ? "on" : "off";
  document.documentElement.dataset.contrast = prefs.highContrast ? "high" : "normal";
  document.documentElement.dataset.focus = prefs.focusMode ? "on" : "off";
}
