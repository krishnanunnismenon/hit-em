import type { Attack, Stance } from "../../../../shared/input";
import type { StudyState, Strike, FighterSide, Outcome } from "./types";
import { PUNCH_REACH } from "./reach";

/** Explicit prototype rules inspired by boxing tactics, not measured injury/force models. */
export const GUARDS = {
  open: { label: "Guard open", jab: 0, cross: 0, hook: 0, uppercut: 0 },
  balanced: {
    label: "Balanced guard",
    jab: 0.55,
    cross: 0.55,
    hook: 0.58,
    uppercut: 0.6,
  },
  "left-low": {
    label: "Rival's left glove low",
    jab: 0.58,
    cross: 0.05,
    hook: 0.5,
    uppercut: 0.35,
  },
  "right-low": {
    label: "Rival's right glove low",
    jab: 0.05,
    cross: 0.58,
    hook: 0.12,
    uppercut: 0.35,
  },
  high: {
    label: "Tight high guard",
    jab: 0.95,
    cross: 0.95,
    hook: 0.35,
    uppercut: 0.92,
  },
  wide: {
    label: "Wide guard · chin open",
    jab: 0.4,
    cross: 0.4,
    hook: 0.95,
    uppercut: 0.15,
  },
  low: {
    label: "Elbows tucked",
    jab: 0.18,
    cross: 0.18,
    hook: 0.3,
    uppercut: 0.94,
  },
} as const;
export type GuardShape = keyof typeof GUARDS;
export type FightPhase = "guard" | "windup" | "recovery" | "stagger";
export type Motion = "closing" | "retreating" | "circling";
export interface PunchContext {
  attack: Attack;
  power: number;
  stance: Stance;
  distance: number;
  guard: GuardShape;
  phase: FightPhase;
  motion: Motion;
  opponentAttack?: Attack;
  repeats: number;
  combo: boolean;
}
export interface Assessment {
  outcome: Outcome;
  damage: number;
  multiplier: number;
  reason: string;
  advantage: boolean;
  counter: boolean;
}
const BASE_DAMAGE: Record<Attack, number> = {
  jab: 3,
  cross: 4.5,
  hook: 4,
  uppercut: 4.75,
};
export function evaluatePunch(c: PunchContext): Assessment {
  if (c.distance > PUNCH_REACH[c.attack] + 1e-9)
    return {
      outcome: "whiff",
      damage: 0,
      multiplier: 0,
      reason: "Outside reach",
      advantage: false,
      counter: false,
    };
  const coverage = c.phase === "stagger" ? 0 : GUARDS[c.guard][c.attack];
  if (coverage >= 0.9)
    return {
      outcome: "block",
      damage: 0,
      multiplier: 0,
      reason: "Lane covered",
      advantage: false,
      counter: false,
    };
  let multiplier = coverage < 0.3 ? 1.45 : coverage < 0.45 ? 1.08 : 0.85;
  let reason =
    coverage < 0.3
      ? c.guard === "left-low"
        ? "Left glove low"
        : c.guard === "right-low"
          ? "Right glove low"
          : c.guard === "wide"
            ? "Chin open"
            : "Guard open"
      : "Clean contact";
  let advantage = coverage < 0.45;
  if (c.attack === "jab" && c.distance >= 1.36) {
    multiplier *= 1.14;
    if (!advantage) reason = "Long-range jab";
    advantage = true;
  }
  if (c.attack === "cross" && c.distance >= 1.3 && c.distance <= 1.45)
    multiplier *= 1.12;
  if (c.attack === "hook" && c.distance <= 1.34) {
    multiplier *= 1.16;
    reason = c.guard === "high" ? "Around the high guard" : reason;
    advantage = true;
  }
  if (c.attack === "uppercut" && c.distance <= 1.25) {
    multiplier *= 1.2;
    advantage = true;
  }
  if ((c.attack === "jab" || c.attack === "cross") && c.distance < 1.25) {
    multiplier *= 0.76;
    if (!advantage) reason = "Cramped straight";
  }
  const intercept =
    c.phase === "windup" &&
    ((c.attack === "jab" && c.power <= 2) ||
      (c.attack === "hook" &&
        c.stance === "defensive" &&
        c.motion === "closing") ||
      (c.attack === "uppercut" &&
        c.distance <= 1.25 &&
        c.opponentAttack !== "jab"));
  const counter = c.phase === "stagger" || c.phase === "recovery" || intercept;
  if (counter) {
    multiplier *= c.attack === "cross" && c.phase === "recovery" ? 1.3 : 1.2;
    reason =
      c.phase === "stagger"
        ? "Stagger opening"
        : c.phase === "recovery"
          ? "Caught the recovery"
          : "Timed interception";
    advantage = true;
  }
  if (c.stance === "defensive" && counter) multiplier *= 1.12;
  if (c.stance === "offensive" && (c.phase === "recovery" || c.distance <= 1.3))
    multiplier *= 1.1;
  if (c.stance === "super") multiplier *= 1.18;
  if (c.combo) {
    multiplier *= 1.12;
    reason = "Changed the attack line";
    advantage = true;
  }
  if (c.repeats >= 2) {
    multiplier *= 0.72;
    reason = "Repeat anticipated";
    advantage = false;
  }
  multiplier = Math.max(0.55, Math.min(1.8, multiplier));
  return {
    outcome: counter ? "counter" : "hit",
    damage: Math.max(
      1,
      Math.round(BASE_DAMAGE[c.attack] * c.power * multiplier),
    ),
    multiplier,
    reason,
    advantage,
    counter,
  };
}

