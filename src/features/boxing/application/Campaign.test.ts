import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ROSTER,
  readProgress,
  readPreferences,
  completeBout,
  currentRival,
} from "./Campaign";
test("campaign saves accept only supported versions and bounded integer progress", () => {
  for (const raw of [
    null,
    "broken",
    "{}",
    '{"version":2,"cleared":1}',
    '{"version":1,"cleared":4}',
    '{"version":1,"cleared":1.5}',
  ])
    assert.equal(readProgress(raw).cleared, 0);
  assert.equal(readProgress('{"version":1,"cleared":2}').cleared, 2);
});
test("wins advance in roster order exactly once; replay and future wins cannot skip opponents", () => {
  let p = readProgress(null);
  assert.equal(completeBout(p, "encore"), p);
  for (const id of ROSTER) {
    assert.equal(currentRival(p), id);
    p = completeBout(p, id);
    assert.equal(completeBout(p, id), p);
    p = readProgress(JSON.stringify(p));
  }
  assert.equal(p.cleared, 3);
  assert.equal(currentRival(p), "encore");
});
test("preferences validate sound and an explicit motion override without overriding system defaults", () => {
  assert.deepEqual(readPreferences(null), {
    version: 1,
    sound: false,
    audio: { music: 0.42, effects: 0.85, ambience: 0.24 },
    reduced: null,
    difficulty: "standard",
  });
  assert.equal(
    readPreferences('{"version":1,"sound":true,"reduced":false}').reduced,
    false,
  );
  assert.equal(
    readPreferences('{"version":1,"sound":"yes","reduced":false}').sound,
    false,
  );
});

test("campaign encounters preserve endurance on retry and clear every prior combat action at transition", async () => {
  const { createStudy, command, step } = await import("../domain/study");
  const s = createStudy(false, 1299, "quickstep", true);
  command(s, { type: "start" });
  command(s, { type: "punch" });
  s.spacing.enabled = false;
  s.rivalHealth = 1;
  for (let i = 0; i < 600 && s.phase !== "victory"; i++) step(s, 1 / 60);
  assert.equal(s.phase, "victory");
  let p = completeBout(readProgress(null), s.opponent.id);
  command(s, { type: "encounter", id: currentRival(p), campaign: true });
  assert.equal(s.opponent.id, "brick");
  assert.equal(s.rivalHealth, 180);
  assert.equal(s.rivalMaxHealth, 180);
  assert.equal(s.playerStrike, null);
  assert.equal(s.rivalStrike, null);
  assert.equal(s.opponent.feint, null);
  assert.equal(s.superCharge, 0);
  assert.equal(s.phase, "ready");
  assert.deepEqual(s.fightStats, {
    landed: 0,
    blocked: 0,
    missed: 0,
    received: 0,
  });
  command(s, { type: "start" });
  s.phase = "loss";
  command(s, { type: "retry" });
  assert.equal(s.rivalHealth, 180);
  assert.equal(s.playerHealth, 100);
  assert.equal(p.cleared, 1);
});

test("difficulty preference migrates older settings and keeps each campaign save independent", async () => {
  const { progressKey, SAVE_KEY } = await import("./Campaign");
  assert.equal(
    readPreferences('{"version":1,"sound":true,"reduced":null}').difficulty,
    "standard",
  );
  assert.equal(
    readPreferences(
      '{"version":1,"sound":true,"reduced":null,"difficulty":"ring-sense"}',
    ).difficulty,
    "ring-sense",
  );
  assert.equal(
    readPreferences(
      '{"version":1,"sound":true,"reduced":null,"difficulty":"impossible"}',
    ).difficulty,
    "standard",
  );
  assert.equal(progressKey("standard"), SAVE_KEY);
  assert.notEqual(progressKey("standard"), progressKey("ring-sense"));
  const storage = new Map<string, string>();
  storage.set(
    progressKey("standard"),
    JSON.stringify({ version: 1, cleared: 2 }),
  );
  storage.set(
    progressKey("ring-sense"),
    JSON.stringify({ version: 1, cleared: 0 }),
  );
  assert.equal(readProgress(storage.get(progressKey("standard"))!).cleared, 2);
  assert.equal(
    readProgress(storage.get(progressKey("ring-sense"))!).cleared,
    0,
  );
});
