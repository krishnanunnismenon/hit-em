import assert from "node:assert/strict";
import { WebSocket } from "ws";
const origin = "http://localhost:5174",
  base = "http://127.0.0.1:3110";
assert.equal(
  (
    await fetch(base + "/session", {
      headers: { Origin: "http://evil.test:5174" },
    })
  ).status,
  403,
);
const token = (
  await (await fetch(base + "/session", { headers: { Origin: origin } })).json()
).token;
const ws = new WebSocket(`ws://127.0.0.1:3110/controller?token=${token}`, {
  headers: { Origin: origin },
});
const messages: any[] = [];
ws.on("message", (bytes) => messages.push(JSON.parse(bytes.toString())));
await new Promise<void>((resolve, reject) => {
  ws.once("open", resolve);
  ws.once("error", reject);
});
const until = async (predicate: () => boolean) => {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline) throw Error("Relay test timed out");
    await new Promise((r) => setTimeout(r, 10));
  }
};
ws.send(JSON.stringify({ type: "arm", enabled: true }));
await until(() => messages.some((m) => m.type === "status" && m.epoch));
const first = messages.filter((m) => m.type === "status").at(-1).epoch;
for (const input of [
  { type: "turn", wheel: "attack", delta: 1 },
  { type: "turn", wheel: "power", delta: -1 },
  { type: "punch" },
])
  ws.send(JSON.stringify({ type: "simulate", input }));
await until(() => messages.filter((m) => m.type === "input").length === 3);
assert.deepEqual(
  messages.filter((m) => m.type === "input").map((m) => m.seq),
  [1, 2, 3],
);
ws.send(JSON.stringify({ type: "arm", enabled: false }));
ws.send(JSON.stringify({ type: "simulate", input: { type: "punch" } }));
await until(() => messages.some((m) => m.type === "status" && m.epoch === ""));
ws.send(JSON.stringify({ type: "arm", enabled: true }));
await until(() =>
  messages.some((m) => m.type === "status" && m.epoch && m.epoch !== first),
);
ws.send(JSON.stringify({ type: "simulate", input: { type: "punch" } }));
await until(() => messages.filter((m) => m.type === "input").length === 4);
assert.equal(messages.filter((m) => m.type === "input").at(-1).seq, 1);
assert.notEqual(messages.filter((m) => m.type === "input").at(-1).epoch, first);
ws.close();
console.log(
  "Controller smoke passed: origin authentication, semantic wheel/press transport, pause suppression and fresh resume epoch. Simulated; no USB used.",
);