export interface Exchange {
  recent: Attack[];
  lastLanded: Attack | null;
  lastLandedAt: number;
  chain: number;
}
export function createExchange(): Exchange {
  return { recent: [], lastLanded: null, lastLandedAt: -10, chain: 0 };
}
export function phaseOf(s: StudyState, side: FighterSide): FightPhase {
  if (
    s.stunUntil[side] > s.time ||
    (side === "rival" && s.staggerUntil > s.time)
  )
    return "stagger";
  const a = side === "rival" ? s.rivalStrike : s.playerStrike;
  return a ? (a.resolved ? "recovery" : "windup") : "guard";
}
export function rivalGuard(s: StudyState): GuardShape {
  if (phaseOf(s, "rival") === "stagger") return "open";
  const a = s.rivalStrike;
  if (a && !a.resolved)
    return a.attack === "jab" || a.attack === "hook" ? "left-low" : "right-low";
  return s.spacing.guard;
}
export function punchContext(
  s: StudyState,
  side: FighterSide,
  a: Pick<Strike, "attack" | "power" | "stance">,
): PunchContext {
  const opposite = side === "player" ? "rival" : "player";
  const exchange = s.exchanges[side];
  const recent = exchange.recent;
  let repeats = 0;
  for (let n = recent.length - 1; n >= 0 && recent[n] === a.attack; n--)
    repeats++;
  const defenderStrike = opposite === "rival" ? s.rivalStrike : s.playerStrike;
  const motion: Motion =
    side === "player"
      ? s.spacing.tactic === "advance"
        ? "closing"
        : s.spacing.tactic === "retreat"
          ? "retreating"
          : "circling"
      : s.stance === "offensive" || s.stance === "super"
        ? "closing"
        : s.stance === "defensive"
          ? "retreating"
          : "circling";
  const guard =
    side === "player"
      ? rivalGuard(s)
      : s.stance === "defensive"
        ? "high"
        : "balanced";
  return {
    ...a,
    guard,
    phase: phaseOf(s, opposite),
    motion,
    opponentAttack: defenderStrike?.attack,
    distance: Math.hypot(
      s.spacing.rival.x - s.spacing.player.x,
      s.spacing.rival.z - s.spacing.player.z,
    ),
    repeats,
    combo:
      exchange.lastLanded !== null &&
      exchange.lastLanded !== a.attack &&
      s.time - exchange.lastLandedAt <= 2.3 &&
      exchange.chain < 3,
  };
}
export function recordExchange(s: StudyState, side: FighterSide, a: Strike) {
  const e = s.exchanges[side];
  e.recent.push(a.attack);
  if (e.recent.length > 4) e.recent.shift();
  if (a.outcome === "hit" || a.outcome === "counter") {
    e.chain =
      s.time - e.lastLandedAt <= 2.3 && e.lastLanded !== a.attack
        ? e.chain + 1
        : 1;
    e.lastLanded = a.attack;
    e.lastLandedAt = s.time;
  } else {
    e.chain = 0;
    e.lastLanded = null;
  }
}
/** Weighted response uses completed punches, never a wheel selection or future input. */
export function guardWeights(s: StudyState): Record<GuardShape, number> {
  const weights: Record<GuardShape, number> = {
    open: 0.12,
    balanced: 0.25,
    "left-low": 0.18,
    "right-low": 0.18,
    high: 0.15,
    wide: 0.08,
    low: 0.08,
  };
  const hard = s.difficulty === "ring-sense";
  const recent = hard
    ? (s.opponent.awareness.noticed?.recent ?? [])
    : s.exchanges.player.recent;
  const last = recent.at(-1);
  if (hard) {
    weights.open *= 0.65;
    for (const attack of recent)
      weights[
        attack === "hook" ? "wide" : attack === "uppercut" ? "low" : "high"
      ] += 0.22;
    if (last)
      weights[
        last === "hook" ? "wide" : last === "uppercut" ? "low" : "high"
      ] += 0.35;
  }
  const repeated = recent.slice(-3).filter((a) => a === last).length;
  if (repeated >= 2 && last)
    weights[last === "hook" ? "wide" : last === "uppercut" ? "low" : "high"] +=
      repeated * 0.5;
  if (s.spacing.rivalStamina < 35) {
    weights["left-low"] += 0.2;
    weights["right-low"] += 0.2;
  }
  if (s.rivalHealth < 30) weights.high += 0.25;
  weights[s.spacing.guard] *= 0.35;
  return weights;
}

