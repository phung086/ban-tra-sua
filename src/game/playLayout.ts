/** UI layout selection follows the usable viewport, never device model strings.
 * Compact landscape includes phones wider than the legacy 900px breakpoint.
 * Text, camera and interaction hitboxes retain CSS pixels; we do not zoom the UI.
 */
export type PlayLayout = 'portrait' | 'landscape' | 'desktop';
export function selectPlayLayout(width: number, height: number, coarsePointer: boolean): PlayLayout {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 'desktop';
  if (width > height && height <= 650 && (coarsePointer || width <= 1180)) return 'landscape';
  if (width <= 900 || (coarsePointer && width < 1180)) return 'portrait';
  return 'desktop';
}

export function layoutIsMobile(layout: PlayLayout) {
  return layout !== 'desktop';
}
