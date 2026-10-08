import type { Attack, Stance } from "../../../../shared/input";
import type { Strike } from "./types";
import { smooth } from "./motion";

/** Authored ring tactics in metres/radians, consumed by the physical rig.
 * A plan latches with its punch. Variations are tactics, never random frame noise. */
export interface FootworkPlan {
  readonly name: string;
  readonly first: 0 | 1; // rear / lead; retreat catches on the rear, pressure begins on the lead
  readonly rearX: number;
  readonly rearZ: number;
  readonly leadX: number;
  readonly leadZ: number;
  readonly rearYaw: number;
  readonly leadYaw: number;
  readonly exitX: number;
  readonly exitZ: number;
  readonly curve: number;
  readonly crouch: number;
  readonly slip: number;
  readonly recovery: number;
}
interface Family {
  names: readonly [string, string, string];
  advance: number;
  angle: number;
  width: number;
  exit: number;
  crouch: number;
  recovery: number;
}
const FAMILIES: Record<Stance, readonly Family[]> = {
  defensive: [
    {
      names: ["Catch and pull", "Outside slide", "Pivot check"],
      advance: -0.012,
      angle: 0.055,
      width: 0.006,
      exit: -0.045,
      crouch: 0.006,
      recovery: 0.025,
    },
    {
      names: ["Pull counter", "Slip and slide", "L-step counter"],
      advance: -0.022,
      angle: 0.08,
      width: 0.015,
      exit: -0.065,
      crouch: 0.014,
      recovery: 0.045,
    },
    {
      names: ["Brace and answer", "Roll outside", "Check and turn"],
      advance: -0.03,
      angle: 0.105,
      width: 0.03,
      exit: -0.085,
      crouch: 0.025,
      recovery: 0.075,
    },
    {
      names: ["Shell counter", "Loaded slip", "Heavy pivot exit"],
      advance: -0.04,
      angle: 0.13,
      width: 0.045,
      exit: -0.105,
      crouch: 0.04,
      recovery: 0.11,
    },
  ],
  offensive: [
    {
      names: ["Probe step", "Cut the lane", "Step around"],
      advance: 0.025,
      angle: 0.045,
      width: 0.006,
      exit: 0.016,
      crouch: 0.003,
      recovery: 0.015,
    },
    {
      names: ["Step and follow", "Diagonal pressure", "Turn the corner"],
      advance: 0.055,
      angle: 0.065,
      width: 0.014,
      exit: 0.025,
      crouch: 0.009,
      recovery: 0.025,
    },
    {
      names: ["Drive and brake", "Cut-off step", "Pressure pivot"],
      advance: 0.085,
      angle: 0.085,
      width: 0.026,
      exit: 0.036,
      crouch: 0.018,
      recovery: 0.055,
    },
    {
      names: ["Committed drive", "Loaded cut-off", "Crushing turn"],
      advance: 0.115,
      angle: 0.11,
      width: 0.04,
      exit: 0.05,
      crouch: 0.03,
      recovery: 0.085,
    },
  ],
  neutral: [
    {
      names: ["Quiet plant", "Small angle", "Toe turn"],
      advance: 0.003,
      angle: 0.035,
      width: 0.003,
      exit: -0.015,
      crouch: 0.002,
      recovery: 0,
    },
    {
      names: ["Step and set", "Outside set", "Pivot and set"],
      advance: 0.012,
      angle: 0.05,
      width: 0.012,
      exit: -0.024,
      crouch: 0.007,
      recovery: 0.015,
    },
    {
      names: ["Weight transfer", "Angle plant", "Torque and reset"],
      advance: 0.024,
      angle: 0.07,
      width: 0.024,
      exit: -0.035,
      crouch: 0.015,
      recovery: 0.035,
    },
    {
      names: ["Heavy plant", "Loaded angle", "Power pivot"],
      advance: 0.04,
      angle: 0.09,
      width: 0.038,
      exit: -0.047,
      crouch: 0.025,
      recovery: 0.065,
    },
  ],
  super: [
    {
      names: ["Burst step", "Flash angle", "Burst pivot"],
      advance: 0.05,
      angle: 0.07,
      width: 0.013,
      exit: 0.023,
      crouch: 0.009,
      recovery: 0.025,
    },
    {
      names: ["Spring drive", "Switch the lane", "Spiral entry"],
      advance: 0.08,
      angle: 0.09,
      width: 0.023,
      exit: 0.035,
      crouch: 0.019,
      recovery: 0.045,
    },
    {
      names: ["Loaded burst", "Angle breaker", "Coiled turn"],
      advance: 0.105,
      angle: 0.115,
      width: 0.038,
      exit: 0.045,
      crouch: 0.03,
      recovery: 0.085,
    },
    {
      names: ["Full-body drive", "Explosive angle", "Corkscrew exit"],
      advance: 0.13,
      angle: 0.14,
      width: 0.055,
      exit: 0.058,
      crouch: 0.045,
      recovery: 0.13,
    },
  ],
};
const plans = new Map<string, FootworkPlan>();
const key = (attack: Attack, stance: Stance, power: number, variant: number) =>
  `${stance}/${attack}/${power}/${variant}`;