// +X lead glove is anatomical left; -X rear glove is anatomical right.
// Shared cached goals avoid allocations inside the rig's 240 Hz integration.
const GUARD_GOALS: Record<
  GuardShape,
  readonly [
    { x: number; y: number; z: number },
    { x: number; y: number; z: number },
  ]
> = {
  open: [
    { x: 0, y: -0.18, z: 0 },
    { x: 0, y: -0.18, z: 0 },
  ],
  balanced: [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
  ],
  "left-low": [
    { x: 0, y: 0, z: 0 },
    { x: 0.03, y: -0.45, z: -0.05 },
  ],
  "right-low": [
    { x: 0.03, y: -0.45, z: -0.05 },
    { x: 0, y: 0, z: 0 },
  ],
  high: [
    { x: -0.16, y: 0.09, z: 0.03 },
    { x: -0.16, y: 0.09, z: 0.03 },
  ],
  wide: [
    { x: 0.16, y: 0, z: 0 },
    { x: 0.16, y: 0, z: 0 },
  ],
  low: [
    { x: -0.1, y: -0.18, z: 0.08 },
    { x: -0.1, y: -0.18, z: 0.08 },
  ],
};
export function guardGoal(guard: GuardShape, hand: number) {
  return GUARD_GOALS[guard][hand];
}

export const SCENARIOS = {
  "jab-lane": {
    label: "Jab · right glove low",
    guard: "right-low",
    distance: 1.43,
    attack: "jab",
    phase: "guard",
  },
  "cross-lane": {
    label: "Cross · left glove low",
    guard: "left-low",
    distance: 1.4,
    attack: "cross",
    phase: "guard",
  },
  "hook-lane": {
    label: "Hook · tight high guard",
    guard: "high",
    distance: 1.28,
    attack: "hook",
    phase: "guard",
  },
  "uppercut-lane": {
    label: "Uppercut · chin open",
    guard: "wide",
    distance: 1.2,
    attack: "uppercut",
    phase: "guard",
  },
  recovery: {
    label: "Counter · recovery window",
    guard: "open",
    distance: 1.4,
    attack: "cross",
    phase: "recovery",
  },
  protected: {
    label: "Protected · high guard",
    guard: "high",
    distance: 1.4,
    attack: "jab",
    phase: "guard",
  },
} as const;
export type ScenarioId = keyof typeof SCENARIOS;
export function assessPlayer(
  s: StudyState,
  a: Pick<Strike, "attack" | "power" | "stance">,
) {
  const c = punchContext(s, "player", a);
  if (s.spacing.rehearsal) c.phase = SCENARIOS[s.spacing.rehearsal].phase;
  return evaluatePunch(c);
}
export function opportunityRead(s: StudyState) {
  const a = s.playerStrike ?? { ...s.selection, stance: s.stance };
  const result = assessPlayer(s, a);
  return {
    title:
      result.outcome === "whiff"
        ? "Wait for reach"
        : result.outcome === "block"
          ? `${a.attack} guarded`
          : result.counter
            ? `${a.attack} counter window`
            : result.advantage
              ? `${a.attack} opening`
              : `${a.attack} in range`,
    reason: result.reason,
    tip:
      result.outcome === "block"
        ? s.spacing.guard === "wide"
          ? "Side covered. Look for a straight or uppercut."
          : "Centre covered. Close in for a hook."
        : result.outcome === "whiff"
          ? "Get inside the yellow band before punching."
          : result.reason === "Repeat anticipated"
            ? "Change your punch to find another lane."
            : `${result.reason}. Time your shot.`,
    advantage: result.advantage,
    blocked: result.outcome === "block",
  };
}
