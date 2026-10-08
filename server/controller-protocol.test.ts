import { test } from "node:test";
import assert from "node:assert/strict";
import { KnobLines, mapTurn, parseKnobLine } from "./controller-protocol.js";

test("preserved serial framing recovers from split messages, boot noise and oversized input", () => {
  const lines = new KnobLines();
  assert.deepEqual(lines.push('{"v":1,'), []);
  assert.deepEqual(lines.push('"type":"ready"}\r\n'), [
    '{"v":1,"type":"ready"}',
  ]);
  assert.equal(parseKnobLine("ESP32 boot log"), null);
  assert.deepEqual(
    lines.push("x".repeat(10000) + '\n{"v":1,"type":"ready"}\n'),
    ['{"v":1,"type":"ready"}'],
  );
});

test("physical channels retain their corrected positions and reverse direction once", () => {
  const expected = ["power", "stance", "attack"];
  for (let knob = 0; knob < 3; knob++) {
    for (const delta of [-1, 1] as const) {
      const message = {
        v: 1 as const,
        type: "turn" as const,
        epoch: "monitor",
        seq: 1,
        knob,
        delta,
      };
      assert.deepEqual(parseKnobLine(JSON.stringify(message)), message);
      assert.deepEqual(mapTurn(message), {
        type: "turn",
        wheel: expected[knob],
        delta: -delta,
      });
    }
  }
});

test("malformed hardware messages cannot become turns or premature punches", () => {
  const message = {
    v: 1,
    type: "turn",
    epoch: "monitor",
    seq: 1,
    knob: 0,
    delta: 1,
  };
  for (const change of [
    { knob: 3 },
    { knob: -1 },
    { delta: 2 },
    { seq: 0 },
    { epoch: "" },
    { v: 2 },
    { type: "press" },
  ])
    assert.equal(
      parseKnobLine(JSON.stringify({ ...message, ...change })),
      null,
    );
});
