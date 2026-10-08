import { OPPONENTS } from "./opponent";
import type { Attack, Stance } from "../../../../shared/input";
import type { StudyState, Strike, Outcome } from "./types";
import { smooth } from "./motion";

import { PUNCH_REACH, MIN_GAP, RING_RADIUS } from "./reach";
export { PUNCH_REACH, MIN_GAP, RING_RADIUS } from "./reach";
import {
  GUARDS,
  guardWeights,
  rivalGuard,
  assessPlayer,
  type GuardShape,
  type ScenarioId,
} from "./tactics";
export type Tactic = "advance" | "retreat" | "circle";
export interface Toe {
  x: number;
  z: number;
  y: number;
  previousX: number;
  previousZ: number;
  previousY: number;
  fromX: number;
  fromZ: number;
  toX: number;
  toZ: number;
}
export interface RingBoxer {
  x: number;
  z: number;
  previousX: number;
  previousZ: number;
  yaw: number;
  vx: number;
  vz: number;
  feet: [Toe, Toe];
  swing: number;
  stepStarted: number;
  stepDuration: number;
  nextFoot: number;
}
export interface SpacingState {
  enabled: boolean;
  initialSeed: number;
  random: number;
  player: RingBoxer;
  rival: RingBoxer;
  tactic: Tactic;
  guard: GuardShape;
  guardNext: GuardShape;
  guardAt: number;
  rehearsal: ScenarioId | null;
  nextDecision: number;
  decisions: number;
  circle: number;
  rivalStamina: number;
}
export interface SpacingRead {
  enabled: boolean;
  distance: number;
  reach: number;
  inRange: boolean;
  attack: Attack;
  intent: string;
  guard: string;
  closing: boolean;
}
export interface GaitOffsets {
  rearX: number;
  rearZ: number;
  leadX: number;
  leadZ: number;
  rearLift: number;
  leadLift: number;
}
const clamp = (v: number, low: number, high: number) =>
  Math.min(high, Math.max(low, v));
