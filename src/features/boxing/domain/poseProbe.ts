import type { Attack, Stance } from "../../../../shared/input";

/** Validated labels for development-only deterministic pose evidence. */
export interface PoseProbe {
  attack: Attack;
  stance?: Stance;
  phase: "windup" | "contact" | "recoil";
  outcome: "hit" | "block";
  power: number;
}
export function readPoseProbe(search: string): PoseProbe | null {
  const params = new URLSearchParams(search);
  const attack = params.get("poseProbe");
  const stance = params.get("poseStance") ?? "neutral";
  const phase = params.get("posePhase") ?? "contact";
  const outcome = params.get("poseOutcome") ?? "hit";
  const power = Number(params.get("posePower") ?? 4);
  if (
    !["jab", "cross", "hook", "uppercut"].includes(attack ?? "") ||
    !["defensive", "offensive", "neutral", "super"].includes(stance) ||
    !["windup", "contact", "recoil"].includes(phase) ||
    !["hit", "block"].includes(outcome) ||
    ![1, 2, 3, 4].includes(power)
  )
    return null;
  return { attack, stance, phase, outcome, power } as PoseProbe;
}
export function poseProbeAge(probe: PoseProbe) {
  const contact = 0.19 + (probe.power - 1) * 0.035;
  return probe.phase === "windup"
    ? contact * 0.45
    : contact + (probe.phase === "recoil" ? 0.075 : 0);
}
