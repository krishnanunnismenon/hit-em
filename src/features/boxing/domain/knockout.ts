import { smooth } from "./motion";
import type { Knockout } from "./types";

export const KNOCKOUT_STYLES = [
  { name: "Timber", duration: 2.8, impacts: [1.02], word: "FLOOMP!" },
  { name: "Jelly knees", duration: 3, impacts: [1.08], word: "PLOP!" },
  { name: "The pirouette", duration: 3.25, impacts: [1.48], word: "WHOOPS!" },
  { name: "Banana peel", duration: 3.35, impacts: [1.18], word: "KER-PLOP!" },
  { name: "Victory too soon", duration: 3.55, impacts: [1.9], word: "OOPS!" },
  {
    name: "The encore",
    duration: 4.05,
    impacts: [1.08, 2.43],
    word: "AND... PLOP!",
  },
] as const;
export const knockoutStyle = (variant: number) =>
  KNOCKOUT_STYLES[((variant % 6) + 6) % 6];
const beat = (age: number, start: number, end: number) =>
  smooth((age - start) / (end - start));

export interface KnockoutIntent {
  collapse: number;
  pitch: number;
  roll: number;
  yaw: number;
  travelX: number;
  travelZ: number;
  drop: number;
  crouch: number;
  windmill: number;
  celebrate: number;
  flail: number;
  twitch: number;
  feet: readonly [number, number, number, number, number, number]; // x/y/z, rear then lead
  hands: readonly [number, number, number, number, number, number]; // local to torso
}
const FINISH = [
  {
    pitch: -1.52,
    roll: 0.08,
    yaw: 0.08,
    feet: [-0.34, 0.4, 0.27, 0.38, 0.28, 0.38],
    hands: [-0.64, 0.05, 0.15, 0.62, -0.15, 0.18],
  },
  {
    pitch: -1.38,
    roll: -0.24,
    yaw: -0.1,
    feet: [-0.4, 0.61, 0.42, 0.43, 0.57, 0.5],
    hands: [-0.33, 0.25, 0.34, 0.35, 0.2, 0.33],
  },
  {
    pitch: -0.38,
    roll: 1.45,
    yaw: 6.85,
    feet: [-0.43, 0.18, -0.08, 0.43, 0.54, 0.3],
    hands: [-0.6, -0.25, 0.02, 0.55, 0.12, 0.2],
  },
  {
    pitch: -1.54,
    roll: -0.12,
    yaw: -0.13,
    feet: [-0.25, 0.7, 0.51, 0.26, 0.72, 0.54],
    hands: [-0.64, 0.65, 0.15, 0.66, 0.67, 0.14],
  },
  {
    pitch: -0.2,
    roll: -1.49,
    yaw: 0.16,
    feet: [-0.35, 0.15, -0.04, 0.32, 0.39, 0.24],
    hands: [-0.56, -0.3, 0.02, 0.6, -0.12, 0.12],
  },
  {
    pitch: -1.47,
    roll: 0.28,
    yaw: 0.28,
    feet: [-0.32, 0.43, 0.32, 0.36, 0.68, 0.47],
    hands: [-0.34, 0.67, 0.34, 0.67, -0.12, 0.1],
  },
] as const;

/** Combat-clock choreography. Comic anticipation and secondary motion are bounded;
 * the articulated rig/floor solver own geometry, never outcome or damage. */
export function knockoutIntent(
  knockout: Knockout,
  time: number,
  reduced = false,
): KnockoutIntent {
  const age = Math.max(0, time - knockout.started),
    variant = knockout.variant;
  const finish = FINISH[variant];
  const landing = knockoutStyle(variant).impacts[0];
  let collapse = beat(age, landing - 0.48, landing);
  if (variant === 5 && !reduced) {
    collapse -= beat(age, 1.42, 1.96) * 0.53;
    collapse += beat(age, 2.04, 2.43) * 0.53;
  }
  // The reduced path still communicates defeat, without spinning or repeated falls.
  if (reduced) collapse = beat(age, 0.2, 1.05);
  const alive = 1 - beat(age, landing + 0.7, knockout.duration - 0.15);
  const flail =
    reduced || age >= knockout.duration || collapse === 1
      ? 0
      : Math.sin(age * 13) * (1 - collapse) * alive;
  const wobble = reduced ? 0 : Math.sin(age * 15) * (1 - collapse) * 0.06;
  const windmill =
    variant === 0 || variant === 2
      ? reduced
        ? 0
        : beat(age, 0.1, 0.3) * (1 - collapse)
      : 0;
  const celebrate =
    variant === 4 && !reduced
      ? beat(age, 0.2, 0.55) * (1 - beat(age, 1.42, 1.83))
      : 0;
  const twitch =
    reduced || age >= knockout.duration
      ? 0
      : Math.sin(age * 27) *
        beat(age, knockout.duration - 0.65, knockout.duration - 0.5) *
        (1 - beat(age, knockout.duration - 0.3, knockout.duration - 0.12)) *
        0.06;
  return {
    collapse,
    pitch:
      finish.pitch * collapse + (variant === 4 ? -celebrate * 0.12 : wobble),
    roll: finish.roll * collapse + wobble,
    yaw:
      (reduced && variant === 2 ? 0.56 : finish.yaw) *
      (variant === 2 && !reduced ? beat(age, 0.23, 1.75) : collapse),
    travelX: (variant === 2 ? 0.26 : variant === 4 ? -0.26 : 0.05) * collapse,
    travelZ: -0.38 * collapse,
    drop: -0.7 * collapse * collapse,
    crouch:
      variant === 1
        ? beat(age, 0.12, 0.68) * 0.2
        : (variant === 5 ? 0.09 : 0.04) * collapse,
    windmill,
    celebrate,
    flail,
    twitch,
    feet: finish.feet,
    hands: finish.hands,
  };
}
