import test from "node:test";
import assert from "node:assert/strict";
import { command, createStudy, step, FIXED_STEP } from "./study";
import {
  sweepSphere,
  contactShapes,
  contactPath,
  resolveContact,
} from "./contact";
function run(s: ReturnType<typeof createStudy>, seconds = 0.4) {
  for (let n = 0; n < Math.ceil(seconds / FIXED_STEP); n++) step(s, FIXED_STEP);
}
test("swept tip catches a shape crossed between frames, including rotated ellipsoids and stationary overlap", () => {
  const shape = { centre: { x: 0, y: 0, z: 0 }, radius: 0.2 };
  assert.ok(
    sweepSphere({ x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, shape)! < 0.5,
  );
  assert.equal(
    sweepSphere({ x: -1, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, shape),
    null,
  );
  assert.equal(
    sweepSphere({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, shape),
    0,
  );
  const ellipse = {
    ...shape,
    radii: { x: 0.4, y: 0.1, z: 0.1 },
    yaw: Math.PI / 2,
  };
  assert.ok(
    sweepSphere({ x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: 1 }, ellipse)! < 0.4,
  );
});
test("a fighter can evade a committed punch while remaining in root reach; the fist never follows the moved head", () => {
  const s = createStudy(true);
  command(s, { type: "scenario-lab", scenario: "jab-lane" });
  command(s, { type: "punch" });
  const aim = structuredClone(s.playerStrike!.contact!.aim);
  s.spacing.rival.x = s.spacing.player.x + 1.35;
  s.spacing.rival.z = s.spacing.player.z;
  s.spacing.rival.yaw = -Math.PI / 2;
  run(s);
  assert.equal(s.lastEvent?.outcome, "whiff");
  assert.equal(s.lastEvent?.missReason, "evaded");
  assert.deepEqual(s.playerStrike!.contact!.aim, aim);
  assert.equal(s.playerStrike!.contact!.surface, null);
});
test("contact closes at a protective glove/forearm before the face, without damage or Super", () => {
  const s = createStudy();
  s.spacing.rehearsal = "protected";
  s.spacing.guard = "right-low";
  s.spacing.guardNext = "right-low";
  command(s, { type: "start" });
  command(s, { type: "punch" });
  s.spacing.guard = s.spacing.guardNext = "high";
  run(s);
  assert.equal(s.lastEvent?.outcome, "block");
  assert.equal(s.playerStrike!.contact!.surface, "guard");
  assert.equal(s.rivalHealth, 100);
  assert.equal(s.superCharge, 0);
  assert.ok(s.playerStrike!.contact!.point);
});
test("all four fixed openings land through contact geometry; a covered high guard protects its lanes", () => {
  for (const scenario of [
    "jab-lane",
    "cross-lane",
    "hook-lane",
    "uppercut-lane",
    "protected",
  ] as const) {
    const s = createStudy(true);
    command(s, { type: "scenario-lab", scenario });
    command(s, { type: "punch" });
    run(s);
    assert.equal(
      s.lastEvent?.outcome,
      scenario === "protected" ? "block" : "hit",
      scenario,
    );
    assert.equal(
      s.playerStrike!.contact!.surface,
      scenario === "protected" ? "guard" : "head",
    );
  }
});
test("contact plans have distinct hook/rising uppercut paths and pause keeps committed geometry unchanged", () => {
  const paths = [];
  for (const scenario of ["jab-lane", "hook-lane", "uppercut-lane"] as const) {
    const s = createStudy(true);
    command(s, { type: "scenario-lab", scenario });
    command(s, { type: "punch" });
    const a = s.playerStrike!,
      p = contactPath(a, a.started + a.contactAt * 0.5)!;
    assert.ok([p.x, p.y, p.z].every(Number.isFinite));
    paths.push(p);
    command(s, { type: "pause" });
    const before = structuredClone(s);
    run(s, 1);
    assert.deepEqual(s, before);
  }
  assert.notDeepEqual(paths[0], paths[1]);
  assert.ok(paths[2].y < paths[0].y - 0.15);
});
test("range still has priority over volumes, and resolver does not mutate a prepared plan", () => {
  const s = createStudy(true);
  command(s, { type: "scenario-lab", scenario: "cross-lane" });
  command(s, { type: "punch" });
  const a = s.playerStrike!,
    before = structuredClone(a.contact);
  s.spacing.rival.x += 3;
  assert.equal(resolveContact(s, "player", a, "counter").outcome, "whiff");
  assert.deepEqual(a.contact, before);
  const shapes = contactShapes(s, "player");
  assert.ok(shapes.head.radii);
  assert.ok(shapes.gloves.every((v) => v.radius > 0));
});
