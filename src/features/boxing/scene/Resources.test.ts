import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { Resources } from "./Resources";

function fixture() {
  const model = new THREE.Group();
  const geometry = new THREE.BoxGeometry();
  const texture = new THREE.Texture();
  const material = new THREE.MeshStandardMaterial({ map: texture });
  model.add(
    new THREE.Mesh(geometry, material),
    new THREE.Mesh(geometry, material),
  );
  const disposed = { geometry: 0, material: 0, texture: 0 };
  geometry.addEventListener("dispose", () => disposed.geometry++);
  material.addEventListener("dispose", () => disposed.material++);
  texture.addEventListener("dispose", () => disposed.texture++);
  return { model, disposed };
}

test("model ownership releases shared GLB resources once", () => {
  const resources = new Resources();
  const { model, disposed } = fixture();
  assert.equal(resources.adoptModel(model), true);
  resources.dispose();
  resources.dispose();
  assert.deepEqual(disposed, { geometry: 1, material: 1, texture: 1 });
});

test("a model arriving after unmount is released instead of retained", () => {
  const resources = new Resources();
  resources.dispose();
  const { model, disposed } = fixture();
  assert.equal(resources.adoptModel(model), false);
  assert.deepEqual(disposed, { geometry: 1, material: 1, texture: 1 });
});
