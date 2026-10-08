import { ATTACKS, type Attack } from "../../../../shared/input";
import type { StudyState, Strike } from "./types";
import { PUNCH_REACH } from "./reach";
import { createAwareness, type Awareness } from "./difficulty";
export const OPPONENTS = {
  quickstep: {
    name: "Pip “Two-Step”",
    shortName: "Pip",
    health: 160,
    style: "Probe and move",
    intro: "Fast feet. A suspiciously tidy left hook.",
    lesson: "Read the lowered glove. Start with light straight punches.",
    power: [1, 2],
    windup: 0.65,
    rest: 2.9,
    jitter: 1.4,
    feint: 0.14,
    chain: 0.12,
    maxChain: 2,
    advance: 0.8,
    retreat: 1.15,
    circle: 1.25,
  },
  brick: {
    name: "Bram “Brick”",
    shortName: "Bram",
    health: 180,
    style: "Heavy pressure",
    intro: "Built like a cupboard. Turns about as quickly.",
    lesson: "Make the heavy shot miss, then answer during recovery.",
    power: [2, 3, 4],
    windup: 0.8,
    rest: 2.65,
    jitter: 1.35,
    feint: 0.06,
    chain: 0.2,
    maxChain: 2,
    advance: 1.4,
    retreat: 0.65,
    circle: 0.65,
  },
  encore: {
    name: "Juno “Encore”",
    shortName: "Juno",
    health: 200,
    style: "Feint and counter",
    intro: "One bow. Two tricks. Never the same encore.",
    lesson: "Stay patient through feints. Change the line after landing.",
    power: [1, 2, 3],
    windup: 0.55,
    rest: 2.35,
    jitter: 1.4,
    feint: 0.3,
    chain: 0.3,
    maxChain: 3,
    advance: 1,
    retreat: 1.05,
    circle: 1.5,
  },
} as const;
export type OpponentId = keyof typeof OPPONENTS;
export interface OpponentState {
  id: OpponentId;
  awareness: Awareness;
  recent: Attack[];
  thrown: number;
  feints: number;
  chain: number;
  feint: Strike | null;
}
export function createOpponent(id: OpponentId = "quickstep"): OpponentState {
  return {
    id,
    awareness: createAwareness(),
    recent: [],
    thrown: 0,
    feints: 0,
    chain: 0,
    feint: null,
  };
}
export function attackWeights(s: StudyState): Record<Attack, number> {
  const d = Math.hypot(
    s.spacing.rival.x - s.spacing.player.x,
    s.spacing.rival.z - s.spacing.player.z,
  );
  const w = {
    jab: d > 1.38 ? 3 : 1.1,
    cross: d > 1.3 ? 2 : 1.3,
    hook: d < 1.38 ? 1.6 : 0.1,
    uppercut: d < 1.25 ? 2.1 : 0.1,
  };
  const hard = s.difficulty === "ring-sense";
  const read = s.opponent.awareness.noticed;
  const stance = hard ? (read?.stance ?? "neutral") : s.stance;
  const stamina = hard ? (read?.stamina ?? 100) : s.stamina;
  if (stance === "defensive" && d < 1.38) w.hook *= 2.2;
  if (hard && read?.strike) {
    const punch = read.strike;
    if (s.time < punch.started + punch.duration + 0.4) {
      if (s.time < punch.started + punch.contactAt) w.jab *= 2.1;
      else {
        w.cross *= 1.8;
        w.uppercut *= 1.4;
      }
    }
  }
  if (stamina < 25) {
    w.jab *= 1.4;
    w.cross *= 1.3;
  }
  if (s.opponent.id === "brick") {
    w.hook *= 1.35;
    w.uppercut *= 1.25;
  }
  if (s.opponent.id === "quickstep") w.jab *= 1.3;
  const last = s.opponent.recent.at(-1);
  if (last) w[last] *= 0.35;
  for (const attack of ATTACKS) if (d > PUNCH_REACH[attack]) w[attack] = 0;
  return w;
}
export function chooseOpponentAction(s: StudyState, random: () => number) {
  const profile = OPPONENTS[s.opponent.id],
    w = attackWeights(s);
  let n = random() * Object.values(w).reduce((a, b) => a + b, 0),
    attack: Attack = "jab";
  for (const key of ATTACKS) {
    n -= w[key];
    if (n <= 0) {
      attack = key;
      break;
    }
  }
  const hard = s.difficulty === "ring-sense";
  const feintChance = hard
    ? Math.min(0.45, profile.feint * 1.35 + 0.06)
    : profile.feint;
  const feint =
    s.opponent.thrown > 0 && s.opponent.chain === 0 && random() < feintChance;
  const affordable = profile.power.filter(
    (p) => 7 + p * 5 <= s.spacing.rivalStamina,
  );
  const seenPunch = s.opponent.awareness.noticed?.strike;
  const fastCounter =
    hard &&
    !!seenPunch &&
    s.time < seenPunch.started + seenPunch.duration &&
    s.time < seenPunch.started + seenPunch.contactAt;
  const efficient = fastCounter ? affordable.filter((p) => p <= 2) : affordable;
  const pool = efficient.length
      ? efficient
      : affordable.length
        ? affordable
        : [1],
    power = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
  const windup =
    Math.max(0.48, profile.windup * (hard ? 0.82 : 1)) + (power - 1) * 0.05;
  return {
    attack,
    power,
    feint,
    windup,
    recovery: power >= 3 ? 0.7 : 0.48,
    rest: profile.rest * (hard ? 0.55 : 1) + random() * profile.jitter,
  };
}
export function recordOpponentAttack(s: StudyState, a: Strike) {
  s.opponent.awareness.busyUntil = a.started + a.duration + 0.35;
  s.opponent.thrown++;
  s.opponent.recent.push(a.attack);
  if (s.opponent.recent.length > 4) s.opponent.recent.shift();
}
export function nextOpponentBeat(
  s: StudyState,
  a: Strike,
  random: () => number,
) {
  const profile = OPPONENTS[s.opponent.id];
  // A bounded follow-up always leaves the preceding punch's recovery and a clear preparation gap.
  const chained =
    s.opponent.chain < profile.maxChain - 1 &&
    s.spacing.rivalStamina > 35 &&
    random() <
      (s.difficulty === "ring-sense"
        ? Math.min(0.45, profile.chain * 1.5)
        : profile.chain);
  s.opponent.chain = chained ? s.opponent.chain + 1 : 0;
  return (
    s.time +
    a.duration +
    (chained
      ? 0.35
      : profile.rest * (s.difficulty === "ring-sense" ? 0.55 : 1) +
        random() * profile.jitter)
  );
}
