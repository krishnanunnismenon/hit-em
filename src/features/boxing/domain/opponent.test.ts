import test from "node:test";
import assert from "node:assert/strict";
import { ATTACKS } from "../../../../shared/input";
import { createStudy, command, step, FIXED_STEP } from "./study";
import {
  OPPONENTS,
  attackWeights,
  chooseOpponentAction,
  nextOpponentBeat,
  type OpponentId,
} from "./opponent";
import { spacingRandom } from "./spacing";
function advance(s: ReturnType<typeof createStudy>, seconds: number) {
  const events = [];
  for (let n = 0; n < Math.ceil(seconds / FIXED_STEP); n++)
    events.push(...step(s, FIXED_STEP));
  return events;
}
test("three distinct rival profiles reproduce seeded decisions and vary across seeds", () => {
  const states = [];
  for (const id of Object.keys(OPPONENTS) as OpponentId[]) {
    const play = (seed: number) => {
      const s = createStudy(false, seed, id);
      command(s, { type: "start" });
      advance(s, 35);
      return s;
    };
    assert.deepEqual(play(991), play(991));
    assert.notDeepEqual(play(991).opponent, play(992).opponent);
    states.push(play(991).opponent);
  }
  assert.equal(new Set(states.map((x) => x.id)).size, 3);
});
test("distance and held guard influence legal choices, repetition is discouraged and heavy shots need stamina", () => {
  const s = createStudy();
  s.spacing.rehearsal = "protected";
  const before = attackWeights(s);
  s.opponent.recent = ["jab"];
  assert.ok(attackWeights(s).jab < before.jab);
  s.stance = "defensive";
  assert.ok(attackWeights(s).hook > before.hook);
  s.opponent.id = "brick";
  s.spacing.rivalStamina = 17;
  for (let n = 0; n < 50; n++) {
    const plan = chooseOpponentAction(s, () => spacingRandom(s.spacing));
    assert.equal(plan.power, 2);
  }
  s.spacing.rival.x += 2;
  const far = attackWeights(s);
  assert.ok(ATTACKS.every((a) => far[a] === 0));
});
test("a feint has no strike event, damage, stun or defence reward; its clock freezes with pause", () => {
  const s = createStudy(false, 10, "encore");
  s.opponent.thrown = 2;
  const rolls = [0.1, 0.01, 0.6, 0.5];
  const plan = chooseOpponentAction(s, () => rolls.shift() ?? 0.5);
  assert.equal(plan.feint, true);
  command(s, { type: "start" });
  s.nextRival = 100;
  s.opponent.feint = {
    attack: "jab",
    stance: "neutral",
    power: 1,
    variant: 0,
    started: 0,
    contactAt: 0.8,
    duration: 0.6,
    resolved: false,
    outcome: "whiff",
  };
  command(s, { type: "select", wheel: "stance", index: 0 });
  advance(s, 0.2);
  command(s, { type: "pause" });
  const before = structuredClone(s);
  advance(s, 2);
  assert.deepEqual(s, before);
  command(s, { type: "resume" });
  const events = advance(s, 0.5);
  assert.equal(s.opponent.feint, null);
  assert.equal(s.playerHealth, 100);
  assert.equal(s.superCharge, 0);
  assert.ok(events.every((e) => e.type !== "impact" && e.type !== "strike"));
});
test("follow-ups are bounded and always permit recovery plus a visible preparation gap", () => {
  const s = createStudy(false, 1, "encore");
  const strike = {
    attack: "jab" as const,
    stance: "neutral" as const,
    power: 1,
    variant: 0,
    started: 0,
    duration: 1.1,
    contactAt: 0.6,
    resolved: false,
    outcome: "hit" as const,
  };
  for (let n = 0; n < 10; n++) {
    const beat = nextOpponentBeat(s, strike, () => 0);
    assert.ok(beat >= s.time + strike.duration + 0.35);
    assert.ok(s.opponent.chain < OPPONENTS.encore.maxChain);
  }
});
test("encounter changes are only allowed outside a fight; reset and retry retain the selected rival", () => {
  const s = createStudy();
  command(s, { type: "encounter", id: "brick" });
  assert.equal(s.opponent.id, "brick");
  command(s, { type: "start" });
  command(s, { type: "encounter", id: "encore" });
  assert.equal(s.opponent.id, "brick");
  command(s, { type: "reset" });
  assert.equal(s.opponent.id, "brick");
  s.phase = "loss";
  command(s, { type: "retry" });
  assert.equal(s.opponent.id, "brick");
  assert.equal(s.opponent.thrown, 0);
  assert.equal(s.opponent.feint, null);
});
test("long multi-seed rival runs retain finite bounded resources, variation and no overlapping feint/strike", () => {
  for (const id of Object.keys(OPPONENTS) as OpponentId[])
    for (const seed of [7, 93, 991, 1299]) {
      const s = createStudy(false, seed, id);
      s.playerHealth = 100000;
      s.rivalHealth = 100000;
      command(s, { type: "start" });
      for (let n = 0; n < 60 * 60; n++) {
        step(s, FIXED_STEP);
        assert.ok(s.spacing.rivalStamina >= 0 && s.spacing.rivalStamina <= 100);
        assert.ok(!(s.opponent.feint && s.rivalStrike));
        assert.ok(s.opponent.chain < OPPONENTS[id].maxChain);
      }
      assert.ok(s.opponent.thrown >= 3);
      assert.ok(s.opponent.recent.length <= 4);
    }
});
