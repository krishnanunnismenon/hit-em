import * as THREE from "three";
import type { Resources } from "./Resources";

/** Three original toy canaries per boxer. Fixed instance pools; the combat clock owns their lifetime. */
export class StunBirds {
  readonly group = new THREE.Group();
  private body: THREE.InstancedMesh;
  private wings: THREE.InstancedMesh;
  private tails: THREE.InstancedMesh;
  private beaks: THREE.InstancedMesh;
  private eyes: THREE.InstancedMesh;
  private stars: THREE.InstancedMesh;
  private bird = new THREE.Object3D();
  private part = new THREE.Object3D();
  private matrix = new THREE.Matrix4();
  private origin = new THREE.Vector3();
  constructor(resources: Resources, accent: string) {
    const sphere = resources.geometry(
      "canary-sphere",
      () => new THREE.SphereGeometry(1, 10, 8),
    );
    const cone = resources.geometry(
      "canary-beak",
      () => new THREE.ConeGeometry(1, 1, 5),
    );
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + Math.PI / 2,
        radius = i % 2 ? 0.42 : 1;
      const x = Math.cos(angle) * radius,
        y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const star = resources.geometry(
      "canary-star",
      () => new THREE.ShapeGeometry(shape),
    );
    const pool = (
      geometry: THREE.BufferGeometry,
      color: string,
      count: number,
    ) => {
      const material = resources.material(color, 0.55, 0);
      const instance = new THREE.InstancedMesh(geometry, material, count);
      instance.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      instance.frustumCulled = false;
      this.group.add(instance);
      return instance;
    };
    this.body = pool(sphere, "#ffd344", 6);
    this.wings = pool(sphere, "#fff1bb", 6);
    this.tails = pool(sphere, accent, 3);
    this.beaks = pool(cone, "#ed7038", 3);
    this.eyes = pool(sphere, "#182124", 6);
    this.stars = pool(star, "#fff1bb", 3);
    this.group.name = "Stun canaries";
    this.group.visible = false;
  }
  reset() {
    this.group.visible = false;
  }
  private stamp(
    pool: THREE.InstancedMesh,
    index: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    rx = 0,
    ry = 0,
    rz = 0,
  ) {
    this.part.position.set(x, y, z);
    this.part.scale.set(sx, sy, sz);
    this.part.rotation.set(rx, ry, rz);
    this.part.updateMatrix();
    this.matrix.multiplyMatrices(this.bird.matrix, this.part.matrix);
    pool.setMatrixAt(index, this.matrix);
  }
  update(
    head: THREE.Object3D,
    time: number,
    remaining: number,
    reduced: boolean,
  ) {
    this.group.visible = remaining > 0;
    if (!this.group.visible) return;
    head.getWorldPosition(this.origin);
    // Stay above the hair, level in world space even when the boxer reels.
    this.group.position.copy(this.origin);
    this.group.position.y += 0.48;
    const exit = Math.min(1, remaining / 0.18);
    this.group.scale.setScalar(reduced ? 1 : exit);
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3 + (reduced ? 0 : time * 4.2);
      this.bird.position.set(
        Math.cos(angle) * 0.3,
        reduced ? 0 : Math.sin(angle * 2) * 0.024,
        Math.sin(angle) * 0.24,
      );
      this.bird.rotation.set(0, -angle, reduced ? 0 : Math.sin(angle) * 0.13);
      this.bird.scale.setScalar(1);
      this.bird.updateMatrix();
      this.stamp(this.body, i * 2, 0, 0, 0, 0.072, 0.052, 0.1);
      this.stamp(this.body, i * 2 + 1, 0, 0.05, 0.065, 0.049, 0.049, 0.049);
      this.stamp(this.tails, i, 0, 0.01, -0.105, 0.04, 0.025, 0.068, -0.32);
      this.stamp(
        this.beaks,
        i,
        0,
        0.043,
        0.12,
        0.025,
        0.049,
        0.023,
        Math.PI / 2,
      );
      const flap = reduced ? -0.25 : Math.sin(time * 24 + i * 1.4) * 0.65;
      for (const side of [-1, 1]) {
        const index = i * 2 + (side > 0 ? 1 : 0);
        this.stamp(
          this.wings,
          index,
          side * 0.085,
          0.008 + Math.sin(flap) * 0.035,
          -0.008,
          0.085,
          0.012,
          0.037,
          0,
          -side * 0.15,
          side * flap,
        );
        this.stamp(
          this.eyes,
          index,
          side * 0.034,
          0.06,
          0.096,
          0.009,
          0.012,
          0.008,
        );
      }
      this.bird.position.set(
        Math.cos(angle + 0.7) * 0.19,
        0.065,
        Math.sin(angle + 0.7) * 0.17,
      );
      this.bird.rotation.set(0, 0, reduced ? 0 : -angle);
      this.bird.updateMatrix();
      this.stamp(this.stars, i, 0, 0, 0, 0.037, 0.037, 0.037);
    }
    for (const pool of [
      this.body,
      this.wings,
      this.tails,
      this.beaks,
      this.eyes,
      this.stars,
    ])
      pool.instanceMatrix.needsUpdate = true;
  }
}
