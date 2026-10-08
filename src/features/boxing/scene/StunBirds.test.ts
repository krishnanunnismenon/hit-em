import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { StunBirds } from "./StunBirds";
import { Resources } from "./Resources";

function matrices(birds: StunBirds) {
  return birds.group.children.flatMap((o) =>
    Array.from((o as THREE.InstancedMesh).instanceMatrix.array),
  );
}
test("canaries follow either head, orbit only on combat time, disappear at expiry, and reuse a fixed pool", () => {
  const resources = new Resources(),
    birds = new StunBirds(resources, "#2b73b9"),
    head = new THREE.Object3D();
  try {
    head.position.set(-0.44, 2.4, 0.57);
    birds.update(head, 1, 1.65, false);
    assert.equal(birds.group.visible, true);
    assert.ok(Math.abs(birds.group.position.y - 2.88) < 1e-9);
    const initial = matrices(birds);
    birds.update(head, 1, 1.65, false);
    assert.deepEqual(matrices(birds), initial, "pause freezes orbit and wings");
    birds.update(head, 1.2, 1.45, false);
    assert.notDeepEqual(matrices(birds), initial);
    head.position.set(0.37, 2.35, -0.51);
    birds.update(head, 1.2, 1.45, false);
    assert.equal(birds.group.position.x, 0.37);
    assert.equal(birds.group.children.length, 6);
    birds.update(head, 3, 0, false);
    assert.equal(birds.group.visible, false);
    birds.update(head, 4, 1, true);
    birds.reset();
    assert.equal(birds.group.visible, false);
  } finally {
    resources.dispose();
    birds.group.children.forEach((o) => (o as THREE.InstancedMesh).dispose());
  }
});
test("reduced-motion canaries retain the stun cue with static wings, stars and positions", () => {
  const resources = new Resources(),
    birds = new StunBirds(resources, "#b8442b"),
    head = new THREE.Object3D();
  try {
    birds.update(head, 1, 1, true);
    const first = matrices(birds);
    birds.update(head, 1.5, 0.5, true);
    assert.deepEqual(matrices(birds), first);
    assert.equal(birds.group.visible, true);
  } finally {
    resources.dispose();
    birds.group.children.forEach((o) => (o as THREE.InstancedMesh).dispose());
  }
});
