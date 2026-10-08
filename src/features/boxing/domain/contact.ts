import type { Attack, Stance } from "../../../../shared/input";
import type { FighterSide, Strike, StudyState, Outcome } from "./types";
import { techniqueIntent } from "./technique";
import { guardGoal, GUARDS, rivalGuard } from "./tactics";
import { PUNCH_REACH } from "./reach";

export interface Point {
  x: number;
  y: number;
  z: number;
}
export interface Sphere {
  centre: Point;
  radius: number;
  radii?: Point;
  yaw?: number;
}
export interface ContactPlan {
  from: Point;
  aim: Point;
  previous: Point;
  point: Point | null;
  surface: "head" | "guard" | null;
}
const add = (a: Point, b: Point): Point => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});
const lerp = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: a.z + (b.z - a.z) * t,
});
const length = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
function rotate(v: Point, x: number, y: number, z = 0): Point {
  // Three's XYZ Euler contract, shared by the authored torso assembly.
  const cz = Math.cos(z),
    sz = Math.sin(z),
    cy = Math.cos(y),
    sy = Math.sin(y),
    cx = Math.cos(x),
    sx = Math.sin(x);
  const a = { x: v.x * cz - v.y * sz, y: v.x * sz + v.y * cz, z: v.z };
  const b = { x: a.x * cy + a.z * sy, y: a.y, z: -a.x * sy + a.z * cy };
  return { x: b.x, y: b.y * cx - b.z * sx, z: b.y * sx + b.z * cx };
}
/** Fitted simplified contact shapes. Render meshes never decide health. */
export function contactShapes(s: StudyState, side: FighterSide) {
  const root = s.spacing[side],
    scale = side === "rival" ? 1.02 : 1;
  const strike =
    side === "player" ? s.playerStrike : (s.rivalStrike ?? s.opponent.feint);
  const stance: Stance =
    side === "player"
      ? s.stance
      : s.staggerUntil > s.time
        ? "neutral"
        : s.spacing.guard === "high"
          ? "defensive"
          : s.spacing.tactic === "advance"
            ? "offensive"
            : "neutral";
  const intent = techniqueIntent(
    strike,
    stance,
    s.time,
    side === "player" ? s.stamina : s.spacing.rivalStamina,
  );
  const body = {
    x: intent.pelvisX,
    y: intent.pelvisY + 0.3,
    z: intent.pelvisZ,
  };
  const world = (v: Point): Point => {
    const local = add(
      body,
      rotate(v, intent.torsoPitch, intent.torsoYaw, intent.torsoRoll),
    );
    const p = rotate(
      { x: local.x * scale, y: local.y * scale, z: local.z * scale },
      0,
      root.yaw,
    );
    return { x: p.x + root.x, y: p.y + 0.055, z: p.z + root.z };
  };
  const head: Sphere = {
    centre: world({ x: 0, y: 0.89, z: 0 }),
    radius: 0.31 * scale,
    radii: { x: 0.32 * scale, y: 0.37 * scale, z: 0.25 * scale },
    yaw: root.yaw + intent.torsoYaw * 0.78,
  };
  const guard =
    side === "rival"
      ? rivalGuard(s)
      : s.stance === "defensive"
        ? "high"
        : "balanced";
  const gloves = [0, 1].map((hand) => {
    const goal = guardGoal(guard, hand),
      sign = hand === 0 ? -1 : 1;
    return {
      centre: world({
        x: sign * (intent.guardX + goal.x),
        y: intent.guardY + goal.y,
        z: intent.guardZ + goal.z + 0.15,
      }),
      radius: 0.22 * scale,
    };
  });
  // Lead left Jab/Hook faces the rival's right side. These are front/chin landmarks.
  const target = (attack: Attack) =>
    world({
      x: attack === "hook" ? -0.13 : -0.08,
      y: 0.89 + (attack === "uppercut" ? -0.2 : -0.1),
      z: attack === "uppercut" ? 0.19 : 0.25,
    });
  return { head, gloves, guard, target };
}
/** Earliest intersection of a swept glove sphere with a stationary shape. */
export function sweepSphere(
  a: Point,
  b: Point,
  sphere: Sphere,
  gloveRadius = 0.035,
): number | null {
  const axis = sphere.radii ?? {
    x: sphere.radius,
    y: sphere.radius,
    z: sphere.radius,
  };
  const radii = {
    x: axis.x + gloveRadius,
    y: axis.y + gloveRadius,
    z: axis.z + gloveRadius,
  };
  const local = (v: Point) => rotate(v, 0, -(sphere.yaw ?? 0));
  const delta = local({ x: b.x - a.x, y: b.y - a.y, z: b.z - a.z });
  const offset = local({
    x: a.x - sphere.centre.x,
    y: a.y - sphere.centre.y,
    z: a.z - sphere.centre.z,
  });
  const d = {
    x: delta.x / radii.x,
    y: delta.y / radii.y,
    z: delta.z / radii.z,
  };
  const m = {
    x: offset.x / radii.x,
    y: offset.y / radii.y,
    z: offset.z / radii.z,
  };
  const aa = d.x * d.x + d.y * d.y + d.z * d.z,
    bb = 2 * (m.x * d.x + m.y * d.y + m.z * d.z),
    cc = m.x * m.x + m.y * m.y + m.z * m.z - 1;
  if (cc <= 0) return 0;
  if (aa < 1e-12) return null;
  const discriminant = bb * bb - 4 * aa * cc;
  if (discriminant < 0) return null;
  const t = (-bb - Math.sqrt(discriminant)) / (2 * aa);
  return t >= 0 && t <= 1 ? t : null;
}
export function commitContact(
  s: StudyState,
  side: FighterSide,
  a: Strike,
): ContactPlan {
  const attacker = contactShapes(s, side),
    receiver = contactShapes(s, side === "player" ? "rival" : "player");
  const from =
    attacker.gloves[a.attack === "jab" || a.attack === "hook" ? 1 : 0].centre;
  const aim = receiver.target(a.attack);
  return { from, aim, previous: { ...from }, point: null, surface: null };
}
/** A committed line never homes onto a receiver who has moved after the press. */
export function contactPath(a: Strike, time: number): Point | null {
  const plan = a.contact;
  if (!plan) return null;
  const t = Math.max(0, Math.min(1, (time - a.started) / a.contactAt));
  const u = t * t * (3 - 2 * t);
  const mid = lerp(plan.from, plan.aim, 0.5);
  // Recognisable curved lanes; the contact endpoint is fixed, not a target tracker.
  if (a.attack === "hook") {
    const dx = plan.aim.x - plan.from.x,
      dz = plan.aim.z - plan.from.z,
      n = Math.hypot(dx, dz) || 1;
    mid.x -= (dz / n) * 0.32;
    mid.z += (dx / n) * 0.32;
  } else if (a.attack === "uppercut") mid.y -= 0.5;
  const first = lerp(plan.from, mid, u),
    second = lerp(mid, plan.aim, u);
  return lerp(first, second, u);
}
export function resolveContact(
  s: StudyState,
  side: FighterSide,
  a: Strike,
  requested: Outcome,
): { outcome: Outcome; point: Point | null; surface: ContactPlan["surface"] } {
  if (!a.contact) return { outcome: requested, point: null, surface: null }; // Explicit historic fixtures.
  const plan = a.contact,
    defender = contactShapes(s, side === "player" ? "rival" : "player");
  if (
    a.outcome === "whiff" ||
    Math.hypot(
      s.spacing.player.x - s.spacing.rival.x,
      s.spacing.player.z - s.spacing.rival.z,
    ) >
      PUNCH_REACH[a.attack] + 1e-9
  )
    return { outcome: "whiff", point: null, surface: null };
  // Resolve the active tip sweep against current volumes. Only the final 15% is active.
  const previous = contactPath(a, a.started + a.contactAt * 0.85)!;
  const endpoint = contactPath(a, s.time)!;
  const head = sweepSphere(previous, endpoint, defender.head);
  const protection = GUARDS[defender.guard][a.attack];
  let guard: number | null = null;
  if (requested === "block" || protection >= 0.9) {
    for (const glove of defender.gloves) {
      const t = sweepSphere(previous, endpoint, glove, 0.16);
      if (t !== null && (guard === null || t < guard)) guard = t;
    }
    // Forearms connect a closed glove to the face; sample the short protective capsule.
    const hand = a.attack === "jab" || a.attack === "hook" ? 0 : 1;
    const start = defender.gloves[hand].centre;
    for (let n = 0; n <= 4; n++) {
      const t = sweepSphere(
        previous,
        endpoint,
        { centre: lerp(start, defender.head.centre, n / 4), radius: 0.16 },
        0.1,
      );
      if (t !== null && (guard === null || t < guard)) guard = t;
    }
  }
  if (guard !== null && (head === null || guard <= head))
    return {
      outcome: "block",
      point: lerp(previous, endpoint, guard),
      surface: "guard",
    };
  if (head !== null && requested !== "block")
    return {
      outcome: requested,
      point: lerp(previous, endpoint, head),
      surface: "head",
    };
  return { outcome: "whiff", point: null, surface: null };
}
export function applyContact(
  a: Strike,
  result: ReturnType<typeof resolveContact>,
) {
  if (a.contact) {
    a.contact.point = result.point;
    a.contact.surface = result.surface;
  }
  return result.outcome;
}
export function contactDeviation(a: Strike, point: Point) {
  return a.contact ? length(a.contact.aim, point) : 0;
}

/** The scene can shorten the same committed line for an intercepting guard; it cannot home onto the head. */
export function presentationAim(
  s: StudyState,
  side: FighterSide,
  a: Strike,
): Point | null {
  if (!a.contact) return null;
  if (a.resolved) return a.contact.point ?? a.contact.aim;
  const future = { ...s, time: a.started + a.contactAt };
  const guard =
    side === "player"
      ? rivalGuard(s)
      : s.stance === "defensive"
        ? "high"
        : "balanced";
  const requested = GUARDS[guard][a.attack] >= 0.9 ? "block" : "hit";
  const predicted = resolveContact(future, side, a, requested);
  return predicted.surface === "guard" ? predicted.point : a.contact.aim;
}
