import assert from "node:assert/strict";
import test from "node:test";
import {
  command,
  createStudy,
  step,
  FIXED_STEP,
  strikeDuration,
} from "./study";
import { attackEnvelope } from "./motion";
function advance(s: ReturnType<typeof createStudy>, seconds: number) {
  for (let i = 0; i < Math.ceil(seconds / FIXED_STEP); i++) step(s, FIXED_STEP);
}
test("accepted strikes retain their attack and power while wheels prepare the next one", () => {
  const s = createStudy();
  command(s, { type: "start" });
  command(s, { type: "punch" });
  const first = s.playerStrike!;
  command(s, { type: "select", wheel: "attack", index: 3 });
  command(s, { type: "select", wheel: "power", index: 3 });
  command(s, { type: "punch" });
  assert.equal(s.playerStrike, first);
  assert.equal(first.attack, "jab");
  assert.equal(first.power, 2);
  advance(s, first.duration + 0.1);
  command(s, { type: "punch" });
  assert.equal(s.playerStrike!.attack, "uppercut");
  assert.equal(s.playerStrike!.power, 4);
});
test("pause freezes strike timing, stamina and rival intent until explicit resume", () => {
  const s = createStudy();
  command(s, { type: "start" });
  command(s, { type: "punch" });
  advance(s, 0.1);
  command(s, { type: "pause" });
  const before = JSON.stringify(s);
  advance(s, 4);
  assert.equal(JSON.stringify(s), before);
  command(s, { type: "resume" });
  advance(s, 0.2);
  assert.ok(s.playerStrike?.resolved);
});
test("unearned Super preserves the effective stance, earned Super expires predictably", () => {
  const s = createStudy();
  command(s, { type: "start" });
  command(s, { type: "select", wheel: "stance", index: 0 });
  command(s, { type: "select", wheel: "stance", index: 3 });
  assert.equal(s.stance, "defensive");
  s.superCharge = 100;
  command(s, { type: "select", wheel: "stance", index: 3 });
  assert.equal(s.stance, "super");
  assert.equal(s.superCharge, 0);
  advance(s, 8.2);
  assert.equal(s.superUntil, 0);
  assert.equal(s.stance, "neutral");
});
test("the active strike window resolves once and rejects input during recovery", () => {
  const s = createStudy();
  command(s, { type: "start" });
  command(s, { type: "punch" });
  advance(s, 0.3);
  const health = s.rivalHealth,
    charge = s.superCharge;
  advance(s, 0.2);
  assert.equal(s.rivalHealth, health);
  assert.equal(s.superCharge, charge);
  command(s, { type: "punch" });
  assert.equal(s.punches, 1);
});
test("timely defence creates an opening without an incoming health penalty", () => {
  const s = createStudy();
  s.spacing.enabled = false; // Isolate guard timing from a spacing dodge.
  command(s, { type: "start" });
  advance(s, 4.35);
  command(s, { type: "select", wheel: "stance", index: 0 });
  advance(s, 0.4);
  assert.equal(s.playerHealth, 100);
  assert.ok(s.staggerUntil > s.time);
  assert.equal(s.lastEvent?.text, "PERFECT GUARD");
});
test("low stamina prevents a strike and recovers to allow deliberate input", () => {
  const s = createStudy();
  command(s, { type: "start" });
  s.stamina = 3;
  command(s, { type: "punch" });
  assert.equal(s.playerStrike, null);
  advance(s, 1.2);
  command(s, { type: "punch" });
  assert.ok(s.playerStrike);
  assert.ok(s.stamina >= 0);
});
test("all punch envelopes start and finish in guard, with the same active timing across visual variants", () => {
  for (const attack of ["jab", "cross", "hook", "uppercut"] as const)
    for (const power of [1, 2, 3, 4]) {
      const duration = strikeDuration(attack, power),
        contactAt = 0.19 + (power - 1) * 0.035;
      for (const variant of [0, 1, 2]) {
        const strike = {
          attack,
          stance: "neutral" as const,
          power,
          variant,
          started: 0,
          duration,
          contactAt,
          resolved: false,
          outcome: "hit" as const,
        };
        assert.equal(attackEnvelope(strike, 0).extension, 0);
        assert.equal(attackEnvelope(strike, contactAt).extension, 1);
        assert.equal(attackEnvelope(strike, duration).extension, 0);
      }
    }
});
test("finished and ready sessions cannot emit attacks; reset clears the entire prior sequence", () => {
  const s = createStudy();
  command(s, { type: "punch" });
  assert.equal(s.punches, 0);
  command(s, { type: "start" });
  s.rivalHealth = 0;
  step(s, FIXED_STEP);
  assert.equal(s.phase, "sparring");
  assert.equal(s.knockout?.recipient, "rival");
  advance(s, s.knockout!.duration);
  assert.equal(s.phase, "victory");
  command(s, { type: "punch" });
  assert.equal(s.playerStrike, null);
  command(s, { type: "reset" });
  assert.deepEqual(s, createStudy());
});

