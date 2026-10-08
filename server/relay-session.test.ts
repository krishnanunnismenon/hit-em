import { test } from "node:test";
import assert from "node:assert/strict";
import { RelaySession, validOrigin } from "./relay-session";
import { KnobLines } from "./controller-protocol";
test("serial press and turns share one epoch and monotonic sequence; pause and resume reject old data", () => {
  const gate = new RelaySession(),
    lines = new KnobLines();
  gate.arm(true);
  const old = gate.epoch;
  const press = JSON.stringify({
    v: 1,
    type: "press",
    epoch: old,
    seq: 1,
    button: "power",
  });
  assert.deepEqual(lines.push(press.slice(0, 17)), []);
  const line = lines.push(press.slice(17) + "\n")[0];
  assert.deepEqual(gate.receive(line)?.input, { type: "punch" });
  assert.equal(gate.receive(line), null);
  assert.equal(
    gate.receive(
      JSON.stringify({
        v: 1,
        type: "turn",
        epoch: old,
        seq: 2,
        knob: 2,
        delta: 1,
      }),
    )?.input.type,
    "turn",
  );
  gate.arm(false);
  assert.equal(gate.receive(press), null);
  gate.arm(true);
  assert.notEqual(gate.epoch, old);
  assert.equal(gate.receive(press), null);
  assert.equal(
    gate.receive(
      JSON.stringify({
        v: 1,
        type: "press",
        epoch: gate.epoch,
        seq: 1,
        button: "attack",
      }),
    ),
    null,
  );
});
test("relay allows only local boxing development and preview origins", () => {
  for (const value of [
    undefined,
    "null",
    "http://evil.test:5174",
    "http://localhost:5173",
    "https://localhost:5174",
  ])
    assert.equal(validOrigin(value), false);
  assert.ok(validOrigin("http://localhost:5174"));
  assert.ok(validOrigin("http://127.0.0.1:4174"));
});
