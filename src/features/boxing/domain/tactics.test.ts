import assert from "node:assert/strict";
import test from "node:test";
import { ATTACKS, STANCES } from "../../../../shared/input";
import {
  createStudy,
  command,
  step,
  snapshot,
  FIXED_STEP,
  strikeDuration,
} from "./study";
import {
  GUARDS,
  SCENARIOS,
  evaluatePunch,
  guardWeights,
  assessPlayer,
  punchContext,
  type PunchContext,
  type GuardShape,
  type FightPhase,
  type Motion,
} from "./tactics";
import type { StudyState } from "./types";
const base: PunchContext = {
  attack: "jab",
  power: 2,
  stance: "neutral",
  distance: 1.4,
  guard: "balanced",
  phase: "guard",
  motion: "circling",
  repeats: 0,
  combo: false,
};
function advance(s: StudyState, seconds: number) {
  for (let n = 0; n < Math.ceil(seconds / FIXED_STEP); n++) step(s, FIXED_STEP);
}
function score(guard: GuardShape, distance: number) {
  return ATTACKS.map((attack) =>
    evaluatePunch({ ...base, guard, distance, attack }),
  );
}

test("each punch wins a distinct controlled opening, while alternatives stay viable", () => {
  for (const [attack, guard, distance] of [
    ["jab", "right-low", 1.43],
    ["cross", "left-low", 1.4],
    ["hook", "high", 1.28],
    ["uppercut", "wide", 1.2],
  ] as const) {
    const scores = score(guard, distance),
      chosen = scores[ATTACKS.indexOf(attack)];
    for (const [index, other] of scores.entries())
      if (ATTACKS[index] !== attack)
        assert.ok(
          chosen.damage > other.damage,
          `${attack} should have the edge over ${ATTACKS[index]}: ${chosen.damage}/${other.damage}`,
        );
  }
  assert.ok(
    evaluatePunch({ ...base, guard: "balanced", attack: "jab" }).damage > 0,
  );
  assert.ok(
    evaluatePunch({ ...base, guard: "balanced", attack: "cross" }).damage > 0,
  );
});
test("coverage and guard laterality agree: the rival's right protects Jab, left protects Cross", () => {
  assert.ok(
    evaluatePunch({ ...base, guard: "right-low" }).damage >
      evaluatePunch({ ...base, guard: "left-low" }).damage,
  );
  assert.ok(
    evaluatePunch({ ...base, attack: "cross", guard: "left-low" }).damage >
      evaluatePunch({ ...base, attack: "cross", guard: "right-low" }).damage,
  );
  assert.equal(evaluatePunch({ ...base, guard: "high" }).outcome, "block");
  assert.equal(
    evaluatePunch({ ...base, guard: "wide", attack: "hook", distance: 1.25 })
      .outcome,
    "block",
  );
  assert.equal(
    evaluatePunch({ ...base, guard: "low", attack: "uppercut", distance: 1.2 })
      .outcome,
    "block",
  );
});
test("Defensive rewards timed counters; Offensive rewards close pressure; Neutral restores stamina faster", () => {
  const c = {
    ...base,
    attack: "cross" as const,
    phase: "recovery" as const,
    guard: "balanced" as const,
  };
  assert.ok(
    evaluatePunch({ ...c, stance: "defensive" }).multiplier >
      evaluatePunch({ ...c, stance: "neutral" }).multiplier,
  );
  const close = { ...base, attack: "hook" as const, distance: 1.28 };
  assert.ok(
    evaluatePunch({ ...close, stance: "offensive" }).damage >
      evaluatePunch({ ...close, stance: "neutral" }).damage,
  );
  const stamina = STANCES.slice(0, 3).map((stance, index) => {
    const s = createStudy();
    s.spacing.enabled = false;
    s.nextRival = 100;
    command(s, { type: "start" });
    command(s, { type: "select", wheel: "stance", index });
    s.stamina = 30;
    advance(s, 1);
    return s.stamina;
  });
  assert.ok(stamina[2] > stamina[0] && stamina[0] > stamina[1]);
});
test("a quick Jab interrupts windup, Cross rewards recovery, and hooks/uppercuts need the appropriate inside situation", () => {
  assert.equal(
    evaluatePunch({ ...base, phase: "windup", power: 1 }).outcome,
    "counter",
  );
  assert.equal(
    evaluatePunch({ ...base, phase: "windup", power: 4 }).outcome,
    "hit",
  );
  assert.equal(
    evaluatePunch({ ...base, attack: "cross", phase: "windup" }).outcome,
    "hit",
  );
  assert.equal(
    evaluatePunch({ ...base, attack: "cross", phase: "recovery" }).outcome,
    "counter",
  );
  assert.equal(
    evaluatePunch({
      ...base,
      attack: "hook",
      distance: 1.25,
      stance: "defensive",
      phase: "windup",
      motion: "closing",
    }).outcome,
    "counter",
  );
  assert.equal(
    evaluatePunch({
      ...base,
      attack: "hook",
      distance: 1.25,
      stance: "defensive",
      phase: "windup",
      motion: "retreating",
    }).outcome,
    "hit",
  );
  assert.equal(
    evaluatePunch({
      ...base,
      attack: "uppercut",
      distance: 1.2,
      phase: "windup",
      opponentAttack: "cross",
    }).outcome,
    "counter",
  );
});
test("fast lower-power punches can beat a closing guard that blocks maximum power", () => {
  const outcomes = [1, 4].map((power) => {
    const s = createStudy();
    command(s, { type: "start" });
    s.nextRival = 100;
    s.spacing.nextDecision = 100;
    s.spacing.guard = "right-low";
    s.spacing.guardNext = "high";
    s.spacing.guardAt = 0.24;
    s.selection.power = power;
    command(s, { type: "punch" });
    advance(s, 0.35);
    return s.lastEvent!;
  });
  assert.equal(outcomes[0].outcome, "hit");
  assert.ok(outcomes[0].damage! > 0);
  assert.equal(outcomes[1].outcome, "block");
  assert.equal(outcomes[1].damage, 0);
  assert.ok(strikeDuration("jab", 4) > strikeDuration("jab", 1));
});
test("combinations reward changing a landed line, cap escalation and never override a guard or miss", () => {
  assert.ok(
    evaluatePunch({ ...base, combo: true }).damage > evaluatePunch(base).damage,
  );
  assert.equal(
    evaluatePunch({ ...base, combo: true, guard: "high" }).damage,
    0,
  );
  assert.equal(evaluatePunch({ ...base, combo: true, distance: 2 }).damage, 0);
  const s = createStudy(true);
  command(s, { type: "scenario-lab", scenario: "cross-lane" });
  s.exchanges.player.lastLanded = "jab";
  s.exchanges.player.lastLandedAt = 0;
  s.exchanges.player.chain = 1;
  command(s, { type: "punch" });
  advance(s, 0.4);
  assert.equal(s.lastEvent?.reason, "Changed the attack line");
  assert.equal(s.exchanges.player.chain, 2);
  advance(s, 3);
  assert.equal(
    punchContext(s, "player", { attack: "cross", power: 2, stance: "neutral" })
      .combo,
    false,
  );
});
test("repetition reduces surprise, and guard adaptation learns only completed punches", () => {
  const s = createStudy(true);
  command(s, { type: "spacing-lab", enabled: true });
  const initial = guardWeights(s);
  command(s, { type: "select", wheel: "attack", index: 2 });
  assert.deepEqual(
    guardWeights(s),
    initial,
    "wheel changes alone must not teach the opponent",
  );
  s.exchanges.player.recent = ["jab", "jab", "jab"];
  assert.ok(guardWeights(s).high > initial.high);
  const fresh = evaluatePunch({ ...base, guard: "right-low" }),
    repeat = evaluatePunch({ ...base, guard: "right-low", repeats: 3 });
  assert.ok(repeat.damage < fresh.damage);
  assert.equal(repeat.reason, "Repeat anticipated");
  s.exchanges.player.recent = ["hook", "hook", "hook"];
  assert.ok(guardWeights(s).wide > initial.wide);
  s.exchanges.player.recent = ["uppercut", "uppercut", "uppercut"];
  assert.ok(guardWeights(s).low > initial.low);
});
test("an announced guard change has a visible preparation window before coverage activates", () => {
  const s = createStudy(true);
  command(s, { type: "spacing-lab", enabled: true });
  s.spacing.nextDecision = 0;
  step(s, FIXED_STEP);
  const selected = s.spacing.guardNext;
  assert.notEqual(selected, "open");
  assert.equal(s.spacing.guard, "open");
  advance(s, 0.2);
  assert.equal(s.spacing.guard, "open");
  advance(s, 0.2);
  assert.equal(s.spacing.guard, selected);
});
test("coverage is rechecked at contact and damage, stun and Super are never granted for a covered lane", () => {
  const s = createStudy();
  s.spacing.enabled = false;
  command(s, { type: "start" });
  s.spacing.guard = "right-low";
  s.selection.power = 4;
  command(s, { type: "punch" });
  assert.equal(s.playerStrike?.outcome, "hit");
  s.spacing.guard = "high";
  advance(s, 0.4);
  assert.equal(s.lastEvent?.outcome, "block");
  assert.equal(s.rivalHealth, 100);
  assert.equal(s.stunUntil.rival, 0);
  assert.equal(s.superCharge, 0);
});
test("earned Super amplifies a valid opening without turning a protected or distant punch into a hit", () => {
  assert.ok(
    evaluatePunch({ ...base, stance: "super" }).damage >
      evaluatePunch(base).damage,
  );
  assert.equal(
    evaluatePunch({ ...base, stance: "super", guard: "high" }).damage,
    0,
  );
  assert.equal(
    evaluatePunch({ ...base, stance: "super", distance: 2 }).damage,
    0,
  );
});
test("all controlled studies use normal rules, preserve health and reject entry from a real fight", () => {
  for (const scenario of Object.keys(SCENARIOS) as (keyof typeof SCENARIOS)[]) {
    const s = createStudy(true);
    command(s, { type: "scenario-lab", scenario });
    const before = snapshot(s);
    command(s, { type: "punch" });
    advance(s, 0.4);
    assert.equal(s.rivalHealth, 100);
    assert.equal(s.playerHealth, 100);
    assert.equal(s.rivalStrike, null);
    assert.equal(
      s.lastEvent?.outcome,
      before.opportunity.blocked
        ? "block"
        : scenario === "recovery"
          ? "counter"
          : "hit",
    );
    assert.equal(s.spacing.rehearsal, scenario);
    command(s, { type: "reset" });
    assert.equal(s.spacing.rehearsal, null);
  }
  const normal = createStudy();
  const before = structuredClone(normal);
  assert.deepEqual(
    command(normal, { type: "scenario-lab", scenario: "jab-lane" }),
    [],
  );
  assert.deepEqual(normal, before);
});
test("the 5,376-case factorial experiment stays bounded and leaves no universally best punch", () => {
  const winners = new Set<string>();
  let cases = 0;
  for (const guard of Object.keys(GUARDS) as GuardShape[])
    for (const phase of [
      "guard",
      "windup",
      "recovery",
      "stagger",
    ] as FightPhase[])
      for (const motion of ["closing", "retreating", "circling"] as Motion[])
        for (const stance of STANCES)
          for (const power of [1, 2, 3, 4]) {
            const scores = ATTACKS.map((attack) => {
              cases++;
              const r = evaluatePunch({
                ...base,
                attack,
                guard,
                phase,
                motion,
                stance,
                power,
                distance:
                  guard === "wide" ? 1.2 : guard === "high" ? 1.28 : 1.43,
              });
              assert.ok(
                Number.isFinite(r.damage) && r.damage >= 0 && r.damage <= 35,
              );
              assert.ok(r.multiplier <= 1.8);
              if (r.outcome === "block" || r.outcome === "whiff")
                assert.equal(r.damage, 0);
              return r.damage;
            });
            const best = Math.max(...scores);
            if (best > 0) winners.add(ATTACKS[scores.indexOf(best)]);
          }
  assert.equal(cases, 5376);
  assert.equal(winners.size, 4);
});