test("stance is latched for an accepted technique while defence and next selection remain immediate", () => {
  const s = createStudy();
  command(s, { type: "start" });
  command(s, { type: "select", wheel: "stance", index: 1 });
  command(s, { type: "punch" });
  command(s, { type: "select", wheel: "stance", index: 0 });
  assert.equal(s.playerStrike!.stance, "offensive");
  assert.equal(s.stance, "defensive");
  assert.equal(s.selection.stance, "defensive");
});
test("the explicit technique lab supports every combination without changing normal sparring", () => {
  const s = createStudy(true);
  command(s, { type: "start" });
  for (const attack of [0, 1, 2, 3])
    for (const stance of [0, 1, 2, 3])
      for (const power of [0, 1, 2, 3]) {
        command(s, { type: "select", wheel: "attack", index: attack });
        command(s, { type: "select", wheel: "stance", index: stance });
        command(s, { type: "select", wheel: "power", index: power });
        command(s, { type: "punch" });
        assert.ok(s.playerStrike);
        assert.equal(s.playerStrike.stance, s.stance);
        advance(s, s.playerStrike.duration + 0.5);
        assert.equal(s.rivalStrike, null);
        assert.equal(s.rivalHealth, 100);
        assert.equal(s.playerHealth, 100);
      }
  assert.equal(s.punches, 64);
  command(s, { type: "reset" });
  assert.equal(s.training, true);
  assert.equal(s.superCharge, 100);
});

test("landed counters and clean maximum-power hits stun the recipient; guards and misses do not", () => {
  for (const [outcome, power, stunned] of [
    ["hit", 4, true],
    ["counter", 2, true],
    ["block", 4, false],
    ["whiff", 4, false],
  ] as const) {
    const s = createStudy();
    s.spacing.enabled = false;
    command(s, { type: "start" });
    if (outcome === "counter") s.staggerUntil = 1;
    if (outcome === "block") s.spacing.guard = "high";
    if (outcome === "whiff") s.spacing.rival.z -= 1;
    s.selection.power = power;
    command(s, { type: "punch" });
    advance(s, 0.4);
    assert.equal(s.lastEvent?.outcome, outcome);
    assert.equal(s.lastEvent?.recipient, "rival");
    assert.equal(s.lastEvent?.attack, "jab");
    assert.equal((s.lastEvent?.stunFor ?? 0) > 0, stunned);
    assert.equal(s.stunUntil.rival > s.time, stunned);
    assert.equal(s.stunUntil.player, 0);
  }
});
test("perfect guard is a block with an opening, not a landed stun on the defending player", () => {
  const s = createStudy();
  s.spacing.enabled = false; // Isolate guard timing from a spacing dodge.
  command(s, { type: "start" });
  advance(s, 4.35);
  command(s, { type: "select", wheel: "stance", index: 0 });
  advance(s, 0.4);
  assert.equal(s.lastEvent?.outcome, "block");
  assert.equal(s.lastEvent?.recipient, "player");
  assert.equal(s.lastEvent?.stunFor, 0);
  assert.equal(s.stunUntil.player, 0);
  assert.equal(s.playerHealth, 100);
});
test("rival catching a heavy windup stuns the player once, blocks punching, and expires on combat time", () => {
  const s = createStudy();
  command(s, { type: "start" });
  s.spacing.enabled = false; // Isolate interruption from seeded opponent selection and geometric evasion.
  s.nextRival = 100;
  s.rivalStrike = {
    attack: "cross",
    stance: "offensive",
    power: 2,
    variant: 0,
    started: 0,
    contactAt: 0.65,
    duration: 1.3,
    resolved: false,
    outcome: "hit",
  };
  advance(s, 0.5);
  command(s, { type: "select", wheel: "power", index: 3 });
  command(s, { type: "punch" });
  advance(s, 0.2);
  assert.equal(s.lastEvent?.side, "rival");
  assert.equal(s.lastEvent?.recipient, "player");
  assert.equal(s.lastEvent?.outcome, "counter");
  assert.equal(s.stunUntil.player > s.time, true);
  assert.equal(s.playerHealth, 89);
  assert.equal(s.playerStrike, null);
  command(s, { type: "punch" });
  assert.equal(s.playerStrike, null);
  command(s, { type: "pause" });
  const until = s.stunUntil.player,
    now = s.time;
  advance(s, 3);
  assert.equal(s.time, now);
  assert.equal(s.stunUntil.player, until);
  command(s, { type: "resume" });
  advance(s, 1.8);
  command(s, { type: "punch" });
  assert.ok(s.playerStrike);
});
test("reaction previews are lab-only, preserve health, target either boxer and clear on reset", () => {
  const normal = createStudy();
  command(normal, { type: "start" });
  const before = JSON.stringify(normal);
  assert.deepEqual(
    command(normal, {
      type: "preview-reaction",
      recipient: "player",
      outcome: "counter",
    }),
    [],
  );
  assert.equal(JSON.stringify(normal), before);
  const lab = createStudy(true);
  for (const recipient of ["player", "rival"] as const) {
    const [event] = command(lab, {
      type: "preview-reaction",
      recipient,
      outcome: "counter",
    });
    assert.equal(event.recipient, recipient);
    assert.notEqual(event.side, recipient);
    assert.equal(lab.playerHealth, 100);
    assert.equal(lab.rivalHealth, 100);
    assert.ok(lab.stunUntil[recipient] > lab.time);
  }
  command(lab, { type: "reset" });
  assert.deepEqual(lab.stunUntil, { player: 0, rival: 0 });
});

test("repeated heavy hits cannot renew a stagger until the recovery interval has elapsed", () => {
  const s = createStudy();
  s.spacing.enabled = false;
  s.nextRival = 100;
  command(s, { type: "start" });
  command(s, { type: "select", wheel: "power", index: 3 });
  command(s, { type: "punch" });
  advance(s, 0.4);
  const deadline = s.staggerUntil;
  assert.ok(deadline > s.time);
  advance(s, 1);
  s.stamina = 100;
  command(s, { type: "punch" });
  advance(s, 0.4);
  assert.equal(s.lastEvent?.stunFor, 0);
  assert.equal(s.staggerUntil, deadline);
  advance(s, 3.5);
  s.stamina = 100;
  command(s, { type: "punch" });
  advance(s, 0.4);
  assert.ok((s.lastEvent?.stunFor ?? 0) > 0);
});
