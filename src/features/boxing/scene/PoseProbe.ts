import * as THREE from "three";
import { STANCES } from "../../../../shared/input";
import { command, createStudy } from "../domain/study";
import type { Fighter, FighterPose } from "./Fighter";
import { poseProbeAge, type PoseProbe } from "../domain/poseProbe";

export function applyPoseProbe(
  player: Fighter,
  rival: Fighter,
  probe: PoseProbe,
) {
  const state = createStudy(true);
  state.selection.attack = probe.attack;
  state.selection.power = probe.power;
  command(state, { type: "start" });
  command(state, {
    type: "select",
    wheel: "stance",
    index: STANCES.indexOf(probe.stance ?? "neutral"),
  });
  command(state, { type: "punch" });
  const strike = { ...state.playerStrike!, outcome: probe.outcome };
  const base: FighterPose = {
    time: 0,
    dt: 1,
    stance: probe.stance ?? "neutral",
    strike: null,
    stamina: 100,
    reaction: 0,
    reactionAttack: probe.attack,
    reactionOutcome: probe.outcome,
    variant: 0,
    knockout: null,
  };
  player.resetDynamics();
  rival.resetDynamics();
  player.pose(base);
  rival.pose({ ...base, stance: "defensive", variant: 2 });
  player.setAim(
    rival.attackTarget(probe.attack, probe.outcome, new THREE.Vector3()),
  );
  const age = poseProbeAge(probe);
  let time = 0;
  let impacted = false;
  while (time < age - 1e-8) {
    const dt = Math.min(1 / 120, age - time);
    time += dt;
    if (!impacted && time >= strike.contactAt - 1e-8) {
      impacted = true;
      strike.resolved = true;
      rival.impact(probe.attack, probe.power, probe.outcome);
    }
    player.pose({ ...base, time, dt, strike, stamina: state.stamina });
    rival.pose({
      ...base,
      time,
      dt: impacted && probe.phase === "contact" ? 0 : dt,
      stance: "defensive",
      variant: 2,
      reaction: impacted
        ? (probe.outcome === "block" ? 0.35 : 0.7 + probe.power * 0.12) *
          Math.exp(-(time - strike.contactAt) * 9)
        : 0,
    });
  }
  if (probe.phase === "contact")
    player.pose({
      ...base,
      time: strike.contactAt,
      dt: 0,
      strike,
      stamina: state.stamina,
    });
  return age;
}