function boxer(x: number, z: number, yaw: number): RingBoxer {
  const feet = [-1, 1].map((sign) => {
    const lx = sign * 0.245,
      lz = sign === -1 ? 0 : 0.41;
    const tx = x + Math.cos(yaw) * lx + Math.sin(yaw) * lz;
    const tz = z - Math.sin(yaw) * lx + Math.cos(yaw) * lz;
    return {
      x: tx,
      z: tz,
      y: 0,
      previousX: tx,
      previousZ: tz,
      previousY: 0,
      fromX: tx,
      fromZ: tz,
      toX: tx,
      toZ: tz,
    };
  }) as [Toe, Toe];
  return {
    x,
    z,
    previousX: x,
    previousZ: z,
    yaw,
    vx: 0,
    vz: 0,
    feet,
    swing: -1,
    stepStarted: 0,
    stepDuration: 0.28,
    nextFoot: 1,
  };
}
export function createSpacing(
  enabled = true,
  seed = 1299,
  far = false,
  distance = far ? 2.0655 : 1.35,
): SpacingState {
  const spread = distance / 1.35;
  return {
    enabled,
    initialSeed: seed >>> 0,
    random: seed >>> 0,
    player: boxer(-0.44 * spread, 0.57 * spread, 2.5),
    rival: boxer(0.37 * spread, -0.51 * spread, -0.64),
    tactic: "advance",
    guard: "open",
    guardNext: "open",
    guardAt: 0,
    rehearsal: null,
    nextDecision: 1.15,
    decisions: 0,
    circle: 1,
    rivalStamina: 100,
  };
}
/** Only the pure fixed-step engine consumes this stream. Rendering never draws it. */
export function spacingRandom(s: SpacingState) {
  s.random = (Math.imul(1664525, s.random) + 1013904223) >>> 0;
  return s.random / 4294967296;
}
export function gap(s: SpacingState) {
  return Math.hypot(s.rival.x - s.player.x, s.rival.z - s.player.z);
}
export function tacticWeights(s: StudyState) {
  const far = gap(s.spacing) > 1.8;
  const hard = s.difficulty === "ring-sense";
  const read = s.opponent.awareness.noticed;
  const stance = hard ? (read?.stance ?? "neutral") : s.stance;
  const stamina = hard ? (read?.stamina ?? 100) : s.stamina;
  const punch = hard ? read?.strike : s.playerStrike;
  const heavy =
    !!punch && punch.power >= 3 && s.time < punch.started + punch.duration;
  const advance =
    0.38 +
    (far ? 0.65 : 0) +
    (stance === "defensive" ? 0.18 : 0) +
    (stamina < 28 ? (hard ? 0.6 : 0.2) : 0);
  const retreat =
    (0.2 +
      (s.spacing.rivalStamina < 32 ? 0.65 : 0) +
      (s.rivalHealth < 30 ? 0.35 : 0) +
      (heavy ? (hard ? 1.05 : 0.45) : 0) +
      (stance === "offensive" ? 0.25 : 0)) *
    (far ? 0.4 : 1);
  const circle = 0.28 + (gap(s.spacing) < 1.3 ? 0.22 : 0);
  const profile = OPPONENTS[s.opponent.id];
  const sum =
    advance * profile.advance +
    retreat * profile.retreat +
    circle * profile.circle;
  return {
    advance: (advance * profile.advance) / sum,
    retreat: (retreat * profile.retreat) / sum,
    circle: (circle * profile.circle) / sum,
  };
}
function chooseTactic(s: StudyState) {
  const weights = tacticWeights(s),
    roll = spacingRandom(s.spacing),
    space = s.spacing;
  space.tactic =
    roll < weights.advance
      ? "advance"
      : roll < weights.advance + weights.retreat
        ? "retreat"
        : "circle";
  const guards = guardWeights(s);
  let selection =
    spacingRandom(space) *
    Object.values(guards).reduce((sum, value) => sum + value, 0);
  for (const key of Object.keys(guards) as GuardShape[]) {
    selection -= guards[key];
    if (selection <= 0) {
      space.guardNext = key;
      break;
    }
  }
  space.guardAt = s.time + 0.32; // Visible change before coverage takes effect.
  space.circle = spacingRandom(space) < 0.5 ? -1 : 1;
  space.nextDecision =
    s.time +
    (s.difficulty === "ring-sense" ? 0.95 : 1.25) +
    spacingRandom(space) * 1.05;
  space.decisions++;
}
function contain(b: RingBoxer) {
  const r = Math.hypot(b.x, b.z);
  if (r > RING_RADIUS) {
    b.x *= RING_RADIUS / r;
    b.z *= RING_RADIUS / r;
  }
}
function advanceFeet(b: RingBoxer, time: number, moving: boolean) {
  for (const f of b.feet) {
    f.previousX = f.x;
    f.previousZ = f.z;
    f.previousY = f.y;
  }
  if (b.swing >= 0) {
    const f = b.feet[b.swing],
      phase = clamp((time - b.stepStarted) / b.stepDuration, 0, 1),
      t = smooth(phase);
    f.x = f.fromX + (f.toX - f.fromX) * t;
    f.z = f.fromZ + (f.toZ - f.fromZ) * t;
    f.y = 0.035 * Math.sin(phase * Math.PI);
    if (phase >= 1) {
      f.y = 0;
      b.swing = -1;
    }
  }
  if (!moving || b.swing >= 0) return;
  const n = b.nextFoot,
    f = b.feet[n],
    lx = n === 0 ? -0.245 : 0.245,
    lz = n === 0 ? 0 : 0.41;
  const tx = b.x + Math.cos(b.yaw) * lx + Math.sin(b.yaw) * lz + b.vx * 0.14;
  const tz = b.z - Math.sin(b.yaw) * lx + Math.cos(b.yaw) * lz + b.vz * 0.14;
  if (Math.hypot(tx - f.x, tz - f.z) < 0.09) return;
  f.fromX = f.x;
  f.fromZ = f.z;
  f.toX = tx;
  f.toZ = tz;
  b.swing = n;
  b.nextFoot = 1 - n;
  b.stepStarted = time;
}
function move(
  b: RingBoxer,
  tx: number,
  tz: number,
  dt: number,
  locked: boolean,
) {
  b.previousX = b.x;
  b.previousZ = b.z;
  const blend = 1 - Math.exp(-dt * 9);
  b.vx = locked ? 0 : b.vx + (tx - b.vx) * blend;
  b.vz = locked ? 0 : b.vz + (tz - b.vz) * blend;
  b.x += b.vx * dt;
  b.z += b.vz * dt;
  contain(b);
}
/** Real separation and seeded movement are gameplay state. Toe anchors are presentation metadata. */
export function advanceSpacing(s: StudyState, dt: number) {
  const space = s.spacing;
  if (!space.enabled || space.rehearsal) return;
  if (s.time >= space.guardAt) space.guard = space.guardNext;
  if (
    s.time >= space.nextDecision &&
    !s.rivalStrike &&
    s.stunUntil.rival <= s.time
  )
    chooseTactic(s);
  const p = space.player,
    r = space.rival,
    d = gap(space),
    ux = (r.x - p.x) / d,
    uz = (r.z - p.z) / d;
  const stance: Stance = s.stance;
  const target =
    {
      defensive: 2.12,
      offensive: 1.2,
      neutral: PUNCH_REACH[s.selection.attack] - 0.06,
      super: 1.18,
    }[stance] + (s.stamina < 22 ? 0.15 : 0);
  const pace =
    { defensive: 0.46, offensive: 0.48, neutral: 0.28, super: 0.62 }[stance] *
    (0.6 + s.stamina * 0.004);
  const drive =
    Math.abs(d - target) < 0.045 ? 0 : clamp((d - target) * 1.5, -pace, pace);
  const rivalTarget =
    space.tactic === "advance"
      ? 1.24
      : space.tactic === "retreat"
        ? 2.13
        : 1.48;
  const rivalPace =
    (space.tactic === "advance" ? 0.54 : 0.56) *
    (0.65 + space.rivalStamina * 0.0035);
  const rivalDrive =
    Math.abs(d - rivalTarget) < 0.045
      ? 0
      : clamp((d - rivalTarget) * 1.6, -rivalPace, rivalPace);
  const lateral = space.tactic === "circle" ? space.circle * 0.16 : 0;
  move(
    p,
    ux * drive,
    uz * drive,
    dt,
    !!s.playerStrike || s.stunUntil.player > s.time,
  );
  move(
    r,
    -ux * rivalDrive - uz * lateral,
    -uz * rivalDrive + ux * lateral,
    dt,
    !!s.rivalStrike || s.stunUntil.rival > s.time,
  );
  // Projection prevents body overlap. A bounded ring keeps retreats from escaping the arena.
  for (let n = 0; n < 4; n++) {
    const separation = gap(space);
    if (separation >= MIN_GAP) break;
    const x = (r.x - p.x) / Math.max(separation, 0.001),
      z = (r.z - p.z) / Math.max(separation, 0.001),
      push = (MIN_GAP - separation) * 0.5;
    p.x -= x * push;
    p.z -= z * push;
    r.x += x * push;
    r.z += z * push;
    contain(p);
    contain(r);
  }
  const facing = Math.atan2(r.x - p.x, r.z - p.z);
  for (const [b, goal] of [
    [p, facing],
    [r, facing + Math.PI],
  ] as const) {
    const delta = Math.atan2(Math.sin(goal - b.yaw), Math.cos(goal - b.yaw));
    b.yaw += clamp(delta, -dt * 2.4, dt * 2.4);
    advanceFeet(b, s.time, Math.hypot(b.vx, b.vz) > 0.02);
  }
  const spent = Math.hypot(r.vx, r.vz) * 6;
  space.rivalStamina = clamp(
    space.rivalStamina + dt * ((s.rivalStrike ? 1 : 6) - spent),
    0,
    100,
  );
}
export function inPunchRange(space: SpacingState, attack: Attack) {
  return gap(space) <= PUNCH_REACH[attack] + 1e-9;
}
export function playerOutcome(s: StudyState, attack: Attack): Outcome {
  return assessPlayer(s, { attack, stance: s.stance, power: s.selection.power })
    .outcome;
}
export function resolveRange(space: SpacingState, strike: Strike): Outcome {
  return strike.outcome === "whiff" ||
    gap(space) > (strike.reach ?? PUNCH_REACH[strike.attack]) + 1e-9
    ? "whiff"
    : strike.outcome;
}
export function rivalAttack(s: SpacingState): Attack {
  const d = gap(s),
    n = spacingRandom(s);
  if (d > 1.38) return n < 0.6 ? "jab" : "cross";
  if (d > 1.32) return n < 0.35 ? "hook" : n < 0.7 ? "jab" : "cross";
  return n < 0.4 ? "uppercut" : n < 0.7 ? "hook" : "cross";
}
export function spacingRead(s: StudyState): SpacingRead {
  const space = s.spacing,
    d = gap(space),
    attack = s.playerStrike?.attack ?? s.selection.attack;
  const intent = space.rehearsal
    ? "Fixed spacing"
    : s.stunUntil.rival > s.time
      ? "Rival recovering"
      : s.rivalStrike
        ? "Rival throwing"
        : {
            advance: "Rival closing in",
            retreat: "Rival making space",
            circle: "Rival circling",
          }[space.tactic];
  const dx = space.rival.x - space.player.x,
    dz = space.rival.z - space.player.z;
  return {
    enabled: space.enabled,
    distance: d,
    reach: PUNCH_REACH[attack],
    inRange: d <= PUNCH_REACH[attack],
    attack,
    intent,
    guard:
      !s.rivalStrike &&
      space.guardAt > s.time &&
      space.guardNext !== space.guard
        ? {
            open: "Guard opening",
            balanced: "Guard rebalancing",
            "left-low": "Left glove dropping",
            "right-low": "Right glove dropping",
            high: "Centre closing",
            wide: "Guard widening",
            low: "Elbows tucking",
          }[space.guardNext]
        : s.rivalStrike && !s.rivalStrike.resolved
          ? rivalGuard(s) === "left-low"
            ? "Rival’s left side open"
            : "Rival’s right side open"
          : GUARDS[rivalGuard(s)].label,
    closing:
      dx * (space.rival.vx - space.player.vx) +
        dz * (space.rival.vz - space.player.vz) <
      -0.03,
  };
}
/** Toe offsets in the moving fighter's local coordinates, interpolated like the root. */
export function gaitOffsets(
  b: RingBoxer,
  alpha = 1,
  out: GaitOffsets = {
    rearX: 0,
    rearZ: 0,
    leadX: 0,
    leadZ: 0,
    rearLift: 0,
    leadLift: 0,
  },
): GaitOffsets {
  const x = b.previousX + (b.x - b.previousX) * alpha,
    z = b.previousZ + (b.z - b.previousZ) * alpha;
  for (let n = 0; n < 2; n++) {
    const f = b.feet[n],
      dx = f.previousX + (f.x - f.previousX) * alpha - x,
      dz = f.previousZ + (f.z - f.previousZ) * alpha - z;
    const localX =
      Math.cos(b.yaw) * dx - Math.sin(b.yaw) * dz - (n === 0 ? -0.245 : 0.245);
    const localZ =
      Math.sin(b.yaw) * dx + Math.cos(b.yaw) * dz - (n === 0 ? 0 : 0.41);
    const lift = f.previousY + (f.y - f.previousY) * alpha;
    if (n === 0) {
      out.rearX = localX;
      out.rearZ = localZ;
      out.rearLift = lift;
    } else {
      out.leadX = localX;
      out.leadZ = localZ;
      out.leadLift = lift;
    }
  }
  return out;
}
