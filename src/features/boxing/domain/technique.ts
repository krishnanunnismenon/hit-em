import type { Attack, Stance } from "../../../../shared/input";
import type { Strike } from "./types";
import { smooth } from "./motion";
import { applyFootwork } from "./footwork";

/** Boxing technique intent, not animation transforms or combat authority.
 * Units: metres / radians / seconds. These are authored motor goals, not captured athletes. */
export const TECHNIQUE_NAMES: Record<Stance, Record<Attack, string>> = {
  defensive: {
    jab: "Stop jab",
    cross: "Slip cross",
    hook: "Check hook",
    uppercut: "Counter uppercut",
  },
  offensive: {
    jab: "Step jab",
    cross: "Driving cross",
    hook: "Pressure hook",
    uppercut: "Inside uppercut",
  },
  neutral: {
    jab: "Snap jab",
    cross: "Straight cross",
    hook: "Lead hook",
    uppercut: "Rear uppercut",
  },
  super: {
    jab: "Piercing jab",
    cross: "Spear cross",
    hook: "Torque hook",
    uppercut: "Corkscrew uppercut",
  },
};
const STANCE = {
  defensive: {
    crouch: 0.075,
    blade: -0.22,
    lean: -0.08,
    guard: 0.53,
    spread: 0.265,
    drive: -0.035,
    turn: 0.78,
  },
  offensive: {
    crouch: 0.04,
    blade: -0.06,
    lean: 0.1,
    guard: 0.4,
    spread: 0.285,
    drive: 0.115,
    turn: 1.15,
  },
  neutral: {
    crouch: 0.025,
    blade: -0.13,
    lean: 0.025,
    guard: 0.46,
    spread: 0.245,
    drive: 0.045,
    turn: 1,
  },
  super: {
    crouch: 0.055,
    blade: -0.12,
    lean: 0.075,
    guard: 0.47,
    spread: 0.29,
    drive: 0.145,
    turn: 1.3,
  },
} as const;
const PUNCH = {
  jab: { yaw: -0.24, dip: 0.018, forward: 0.025, pivot: 0.14, foot: 0 },
  cross: { yaw: 0.72, dip: 0.045, forward: 0.12, pivot: 0.7, foot: 0 },
  hook: { yaw: -0.92, dip: 0.06, forward: 0.195, pivot: -0.75, foot: 1 },
  uppercut: { yaw: 0.57, dip: 0.15, forward: 0.37, pivot: 0.48, foot: 0 },
} as const;
export interface TechniqueIntent {
  pelvisX: number;
  pelvisY: number;
  pelvisZ: number;
  pelvisYaw: number;
  torsoYaw: number;
  torsoPitch: number;
  torsoRoll: number;
  guardY: number;
  guardX: number;
  guardZ: number;
  rearX: number;
  leadX: number;
  rearZ: number;
  leadZ: number;
  rearYaw: number;
  leadYaw: number;
  rearHeel: number;
  leadHeel: number;
  leadLift: number;
  rearLift: number;
  returning: number;
  hand: number;
  load: number;
  drive: number;
  effort: number;
}
export function techniqueIntent(
  strike: Strike | null,
  stance: Stance,
  time: number,
  stamina = 100,
): TechniqueIntent {
  const effective = strike?.stance ?? stance,
    base = STANCE[effective];
  const fatigue = Math.min(1, Math.max(0, (100 - stamina) / 100));
  const intent: TechniqueIntent = {
    pelvisX: 0,
    pelvisY: 1.16 - base.crouch,
    pelvisZ: base.drive * 0.18,
    pelvisYaw: base.blade * 0.55,
    torsoYaw: base.blade,
    torsoPitch: base.lean,
    torsoRoll: 0,
    guardY: base.guard - fatigue * 0.075,
    guardX: effective === "defensive" ? 0.29 : 0.35,
    guardZ: effective === "offensive" ? 0.36 : 0.3,
    rearX: -base.spread,
    leadX: base.spread,
    rearZ: -0.17,
    leadZ: 0.24,
    rearYaw: -0.12,
    leadYaw: 0.06,
    rearHeel: 0.025,
    leadHeel: 0,
    leadLift: 0,
    rearLift: 0,
    returning: 0,
    hand: 0,
    load: 0,
    drive: 0,
    effort: 0.5,
  };
  if (!strike) return intent;
  const punch = PUNCH[strike.attack],
    age = Math.max(0, time - strike.started);
  const phase = age / strike.contactAt;
  const recovery = smooth(
    (age - strike.contactAt - 0.035) /
      Math.max(0.1, strike.duration - strike.contactAt - 0.035),
  );
  const hold = 1 - recovery;
  const power = [0.48, 0.68, 0.86, 1][strike.power - 1] ?? 0.68;
  const effort = power * (1 - fatigue * 0.2),
    turn = punch.yaw * base.turn * (0.62 + effort * 0.38);
  // Proximal-to-distal intent: foot/hips lead the trunk, then the striking hand.
  const load = smooth(phase / 0.25) * (1 - smooth((phase - 0.3) / 0.3));
  const hips = smooth((phase - 0.12) / 0.5) * hold;
  const shoulders = smooth((phase - 0.25) / 0.5) * hold;
  const hand = smooth((phase - 0.32) / 0.6);
  const drive = smooth((phase - 0.16) / 0.6) * hold;
  intent.effort = effort;
  intent.hand = hand;
  intent.returning = recovery;
  intent.load = load;
  intent.drive = drive;
  intent.pelvisYaw += turn * (0.78 * hips - 0.24 * load);
  intent.torsoYaw += turn * (shoulders - 0.28 * load);
  // Rear-leg drive into lead-leg braking. Hook transfers across the base; uppercut extends the knees.
  intent.pelvisZ +=
    (base.drive + punch.forward) * drive * (0.7 + power * 0.3) -
    load * 0.035 * power;
  intent.pelvisY -= punch.dip * load * (0.45 + power * 0.55);
  intent.pelvisY +=
    (strike.attack === "uppercut" ? 0.028 : 0.008) * drive * power;
  intent.pelvisX += (strike.attack === "hook" ? -0.09 : -0.025) * drive * power;
  if (effective === "defensive")
    intent.pelvisX += (strike.attack === "cross" ? 0.07 : -0.025) * shoulders;
  intent.torsoPitch +=
    (strike.attack === "uppercut" ? -0.06 : 0.055) * drive * power;
  intent.torsoRoll =
    effective === "defensive" && strike.attack === "cross"
      ? -0.11 * shoulders
      : turn * 0.035 * drive;
  intent.guardY += effective === "defensive" ? load * 0.035 : 0;
  const pivot = punch.pivot * base.turn * effort * hips;
  if (punch.foot === 0) {
    intent.rearYaw += pivot;
    intent.rearHeel += Math.abs(pivot) * 0.19;
  } else {
    intent.leadYaw += pivot;
    intent.leadHeel += Math.abs(pivot) * 0.15;
  }
  applyFootwork(intent, strike, time, stamina, drive, load);
  return intent;
}
