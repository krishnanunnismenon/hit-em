import type { Attack, Stance } from "../../../../shared/input";
import type { StudyState } from "./types";
export const DIFFICULTIES = ["standard", "ring-sense"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  standard: "Standard",
  "ring-sense": "Ring Sense · Hard",
};
export const REACTION_SECONDS = 0.24;
export function isDifficulty(value: unknown): value is Difficulty {
  return value === "standard" || value === "ring-sense";
}
interface Perception {
  stance: Stance;
  stamina: number;
  recent: Attack[];
  strike: {
    attack: Attack;
    power: number;
    started: number;
    duration: number;
    contactAt: number;
  } | null;
}
export interface Awareness {
  noticed: Perception | null;
  pending: Perception | null;
  noticeAt: number;
  counterFor: number;
  busyUntil: number;
  tacticAt: number;
}
export function createAwareness(): Awareness {
  return {
    noticed: null,
    pending: null,
    noticeAt: 0,
    counterFor: -1,
    busyUntil: 0,
    tacticAt: 0,
  };
}
/** Observe accepted, visible actions only. Wheel selections and future commands are never read. */
export function observeOpponent(s: StudyState) {
  if (s.training || s.difficulty !== "ring-sense") return;
  const a = s.opponent.awareness;
  if (a.pending && s.time + 1e-9 >= a.noticeAt) {
    a.noticed = a.pending;
    a.pending = null;
    const punch = a.noticed.strike;
    if (
      punch &&
      punch.power >= 3 &&
      punch.started !== a.counterFor &&
      s.time < punch.started + punch.duration + 0.4
    ) {
      a.counterFor = punch.started;
      // Existing recovery remains mandatory. The counter still has its own visible windup.
      s.nextRival = Math.min(s.nextRival, Math.max(s.time + 0.12, a.busyUntil));
    }
    if (s.time >= a.tacticAt) {
      s.spacing.nextDecision = Math.min(s.spacing.nextDecision, s.time + 0.18);
      a.tacticAt = s.time + 0.95;
    }
  }
  if (!a.pending) {
    const punch = s.playerStrike;
    a.pending = {
      stance: s.stance,
      stamina: s.stamina,
      recent: [...s.exchanges.player.recent],
      strike: punch
        ? {
            attack: punch.attack,
            power: punch.power,
            started: punch.started,
            duration: punch.duration,
            contactAt: punch.contactAt,
          }
        : null,
    };
    a.noticeAt = s.time + REACTION_SECONDS;
  }
}
