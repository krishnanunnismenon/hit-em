import assert from "node:assert/strict";
import test from "node:test";
import { command, createStudy, step, snapshot, FIXED_STEP } from "./study";
import {
  gap,
  MIN_GAP,
  RING_RADIUS,
  PUNCH_REACH,
  tacticWeights,
} from "./spacing";
import { StudyController } from "../application/StudyController";
import type { StudyState } from "./types";

function advance(s: StudyState, seconds: number) {
  for (let n = 0; n < Math.ceil(seconds / FIXED_STEP); n++) step(s, FIXED_STEP);
}
function distance(s: StudyState, d: number) {
  const p = s.spacing.player,
    r = s.spacing.rival;
  p.x = p.previousX = 0;
  p.z = p.previousZ = d / 2;
  r.x = r.previousX = 0;
  r.z = r.previousZ = -d / 2;
}
function isolated(d: number) {
  const s = createStudy();
  s.spacing.enabled = false;
  distance(s, d);
  command(s, { type: "start" });
  return s;
}

test("a far press stays a miss even if the rival comes into reach during windup", () => {
  const s = isolated(2.1);
  s.selection.power = 4;
  command(s, { type: "punch" });
  const strike = s.playerStrike!;
  assert.equal(strike.outcome, "whiff");
  assert.equal(s.stamina, 73);
  distance(s, 1.25);
  advance(s, 0.4);
  assert.equal(s.lastEvent?.outcome, "whiff");
  assert.equal(s.lastEvent?.missReason, "out-of-reach");
  assert.equal(s.rivalHealth, 100);
  assert.equal(s.superCharge, 0);
  assert.equal(s.stunUntil.rival, 0);
  assert.equal(s.playerStrike, strike, "misses still have recovery");
});
test("stepping beyond reach before contact cancels damage, charge and stun", () => {
  const s = isolated(1.3);
  s.selection.power = 4;
  command(s, { type: "punch" });
  assert.equal(s.playerStrike?.outcome, "hit");
  distance(s, 1.6);
  advance(s, 0.4);
  assert.equal(s.lastEvent?.outcome, "whiff");
  assert.equal(s.lastEvent?.missReason, "moved-away");
  assert.equal(s.rivalHealth, 100);
  assert.equal(s.superCharge, 0);
  assert.equal(s.stunUntil.rival, 0);
});
test("the timing cue and combat agree for all four reaches, including the boundary", () => {
  for (const attack of ["jab", "cross", "hook", "uppercut"] as const) {
    for (const offset of [-0.01, 0, 0.01]) {
      const s = isolated(PUNCH_REACH[attack] + offset);
      s.selection.attack = attack;
      const read = snapshot(s).spacing;
      assert.equal(read.inRange, offset <= 0);
      command(s, { type: "punch" });
      advance(s, 0.4);
      assert.equal(s.lastEvent?.outcome, read.inRange ? "hit" : "whiff");
      assert.equal(s.rivalHealth < 100, read.inRange);
    }
  }
  const s = isolated(1.4);
  assert.equal(snapshot(s).spacing.inRange, true);
  s.selection.attack = "hook";
  assert.equal(snapshot(s).spacing.inRange, false);
});
test("range still gates earned counters and guard advantages", () => {
  for (const attack of ["jab", "cross", "hook", "uppercut"] as const) {
    const s = isolated(1.2);
    s.selection.attack = attack;
    s.spacing.guard = "high";
    command(s, { type: "punch" });
    advance(s, 0.4);
    assert.equal(s.lastEvent?.outcome, attack === "hook" ? "hit" : "block");
  }
  const far = isolated(2);
  far.staggerUntil = 2;
  far.superCharge = 100;
  command(far, { type: "select", wheel: "stance", index: 3 });
  command(far, { type: "punch" });
  advance(far, 0.4);
  assert.equal(far.lastEvent?.outcome, "whiff");
  assert.equal(far.rivalHealth, 100);
});
test("retreat during a rival windup prevents damage without farming a perfect guard", () => {
  const s = isolated(1.3);
  s.nextRival = 0;
  step(s, FIXED_STEP);
  assert.ok(s.rivalStrike);
  advance(s, 0.3);
  command(s, { type: "select", wheel: "stance", index: 0 });
  distance(s, 1.8);
  advance(s, 0.5);
  assert.equal(s.lastEvent?.side, "rival");
  assert.equal(s.lastEvent?.outcome, "whiff");
  assert.equal(s.lastEvent?.missReason, "moved-away");
  assert.equal(s.playerHealth, 100);
  assert.equal(s.superCharge, 0);
  assert.equal(s.staggerUntil, 0);
});
test("defensive retreats, offensive closes and neutral seeks the selected technique's reach", () => {
  const results: number[] = [];
  for (const stance of [0, 1, 2, 3]) {
    const s = createStudy(true);
    command(s, { type: "spacing-lab", enabled: true });
    s.spacing.nextDecision = Infinity;
    s.stunUntil.rival = 100;
    distance(s, 1.65);
    command(s, { type: "select", wheel: "stance", index: stance });
    advance(s, 1);
    results.push(gap(s.spacing));
  }
  assert.ok(results[0] > 1.8, "defence creates a gap");
  assert.ok(results[1] < 1.4, "offence closes quickly");
  assert.ok(results[2] > results[1] && results[2] < 1.65);
  assert.ok(results[3] < results[1], "earned Super presses faster");
  const shorter = createStudy(true);
  command(shorter, { type: "spacing-lab", enabled: true });
  shorter.spacing.nextDecision = Infinity;
  shorter.stunUntil.rival = 100;
  distance(shorter, 1.65);
  shorter.selection.attack = "uppercut";
  advance(shorter, 2);
  assert.ok(gap(shorter.spacing) < PUNCH_REACH.uppercut);
});
test("opponent probabilities respond to range, fatigue, health and a heavy windup", () => {
  const s = isolated(1.5),
    base = tacticWeights(s);
  distance(s, 2);
  assert.ok(tacticWeights(s).advance > base.advance);
  distance(s, 1.5);
  s.spacing.rivalStamina = 20;
  assert.ok(tacticWeights(s).retreat > base.retreat);
  s.spacing.rivalStamina = 100;
  s.rivalHealth = 20;
  assert.ok(tacticWeights(s).retreat > base.retreat);
  s.rivalHealth = 100;
  s.selection.power = 4;
  command(s, { type: "punch" });
  assert.ok(tacticWeights(s).retreat > base.retreat);
  const w = tacticWeights(s);
  assert.ok(Math.abs(w.advance + w.retreat + w.circle - 1) < 1e-12);
});
test("seeded decisions vary across fights and wait between readable changes", () => {
  const tactics = new Set<string>();
  for (let seed = 0; seed < 12; seed++) {
    const s = createStudy(true, seed * 973);
    command(s, { type: "spacing-lab", enabled: true });
    advance(s, 1.2);
    tactics.add(s.spacing.tactic);
    const choices = s.spacing.decisions;
    advance(s, 0.8);
    assert.equal(s.spacing.decisions, choices);
  }
  assert.equal(tactics.size, 3);
});
test("two-minute mixed footwork stays bounded, separated and supports a planted foot", () => {
  const s = createStudy(true, 8765);
  command(s, { type: "spacing-lab", enabled: true });
  let movement = 0,
    swings = 0;
  for (let frame = 0; frame < 7200; frame++) {
    if (frame % 180 === 0)
      command(s, { type: "select", wheel: "stance", index: (frame / 180) % 4 });
    if (frame % 90 === 0) command(s, { type: "punch" });
    step(s, FIXED_STEP);
    assert.ok(gap(s.spacing) >= MIN_GAP - 0.001);
    for (const b of [s.spacing.player, s.spacing.rival]) {
      assert.ok(Math.hypot(b.x, b.z) <= RING_RADIUS + 1e-8);
      const travelled = Math.hypot(b.x - b.previousX, b.z - b.previousZ);
      movement += travelled;
      assert.ok(travelled < 0.025, "movement cannot teleport");
      assert.ok(b.feet.some((f) => f.y === 0));
      for (const f of b.feet) {
        assert.ok(f.y >= 0 && f.y <= 0.035 + 1e-8);
        if (f.previousY === 0 && f.y === 0) {
          assert.equal(f.x, f.previousX);
          assert.equal(f.z, f.previousZ);
        } else swings++;
      }
    }
  }
  assert.ok(movement > 10 && swings > 100);
  assert.equal(s.playerHealth, 100);
  assert.equal(s.rivalHealth, 100);
});
test("pause, hit-stop and knockout freeze locomotion and its random stream", () => {
  const s = createStudy();
  command(s, { type: "start" });
  advance(s, 2);
  command(s, { type: "pause" });
  const paused = structuredClone(s.spacing);
  advance(s, 3);
  assert.deepEqual(s.spacing, paused);
  command(s, { type: "resume" });
  s.hitStop = 0.04;
  step(s, FIXED_STEP);
  assert.deepEqual(s.spacing, paused);
  s.rivalHealth = 0;
  step(s, FIXED_STEP);
  const knockedOut = structuredClone(s.spacing);
  advance(s, 2);
  assert.deepEqual(s.spacing, knockedOut);
});
test("retry changes the random stream without losing the reset seed", () => {
  const s = createStudy(false, 456);
  s.phase = "victory";
  s.knockouts = 2;
  command(s, { type: "retry" });
  assert.equal(s.spacing.initialSeed, 456);
  assert.notEqual(s.spacing.random, 456);
  command(s, { type: "reset" });
  assert.deepEqual(s, createStudy(false, 456));
});
test("live lab rehearses misses with no damage; reset preserves the static technique lab", () => {
  const s = createStudy(true);
  command(s, { type: "start" });
  advance(s, 3);
  assert.equal(s.spacing.enabled, false);
  assert.equal(gap(s.spacing), 1.35);
  command(s, { type: "spacing-lab", enabled: true });
  assert.ok(gap(s.spacing) > 2);
  command(s, { type: "punch" });
  advance(s, 0.4);
  assert.equal(s.lastEvent?.outcome, "whiff");
  advance(s, 10);
  assert.equal(s.playerHealth, 100);
  assert.equal(s.rivalHealth, 100);
  assert.equal(s.rivalStrike, null);
  command(s, { type: "reset" });
  assert.equal(s.spacing.enabled, false);
  const normal = createStudy();
  assert.deepEqual(command(normal, { type: "spacing-lab", enabled: true }), []);
  assert.equal(normal.phase, "ready");
});
test("the same commands and seed reproduce spacing at 30, 60 and 120 render fps", () => {
  const runs = [30, 60, 120].map((fps) => {
    const c = new StudyController(true);
    c.dispatch({ type: "spacing-lab", enabled: true });
    for (let second = 0; second < 12; second++) {
      c.dispatch({ type: "select", wheel: "stance", index: second % 4 });
      c.dispatch({ type: "select", wheel: "attack", index: second % 4 });
      if (second % 3 === 0) c.dispatch({ type: "punch" });
      for (let f = 0; f < fps; f++) c.advance(1 / fps);
    }
    return c.state;
  });
  assert.deepEqual(runs[0], runs[1]);
  assert.deepEqual(runs[1], runs[2]);
});
