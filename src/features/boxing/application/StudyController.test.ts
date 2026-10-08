import assert from "node:assert/strict";
import test from "node:test";
import { StudyController } from "./StudyController";
test("a large render stall is bounded instead of fast forwarding through rival attacks", () => {
  const controller = new StudyController();
  controller.dispatch({ type: "start" });
  controller.advance(30);
  assert.ok(controller.state.time <= 0.101);
  assert.equal(controller.state.rivalStrike, null);
});
test("subscribers see selections immediately and unsubscribe safely", () => {
  const controller = new StudyController();
  let renders = 0;
  const unsubscribe = controller.subscribe(() => renders++);
  controller.dispatch({ type: "select", wheel: "power", index: 3 });
  assert.equal(controller.getSnapshot().selection.power, 4);
  assert.equal(renders, 1);
  unsubscribe();
  controller.dispatch({ type: "reset" });
  assert.equal(renders, 1);
});
