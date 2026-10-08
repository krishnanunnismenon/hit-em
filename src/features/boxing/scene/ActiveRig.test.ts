import test from "node:test";
import assert from "node:assert/strict";
import { ActiveRig, Motor } from "./ActiveRig";

test("active motors retain inertia, settle without overshoot, and freeze at zero elapsed", () => {
  const m = new Motor(0, 78);
  m.integrate(1, 45, 0);
  assert.equal(m.position, 0);
  let previous = 0;
  for (let i = 0; i < 240; i++) {
    m.integrate(1, 45, 1 / 240);
    assert.ok(m.position >= previous && m.position <= 1);
    previous = m.position;
  }
  assert.ok(m.position > 0.999);
  m.integrate(0, 45, 1 / 240);
  assert.ok(m.position > 0.97, "a new goal cannot teleport a driven mass");
});
test("one fixed motor clock gives matching trajectories at 30/60/120 Hz and pauses cleanly", () => {
  const run = (fps: number) => {
    const rig = new ActiveRig(),
      motor = new Motor();
    for (let n = 1; n <= fps; n++)
      rig.advance(1 / fps, n / fps, (time, dt) =>
        motor.integrate(Math.sin(time * 5), 50, dt),
      );
    const before = motor.position;
    rig.advance(0, 1, (_time, dt) => motor.integrate(100, 50, dt));
    assert.equal(motor.position, before);
    return [motor.position, motor.velocity];
  };
  const reference = run(120);
  for (const fps of [30, 60])
    run(fps).forEach((value, i) =>
      assert.ok(Math.abs(value - reference[i]) < 1e-9),
    );
});
