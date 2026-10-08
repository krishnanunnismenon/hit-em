import assert from "node:assert/strict";
import test from "node:test";
import { ATTACKS, STANCES } from "../../../../shared/input";
import { footworkPlan } from "./footwork";
import { techniqueIntent } from "./technique";
import {
  command,
  createStudy,
  FIXED_STEP,
  step,
  strikeDuration,
} from "./study";
import type { Strike } from "./types";

function strike(
  attack: Strike["attack"],
  stance: Strike["stance"],
  power: number,
  variant: number,
): Strike {
  return {
    attack,
    stance,
    power,
    variant,
    started: 0,
    duration: strikeDuration(attack, power, stance, variant),
    contactAt: 0.19 + (power - 1) * 0.035,
    resolved: false,
    outcome: "hit",
  };
}

test("192 footwork paths have distinct tactics, never cross or lift both feet, and settle back to guard", () => {
  const fingerprints = new Set<string>();
  for (const attack of ATTACKS)
    for (const stance of STANCES)
      for (const power of [1, 2, 3, 4])
        for (const variant of [0, 1, 2]) {
          const a = strike(attack, stance, power, variant);
          const path: number[] = [];
          for (let frame = 0; frame <= Math.ceil(a.duration * 240); frame++) {
            const time = frame / 240;
            const i = techniqueIntent(a, stance, time);
            assert.ok(Object.values(i).every(Number.isFinite));
            assert.ok(
              !(i.leadLift > 1e-6 && i.rearLift > 1e-6),
              `${stance}/${attack}/${power}/${variant}: independent support`,
            );
            assert.ok(
              i.leadX - i.rearX > 0.3,
              "feet cannot cross or collapse the base",
            );
            assert.ok(i.leadZ - i.rearZ > 0.12, "lead/rear order is retained");
            if (frame % 12 === 0)
              path.push(
                i.rearX,
                i.leadX,
                i.rearZ,
                i.leadZ,
                i.rearYaw,
                i.leadYaw,
              );
          }
          fingerprints.add(path.map((x) => x.toFixed(4)).join("/"));
          const home = techniqueIntent(null, stance, a.duration);
          const finish = techniqueIntent(a, stance, a.duration);
          for (const field of [
            "rearX",
            "leadX",
            "rearZ",
            "leadZ",
            "rearYaw",
            "leadYaw",
            "rearLift",
            "leadLift",
          ] as const)
            assert.ok(
              Math.abs(home[field] - finish[field]) < 1e-9,
              `${field}: complete reset`,
            );
          const contact = techniqueIntent(a, stance, a.contactAt);
          assert.equal(
            contact.leadLift + contact.rearLift,
            0,
            "contact lands on supported feet",
          );
        }
  assert.equal(fingerprints.size, 192);
});

test("defence yields space, pressure closes it, and higher power commits more with longer recovery", () => {
  for (const attack of ATTACKS)
    for (const stance of STANCES)
      for (const variant of [0, 1, 2]) {
        const light = footworkPlan(attack, stance, 1, variant);
        const heavy = footworkPlan(attack, stance, 4, variant);
        assert.equal(
          heavy,
          footworkPlan(attack, stance, 4, variant),
          "plans are cached and immutable",
        );
        assert.ok(Object.isFrozen(heavy));
        assert.ok(heavy.crouch > light.crouch);
        assert.ok(heavy.recovery > light.recovery);
        assert.ok(
          strikeDuration(attack, 4, stance, variant) >
            strikeDuration(attack, 1, stance, variant),
        );
        if (stance === "defensive")
          assert.ok(heavy.exitZ < light.exitZ && light.exitZ < 0);
        if (stance === "offensive")
          assert.ok(heavy.leadZ > light.leadZ && light.leadZ > 0);
      }
});

test("fatigue reduces foot travel without changing the accepted hand/contact timing", () => {
  for (const stance of STANCES) {
    const a = strike("cross", stance, 4, 1);
    const fresh = techniqueIntent(a, stance, a.contactAt, 100);
    const tired = techniqueIntent(a, stance, a.contactAt, 10);
    const home = techniqueIntent(null, stance, a.contactAt, 100);
    assert.ok(
      Math.abs(tired.rearX - home.rearX) < Math.abs(fresh.rearX - home.rearX),
    );
    assert.equal(fresh.hand, tired.hand);
    assert.equal(fresh.returning, tired.returning);
  }
});

test("three passes through 64 accepted setups cover all 192 latched patterns and preserve rehearsal isolation", () => {
  const s = createStudy(true);
  command(s, { type: "start" });
  const accepted = new Set<string>();
  for (let index = 0; index < 192; index++) {
    const combination = index % 64;
    command(s, { type: "select", wheel: "attack", index: combination % 4 });
    command(s, {
      type: "select",
      wheel: "stance",
      index: Math.floor(combination / 16),
    });
    command(s, {
      type: "select",
      wheel: "power",
      index: Math.floor(combination / 4) % 4,
    });
    command(s, { type: "punch" });
    const a = s.playerStrike!;
    assert.ok(a);
    accepted.add(`${a.attack}/${a.stance}/${a.power}/${a.variant}`);
    assert.equal(
      a.duration,
      strikeDuration(a.attack, a.power, a.stance, a.variant),
    );
    const plan = footworkPlan(a.attack, a.stance, a.power, a.variant);
    command(s, { type: "select", wheel: "stance", index: 2 });
    command(s, { type: "select", wheel: "power", index: 0 });
    assert.equal(footworkPlan(a.attack, a.stance, a.power, a.variant), plan);
    for (
      let frame = 0;
      frame < Math.ceil((a.duration + 0.2) / FIXED_STEP);
      frame++
    )
      step(s, FIXED_STEP);
    assert.equal(s.playerStrike, null);
    assert.equal(s.rivalStrike, null);
    assert.equal(s.playerHealth, 100);
    assert.equal(s.rivalHealth, 100);
  }
  assert.equal(accepted.size, 192);
  command(s, { type: "reset" });
  assert.equal(s.punches, 0);
});
