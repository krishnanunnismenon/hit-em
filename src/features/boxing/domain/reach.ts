import type { Attack } from "../../../../shared/input";
// Root-to-root scene distances, fitted to both authored toy rigs.
export const PUNCH_REACH: Record<Attack, number> = {
  jab: 1.5,
  cross: 1.48,
  hook: 1.38,
  uppercut: 1.32,
};
export const MIN_GAP = 1.12;
export const RING_RADIUS = 1.75;
