/** QC-06: Keep the animated shoe's lowest corner above the pavement.
 *
 * The character rig has a hip at y=.83, knee at -.42 and a shoe centered
 * at (0,-.34,.075) relative to the knee. The shoe is .12 high by .30 long.
 * Evaluating its rotated bounding corners avoids lifting the whole actor or
 * introducing per-frame raycasts / renderer allocations.
 */
const HIP_HEIGHT = 0.83;
const KNEE_OFFSET = -0.42;
const SHOE_CENTER_Y = -0.34;
const SHOE_CENTER_Z = 0.075;
const SHOE_HALF_HEIGHT = 0.06;
const SHOE_HALF_LENGTH = 0.15;
const REST_SOLE_HEIGHT = 0.01;

/** Conservative minimum shoe height in actor-local coordinates. */
export function shoeSoleHeight(hipPitch: number, kneePitch: number, hipHeight = HIP_HEIGHT): number {
  if (![hipPitch, kneePitch, hipHeight].every(Number.isFinite)) return REST_SOLE_HEIGHT;
  const shoePitch = hipPitch + kneePitch;
  return hipHeight + KNEE_OFFSET * Math.cos(hipPitch)
    + SHOE_CENTER_Y * Math.cos(shoePitch) - SHOE_CENTER_Z * Math.sin(shoePitch)
    - SHOE_HALF_HEIGHT * Math.abs(Math.cos(shoePitch))
    - SHOE_HALF_LENGTH * Math.abs(Math.sin(shoePitch));
}

/** Lift the leg pivot only as much as the planted sole needs, never the root.
 * Seating already owns the leg pose; disable ground correction during it.
 */
export function footGroundLift(hipPitch: number, kneePitch: number, seatedWeight = 0): number {
  if (![hipPitch, kneePitch, seatedWeight].every(Number.isFinite)) return 0;
  const standing = 1 - Math.max(0, Math.min(1, seatedWeight));
  return standing * Math.max(0, REST_SOLE_HEIGHT - shoeSoleHeight(hipPitch, kneePitch));
}
