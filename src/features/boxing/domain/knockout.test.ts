import assert from "node:assert/strict";
import test from "node:test";
import { command, createStudy, step, FIXED_STEP } from "./study";
import { KNOCKOUT_STYLES, knockoutIntent } from "./knockout";
import type { Knockout, StudyState, StudyEvent } from "./types";

function run(s: StudyState, seconds: number) {
  const events: StudyEvent[] = [];
  for (let i = 0; i < Math.ceil(seconds / FIXED_STEP); i++)
    events.push(...step(s, FIXED_STEP));
  return events;
}
test("lethal punches start one fall on either boxer, cancel attacks and defer the result", () => {
  for (const recipient of ["player", "rival"] as const) {
    const s = createStudy();
    s.spacing.enabled = false; // This fixture isolates lethal event ordering; contact geometry has its own moving tests.
    command(s, { type: "start" });
    if (recipient === "rival") {
      s.rivalHealth = 1;
      command(s, { type: "punch" });
    } else {
      s.playerHealth = 1;
      s.nextRival = 0;
    }
    const events = run(s, recipient === "rival" ? 0.3 : 0.8);
    assert.equal(events.filter((e) => e.type === "knockout").length, 1);
    assert.equal(s.knockout?.recipient, recipient);
    assert.equal(s.phase, "sparring");
    assert.equal(s.playerStrike, null);
    assert.equal(s.rivalStrike, null);
    const health = [s.playerHealth, s.rivalHealth],
      selection = { ...s.selection },
      punches = s.punches;
    command(s, { type: "punch" });
    command(s, { type: "turn", wheel: "stance", delta: 1 });
    run(s, 1.2);
    assert.deepEqual([s.playerHealth, s.rivalHealth], health);
    assert.deepEqual(s.selection, selection);
    assert.equal(s.punches, punches);
    assert.equal(s.phase, "sparring");
    run(s, s.knockout!.duration);
    assert.equal(s.phase, recipient === "rival" ? "victory" : "loss");
    const final = JSON.stringify(s);
    run(s, 2);
    assert.equal(JSON.stringify(s), final);
  }
});
test("a defeated rival cannot deliver a queued posthumous punch", () => {
  const s = createStudy();
  s.spacing.enabled = false; // Isolate event ordering from the artificial zero-time strike geometry.
  command(s, { type: "start" });
  s.rivalHealth = 1;
  command(s, { type: "punch" });
  s.rivalStrike = { ...s.playerStrike!, contactAt: 0, power: 2 };
  s.playerStrike!.contactAt = 0;
  const events = step(s, FIXED_STEP);
  assert.equal(s.playerHealth, 100);
  assert.equal(events.filter((e) => e.type === "impact").length, 1);
  assert.equal(s.knockout?.recipient, "rival");
});
test("knockout pause freezes the fall clock and each landing event fires once after resume", () => {
  const s = createStudy(true);
  command(s, { type: "preview-knockout", recipient: "player", variant: 5 });
  run(s, 0.8);
  command(s, { type: "pause" });
  const frozen = JSON.stringify(s);
  assert.deepEqual(run(s, 5), []);
  assert.equal(JSON.stringify(s), frozen);
  command(s, { type: "resume" });
  const events = run(s, 5);
  assert.equal(events.filter((e) => e.type === "fall-impact").length, 2);
  assert.ok(events.every((e) => e.recipient === "player"));
  assert.deepEqual(run(s, 5), []);
});
test("retry advances through six escalating falls; reset clears the history", () => {
  const s = createStudy();
  command(s, { type: "start" });
  for (let defeat = 0; defeat < 8; defeat++) {
    s.rivalHealth = 0;
    step(s, FIXED_STEP);
    assert.equal(s.knockout?.variant, defeat % 6);
    run(s, s.knockout!.duration + 0.1);
    command(s, { type: "retry" });
    assert.equal(s.phase, "sparring");
    assert.equal(s.knockout, null);
    assert.equal(s.knockouts, defeat + 1);
    assert.equal(s.rivalHealth, 100);
  }
  command(s, { type: "reset" });
  assert.deepEqual(s, createStudy());
});
test("fall previews are lab-only, work on either boxer and preserve health through the full sequence", () => {
  const ordinary = createStudy();
  assert.deepEqual(
    command(ordinary, { type: "preview-knockout", recipient: "player" }),
    [],
  );
  assert.deepEqual(ordinary, createStudy());
  const s = createStudy(true);
  for (const recipient of ["player", "rival"] as const)
    for (let variant = 0; variant < 6; variant++) {
      const [event] = command(s, {
        type: "preview-knockout",
        recipient,
        variant,
      });
      assert.equal(event.type, "knockout");
      assert.equal(event.preview, true);
      assert.equal(s.knockout?.variant, variant);
      const events = run(s, KNOCKOUT_STYLES[variant].duration + 0.2);
      assert.equal(events.length, KNOCKOUT_STYLES[variant].impacts.length);
      assert.equal(s.phase, "sparring");
      assert.deepEqual([s.playerHealth, s.rivalHealth], [100, 100]);
    }
  command(s, { type: "reset" });
  assert.deepEqual(s, createStudy(true));
});
test("six choreography paths are finite and finish still; reduced motion removes comic flailing and full turns", () => {
  const finishes = new Set<string>();
  for (let variant = 0; variant < 6; variant++) {
    const knockout: Knockout = {
      recipient: "rival",
      variant,
      attack: "jab",
      power: 4,
      started: 0,
      duration: KNOCKOUT_STYLES[variant].duration,
      nextImpact: 0,
      preview: true,
    };
    for (const reduced of [false, true]) {
      for (let time = 0; time < knockout.duration + 1; time += 1 / 60) {
        const i = knockoutIntent(knockout, time, reduced);
        for (const v of Object.values(i).flat()) assert.ok(Number.isFinite(v));
        assert.ok(i.collapse >= 0 && i.collapse <= 1);
        if (reduced) {
          assert.equal(i.windmill + i.celebrate + i.flail + i.twitch, 0);
          assert.ok(Math.abs(i.yaw) < 0.7);
        }
      }
      assert.deepEqual(
        knockoutIntent(knockout, knockout.duration, reduced),
        knockoutIntent(knockout, knockout.duration + 4, reduced),
      );
    }
    finishes.add(JSON.stringify(knockoutIntent(knockout, knockout.duration)));
  }
  assert.equal(finishes.size, 6);
});
