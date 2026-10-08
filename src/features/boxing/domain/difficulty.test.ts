import test from "node:test";
import assert from "node:assert/strict";
import { createStudy, command, step, FIXED_STEP } from "./study";
import { observeOpponent, REACTION_SECONDS } from "./difficulty";
import { guardWeights } from "./tactics";
import { chooseOpponentAction, nextOpponentBeat, OPPONENTS } from "./opponent";
import { tacticWeights } from "./spacing";
function advance(s: ReturnType<typeof createStudy>, frames: number) {
  for (let n = 0; n < frames; n++) step(s, FIXED_STEP);
}
const hard = () => createStudy(false, 1299, "quickstep", true, "ring-sense");
test("Ring Sense never reads an unthrown wheel selection; visible punches have a reaction delay", () => {
  const s = hard();
  command(s, { type: "start" });
  command(s, { type: "select", wheel: "power", index: 3 });
  observeOpponent(s);
  s.time = REACTION_SECONDS;
  observeOpponent(s);
  assert.equal(s.opponent.awareness.noticed?.strike, null);
  assert.equal(s.nextRival, 4);
  const a = hard();
  command(a, { type: "start" });
  command(a, { type: "select", wheel: "power", index: 3 });
  command(a, { type: "punch" });
  observeOpponent(a);
  a.time = REACTION_SECONDS - 0.001;
  observeOpponent(a);
  assert.equal(a.opponent.awareness.noticed, null);
  assert.equal(a.nextRival, 4);
  a.time = REACTION_SECONDS;
  observeOpponent(a);
  assert.equal(structuredClone(a).opponent.awareness.noticed?.strike?.power, 4);
  assert.ok(a.nextRival >= a.time + 0.12 - 1e-9 && a.nextRival < 4);
});
test("awareness, its pending observations and decisions freeze with pause and hit-stop", () => {
  const s = hard();
  command(s, { type: "start" });
  advance(s, 3);
  command(s, { type: "pause" });
  const paused = structuredClone(s);
  advance(s, 90);
  assert.deepEqual(s, paused);
  command(s, { type: "resume" });
  s.hitStop = 0.5;
  const clock = s.time,
    awareness = structuredClone(s.opponent.awareness);
  advance(s, 1);
  assert.equal(s.time, clock);
  assert.deepEqual(s.opponent.awareness, awareness);
});
test("guard habit learning and heavy-shot footwork use delayed observations", () => {
  const s = hard();
  const before = guardWeights(s);
  s.exchanges.player.recent = ["hook", "hook", "hook"];
  assert.deepEqual(guardWeights(s), before);
  observeOpponent(s);
  s.time = REACTION_SECONDS;
  observeOpponent(s);
  assert.ok(guardWeights(s).wide > before.wide);
  const a = hard();
  command(a, { type: "start" });
  const beforeMove = tacticWeights(a).retreat;
  command(a, { type: "select", wheel: "power", index: 3 });
  command(a, { type: "punch" });
  assert.equal(tacticWeights(a).retreat, beforeMove);
  observeOpponent(a);
  a.time = REACTION_SECONDS;
  observeOpponent(a);
  assert.ok(tacticWeights(a).retreat > beforeMove);
});
test("aware counters preserve prior recovery; hard attacks retain readable windup and capped follow-ups", () => {
  const s = hard();
  command(s, { type: "start" });
  command(s, { type: "select", wheel: "power", index: 3 });
  command(s, { type: "punch" });
  s.opponent.awareness.busyUntil = 2;
  s.nextRival = 10;
  observeOpponent(s);
  s.time = REACTION_SECONDS;
  observeOpponent(s);
  assert.equal(s.nextRival, 2);
  for (const id of Object.keys(OPPONENTS) as (keyof typeof OPPONENTS)[]) {
    s.opponent.id = id;
    for (const roll of [0, 0.1, 0.8, 0.999]) {
      const plan = chooseOpponentAction(s, () => roll);
      assert.ok(plan.windup >= 0.48);
      const strike = {
        ...s.playerStrike!,
        duration: plan.windup + plan.recovery,
      };
      for (let n = 0; n < 9; n++) {
        const beat = nextOpponentBeat(s, strike, () => 0);
        assert.ok(beat >= s.time + strike.duration + 0.35 - 1e-9);
        assert.ok(s.opponent.chain < OPPONENTS[id].maxChain);
      }
    }
  }
});
test("difficulty preserves health and damage rules and cannot change in a running or paused bout", () => {
  const standard = createStudy(false, 1299, "quickstep", true);
  const aware = hard();
  for (const s of [standard, aware]) {
    command(s, { type: "start" });
    s.spacing.enabled = false;
    s.nextRival = 1000;
    command(s, { type: "select", wheel: "attack", index: 1 });
    command(s, { type: "punch" });
    advance(s, 90);
  }
  assert.equal(standard.rivalMaxHealth, aware.rivalMaxHealth);
  assert.equal(standard.rivalHealth, aware.rivalHealth);
  assert.equal(standard.superCharge, aware.superCharge);
  command(aware, { type: "encounter", id: "brick", difficulty: "standard" });
  assert.equal(aware.difficulty, "ring-sense");
  command(aware, { type: "pause" });
  command(aware, { type: "encounter", id: "brick", difficulty: "standard" });
  assert.equal(aware.difficulty, "ring-sense");
  command(aware, { type: "reset" });
  assert.equal(aware.difficulty, "ring-sense");
  assert.equal(aware.opponent.awareness.noticed, null);
  aware.phase = "loss";
  command(aware, { type: "retry" });
  assert.equal(aware.difficulty, "ring-sense");
  assert.equal(aware.opponent.awareness.pending, null);
});
test("Ring Sense remains seeded, varied, finite and stamina-limited over long rival runs", () => {
  const play = (seed: number) => {
    const s = createStudy(false, seed, "encore", true, "ring-sense");
    s.playerHealth = 100000;
    command(s, { type: "start" });
    for (let n = 0; n < 3600; n++) {
      step(s, FIXED_STEP);
      assert.ok(Number.isFinite(s.nextRival));
      assert.ok(s.spacing.rivalStamina >= 0 && s.spacing.rivalStamina <= 100);
      assert.ok(!(s.rivalStrike && s.opponent.feint));
      assert.ok(s.opponent.chain < OPPONENTS.encore.maxChain);
      assert.ok(s.spacing.guardAt <= s.time + 0.32 + 1e-9);
    }
    return s;
  };
  assert.deepEqual(play(921), play(921));
  assert.notDeepEqual(play(921).opponent, play(922).opponent);
});
