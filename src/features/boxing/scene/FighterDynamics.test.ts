import test from "node:test";
import assert from "node:assert/strict";
import { FighterDynamics } from "./FighterDynamics";

test("impulse grows with power, guard absorbs it, and misses transfer no momentum", () => {
  const low = new FighterDynamics(),
    high = new FighterDynamics(),
    guard = new FighterDynamics(),
    miss = new FighterDynamics();
  low.impact("cross", 1, "hit");
  high.impact("cross", 4, "hit");
  guard.impact("cross", 4, "block");
  miss.impact("cross", 4, "whiff");
  for (const f of [low, high, guard, miss]) f.advance(0.05);
  assert.ok(Math.abs(high.recoil.position) > Math.abs(low.recoil.position));
  assert.ok(Math.abs(guard.recoil.position) < Math.abs(low.recoil.position));
  assert.equal(miss.recoil.position, 0);
});
test("presentation is stable across frame rates, feet retain floor support and balance settles", () => {
  const fast = new FighterDynamics(),
    slow = new FighterDynamics();
  fast.impact("hook", 4, "hit");
  slow.impact("hook", 4, "hit");
  for (let i = 0; i < 480; i++) fast.advance(1 / 240);
  let peakLift = 0;
  for (let i = 0; i < 120; i++) {
    slow.advance(1 / 60);
    peakLift = Math.max(peakLift, ...slow.feet.map((f) => f.height));
    assert.ok(slow.feet.some((f) => f.height === 0));
    assert.ok(slow.feet.every((f) => f.height >= 0 && f.height <= 0.045));
  }
  assert.ok(
    peakLift > 0.04,
    "a strong hit must actually trigger a recovery step",
  );
  assert.ok(Math.abs(slow.recoil.position - fast.recoil.position) < 1e-8);
  assert.ok(Math.abs(slow.recoil.position) < 0.001);
  assert.ok(Math.abs(slow.roll.position) < 0.001);
});
test("zero elapsed pauses physics and reset removes prior impacts", () => {
  const f = new FighterDynamics();
  f.impact("uppercut", 3, "counter");
  f.advance(0.05);
  const z = f.recoil.position;
  f.advance(0);
  assert.equal(f.recoil.position, z);
  f.reset();
  f.advance(0.1);
  assert.equal(f.recoil.position, 0);
  assert.deepEqual(
    f.feet.map((x) => x.z),
    [-0.17, 0.24],
  );
});

test("head recoil follows the hit direction and reset removes neck motion", () => {
  const hit = new FighterDynamics(),
    guard = new FighterDynamics();
  hit.impact("hook", 4, "hit");
  guard.impact("hook", 4, "block");
  for (let i = 0; i < 12; i++) {
    hit.advance(1 / 120);
    guard.advance(1 / 120);
  }
  assert.ok(hit.headPitch.position < -0.08);
  assert.ok(hit.headYaw.position > 0.05);
  assert.ok(
    Math.abs(guard.headPitch.position) < Math.abs(hit.headPitch.position) * 0.3,
  );
  hit.reset();
  assert.equal(hit.headPitch.position, 0);
  assert.equal(hit.headYaw.velocity, 0);
});

test("every landed punch, including power one, earns a supported step; hook steps laterally and a guard braces", () => {
  for (const attack of ["jab", "cross", "hook", "uppercut"] as const)
    for (const power of [1, 2, 3, 4]) {
      const f = new FighterDynamics();
      f.impact(attack, power, "hit");
      let lift = 0,
        lateral = 0;
      for (let i = 0; i < 180; i++) {
        f.advance(1 / 120);
        lift = Math.max(lift, ...f.feet.map((x) => x.height));
        lateral = Math.max(lateral, ...f.feet.map((x) => x.x));
        assert.ok(f.feet.some((x) => x.height === 0));
      }
      assert.ok(lift > 0.015, `${attack}/${power} must step`);
      if (attack === "hook")
        assert.ok(lateral > 0.02, "hook must replant toward its side impulse");
    }
  const guard = new FighterDynamics();
  guard.impact("cross", 4, "block");
  guard.advance(0.05);
  assert.ok(guard.brace.position > 0);
  assert.equal(
    guard.feet.every((x) => x.height === 0),
    true,
  );
});
