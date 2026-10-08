import type { OpponentState, OpponentId } from "./opponent";
import type { Difficulty } from "./difficulty";
import type {
  Attack,
  Stance,
  Wheel,
  Direction,
} from "../../../../shared/input";
import type { ContactPlan } from "./contact";
import type { SpacingState, SpacingRead } from "./spacing";
import type { Exchange, ScenarioId, Assessment } from "./tactics";
export type Phase = "ready" | "sparring" | "paused" | "victory" | "loss";
export type FighterSide = "player" | "rival";
export type Outcome = "hit" | "block" | "whiff" | "counter";
export interface Selection {
  attack: Attack;
  stance: Stance;
  power: number;
}
export interface Strike {
  attack: Attack;
  /** Effective stance latched at acceptance; later turns prepare the next technique. */
  stance: Stance;
  power: number;
  variant: number;
  started: number;
  duration: number;
  contactAt: number;
  resolved: boolean;
  outcome: Outcome;
  assessment?: Assessment;
  contact?: ContactPlan;
  reach?: number;
  distanceAtStart?: number;
}
export interface Knockout {
  recipient: FighterSide;
  variant: number;
  attack: Attack;
  power: number;
  started: number;
  duration: number;
  nextImpact: number;
  preview: boolean;
}
export interface StudyEvent {
  id: number;
  type: "strike" | "impact" | "notice" | "knockout" | "fall-impact";
  /** Attacker; recipient explicitly identifies the fighter absorbing contact. */
  side: FighterSide;
  recipient?: FighterSide;
  attack?: Attack;
  preview?: boolean;
  stunFor?: number;
  outcome?: Outcome;
  missReason?: "out-of-reach" | "moved-away" | "evaded";
  power: number;
  damage?: number;
  reason?: string;
  text: string;
}
export interface StudyState {
  /** Isolated animation lab: no damage or opponent, all techniques available. */
  training: boolean;
  difficulty: Difficulty;
  opponent: OpponentState;
  spacing: SpacingState;
  exchanges: Record<FighterSide, Exchange>;
  time: number;
  phase: Phase;
  selection: Selection;
  stance: Stance;
  playerHealth: number;
  rivalMaxHealth: number;
  campaign: boolean;
  fightStats: {
    landed: number;
    blocked: number;
    missed: number;
    received: number;
  };
  rivalHealth: number;
  stamina: number;
  superCharge: number;
  superUntil: number;
  playerStrike: Strike | null;
  rivalStrike: Strike | null;
  lastDefence: number;
  nextRival: number;
  staggerUntil: number;
  /** Minimum combat time before another stagger can be earned. */
  staggerReadyAt: Record<FighterSide, number>;
  stunUntil: Record<FighterSide, number>;
  hitStop: number;
  knockout: Knockout | null;
  knockouts: number;
  punches: number;
  eventId: number;
  lastEvent: StudyEvent | null;
}
export type StudyCommand =
  | {
      type: "encounter";
      id: OpponentId;
      campaign?: boolean;
      difficulty?: Difficulty;
    }
  | { type: "turn"; wheel: Wheel; delta: Direction }
  | { type: "select"; wheel: Wheel; index: number }
  | { type: "preview-reaction"; recipient: FighterSide; outcome: Outcome }
  | { type: "preview-knockout"; recipient: FighterSide; variant?: number }
  | { type: "spacing-lab"; enabled: boolean }
  | { type: "scenario-lab"; scenario: ScenarioId }
  | { type: "retry" }
  | { type: "punch" }
  | { type: "start" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "reset" };
export interface StudySnapshot {
  training: boolean;
  difficulty: Difficulty;
  opponent: { id: OpponentId; name: string; style: string; feinting: boolean };
  spacing: SpacingRead;
  opportunity: {
    title: string;
    tip: string;
    reason: string;
    advantage: boolean;
    blocked: boolean;
  };
  scenario: ScenarioId | null;
  phase: Phase;
  selection: Selection;
  stance: Stance;
  playerHealth: number;
  rivalMaxHealth: number;
  campaign: boolean;
  fightStats: {
    landed: number;
    blocked: number;
    missed: number;
    received: number;
  };
  rivalHealth: number;
  stamina: number;
  superCharge: number;
  superSeconds: number;
  recover: boolean;
  knockout: Knockout | null;
  technique: Pick<Strike, "attack" | "stance" | "power" | "variant"> | null;
  event: StudyEvent | null;
  cue: string;
  punches: number;
}