for (const stance of ["defensive", "offensive", "neutral", "super"] as const)
  for (const attack of ["jab", "cross", "hook", "uppercut"] as const)
    for (let power = 1; power <= 4; power++)
      for (let variant = 0; variant < 3; variant++) {
        const f = FAMILIES[stance][power - 1];
        const effort = 0.65 + power * 0.0875;
        const inside =
          (attack === "uppercut" ? 0.17 : attack === "hook" ? 0.085 : 0) *
          effort;
        const side = variant === 1 ? -1 : variant === 2 ? 1 : 0;
        const angle =
          side *
          f.angle *
          (attack === "hook" ? 1.15 : attack === "jab" ? 0.85 : 1);
        const turn =
          variant === 2
            ? (attack === "hook" ? -1 : 1) * (0.09 + power * 0.035)
            : angle * 0.5;
        // The check/pivot keeps its lead support quieter; the rear foot describes an arc.
        const leadX =
          variant === 2 ? angle * 0.32 + f.width * 0.5 : angle + f.width * 0.5;
        const rearX =
          variant === 2 ? angle * 1.05 - f.width * 0.5 : angle - f.width * 0.5;
        const leadZ =
          inside + f.advance + (attack === "jab" ? power * 0.003 : 0);
        const rearZ =
          inside + f.advance * (stance === "defensive" ? 1.25 : 0.65);
        plans.set(
          key(attack, stance, power, variant),
          Object.freeze({
            name: f.names[variant],
            first: f.advance < 0 || angle < 0 ? 0 : 1,
            rearX,
            rearZ,
            leadX,
            leadZ,
            rearYaw: turn * 0.75 + (attack === "cross" ? power * 0.018 : 0),
            leadYaw: turn * 0.45 + (attack === "hook" ? -power * 0.012 : 0),
            exitX:
              (variant === 1 ? -1 : variant === 2 ? 1 : 0.2) * f.angle * 1.15,
            exitZ: f.exit,
            curve: variant === 2 ? turn * 0.13 : angle * 0.12,
            crouch: f.crouch,
            slip:
              stance === "defensive"
                ? (variant === 1 ? -1 : 1) * (0.025 + power * 0.012)
                : 0,
            recovery:
              f.recovery + (variant === 2 ? 0.025 : variant === 1 ? 0.01 : 0),
          }),
        );
      }
export function footworkPlan(
  attack: Attack,
  stance: Stance,
  power: number,
  variant: number,
) {
  return plans.get(
    key(
      attack,
      stance,
      Math.max(1, Math.min(4, power)),
      ((variant % 3) + 3) % 3,
    ),
  )!;
}
export interface FootworkGoals {
  rearX: number;
  leadX: number;
  rearZ: number;
  leadZ: number;
  rearYaw: number;
  leadYaw: number;
  rearLift: number;
  leadLift: number;
  rearHeel: number;
  leadHeel: number;
  pelvisX: number;
  pelvisY: number;
  pelvisZ: number;
  torsoRoll: number;
}
/** Step-slide entry, then an angled reset rather than reversing the entry path.
 * Non-overlapping swing windows leave the other toe planted. Both feet settle
 * before contact, with an extra beat between recovery swings for heavy power. */
export function applyFootwork(
  goals: FootworkGoals,
  strike: Strike,
  time: number,
  stamina: number,
  drive: number,
  load: number,
) {
  const plan = footworkPlan(
    strike.attack,
    strike.stance,
    strike.power,
    strike.variant,
  );
  const age = Math.max(0, time - strike.started);
  const phase = age / strike.contactAt;
  const returning = age > strike.contactAt;
  const recovery =
    (age - strike.contactAt - 0.06) /
    Math.max(0.1, strike.duration - strike.contactAt - 0.06);
  const fatigue = Math.min(1, Math.max(0, (100 - stamina) / 100));
  const stride = 1 - fatigue * 0.24;
  let shiftX = 0;
  for (const foot of [0, 1] as const) {
    const first = returning ? foot !== plan.first : foot === plan.first;
    const start = returning ? (first ? 0 : 0.53) : first ? 0.025 : 0.46;
    const span = returning ? (first ? 0.47 : 0.47) : first ? 0.4 : 0.43;
    const progress = ((returning ? recovery : phase) - start) / span;
    const u = smooth(progress),
      move = returning ? 1 - u : u;
    const arc = Math.sin(Math.PI * u);
    const x = (foot === 0 ? plan.rearX : plan.leadX) * stride;
    const z = (foot === 0 ? plan.rearZ : plan.leadZ) * stride;
    const sideways = returning ? plan.exitX * arc : plan.curve * arc;
    const retreat = returning ? plan.exitZ * arc : 0;
    const yaw =
      (foot === 0 ? plan.rearYaw : plan.leadYaw) * drive +
      (returning ? plan.exitX * 1.1 * arc : 0);
    const distance =
      Math.hypot(x, z) + (returning ? Math.hypot(plan.exitX, plan.exitZ) : 0);
    const duration =
      (returning
        ? Math.max(0.1, strike.duration - strike.contactAt - 0.06)
        : strike.contactAt) * span;
    const lift =
      distance > 0.012 && progress > 0 && progress < 1
        ? Math.min(0.045, (9.81 * duration * duration) / 8) *
          4 *
          progress *
          (1 - progress)
        : 0;
    if (foot === 0) {
      goals.rearX += x * move + sideways;
      goals.rearZ += z * move + retreat;
      goals.rearYaw += yaw;
      goals.rearLift = lift;
    } else {
      goals.leadX += x * move + sideways;
      goals.leadZ += z * move + retreat;
      goals.leadYaw += yaw;
      goals.leadLift = lift;
    }
    shiftX += (x * move + sideways) * 0.45;
  }
  // A counter uppercut must regain inside range before extending the knees.
  // Retreat happens in the exit, after contact, rather than pulling the target out of reach.
  if (strike.stance === "defensive" && strike.attack === "uppercut")
    goals.pelvisZ += 0.055 * stride * drive;
  goals.pelvisX += shiftX;
  goals.pelvisY -= plan.crouch * (load * 0.5 + drive);
  goals.torsoRoll += plan.slip * drive;
  if (goals.leadLift > 0.0001) goals.rearHeel = 0;
  if (goals.rearLift > 0.0001) goals.leadHeel = 0;
}
