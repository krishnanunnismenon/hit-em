import * as THREE from "three";
import type { Attack } from "../../../../shared/input";
import type { Outcome } from "../domain/types";
import type { Resources } from "./Resources";

interface EyePrint {
  mesh: THREE.Mesh;
  rest: Float32Array;
}
/** Animate the existing fitted facial prints; original sculpt and neutral expression stay intact. */
export class FaceReaction {
  private eyes: EyePrint[] = [];
  private brows: {
    mesh: THREE.Mesh;
    position: THREE.Vector3;
    rotation: number;
  }[];
  private mouth: THREE.Mesh;
  private mouthRest: THREE.Vector3;
  private age = 2;
  private strength = 0;
  private attack: Attack = "jab";
  private guarded = false;
  readonly dizzyEyes = new THREE.Group();
  readonly openMouth: THREE.Mesh;
  constructor(
    resources: Resources,
    head: THREE.Group,
    mouth: THREE.Mesh,
    brows: THREE.Mesh[],
  ) {
    this.mouth = mouth;
    this.mouthRest = mouth.position.clone();
    this.brows = brows.map((mesh) => ({
      mesh,
      position: mesh.position.clone(),
      rotation: mesh.rotation.z,
    }));
    head.traverse((object) => {
      if (
        object instanceof THREE.Mesh &&
        object.name.replaceAll("_", " ").startsWith("printed Head") &&
        /Printed white|Serious printed ink/.test(
          object.name.replaceAll("_", " "),
        )
      ) {
        this.eyes.push({
          mesh: object,
          rest: new Float32Array(object.geometry.attributes.position.array),
        });
      }
    });
    // Fitted ink overlays are projected once onto the actual sculpt, not billboards.
    head.updateWorldMatrix(true, true);
    const surfaces: THREE.Mesh[] = [];
    head.traverse((object) => {
      if (
        object instanceof THREE.Mesh &&
        object.name.replaceAll("_", " ").startsWith("Mould assembly Head") &&
        /plastic/i.test(object.name)
      )
        surfaces.push(object);
    });
    const ray = new THREE.Raycaster(),
      origin = new THREE.Vector3(),
      direction = new THREE.Vector3(),
      point = new THREE.Vector3();
    const project = (x: number, y: number) => {
      origin.set(x, y, 1);
      head.localToWorld(origin);
      direction.set(0, 0, -1).transformDirection(head.matrixWorld);
      ray.set(origin, direction);
      const hit = ray.intersectObjects(surfaces, false)[0];
      if (!hit)
        throw new Error("Facial print must fit the authored skin surface");
      head.worldToLocal(point.copy(hit.point));
      point.z += 0.003;
      return point.clone();
    };
    const ink = resources.ownMaterial(
      new THREE.MeshBasicMaterial({ color: "#161c1e", side: THREE.DoubleSide }),
    );
    for (const sign of [-1, 1]) {
      const positions: number[] = [],
        indices: number[] = [];
      for (let i = 0; i <= 36; i++) {
        const t = i / 36,
          angle = t * Math.PI * 3.8,
          radius = 0.003 + t * 0.032;
        const x = sign * 0.105 + Math.cos(angle) * radius;
        const y = 0.056 + Math.sin(angle) * radius;
        for (const offset of [-0.0024, 0.0024]) {
          const p = project(
            x + Math.cos(angle) * offset,
            y + Math.sin(angle) * offset,
          );
          positions.push(p.x, p.y, p.z);
        }
        if (i < 36) {
          const a = i * 2;
          indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geometry.setIndex(indices);
      resources.geometry(geometry.uuid, () => geometry);
      this.dizzyEyes.add(new THREE.Mesh(geometry, ink));
    }
    const points: number[] = [],
      indices: number[] = [];
    const center = project(0, -0.142);
    points.push(center.x, center.y, center.z);
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const p = project(
        Math.cos(angle) * 0.058,
        -0.142 + Math.sin(angle) * 0.034,
      );
      points.push(p.x, p.y, p.z);
      if (i < 32) indices.push(0, i + 1, i + 2);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3),
    );
    geometry.setIndex(indices);
    resources.geometry(geometry.uuid, () => geometry);
    this.openMouth = new THREE.Mesh(geometry, ink);
    this.openMouth.name = "Reaction mouth";
    this.dizzyEyes.name = "Dazed spiral eyes";
    head.add(this.openMouth, this.dizzyEyes);
    this.reset();
  }
  impact(attack: Attack, power: number, outcome: Outcome) {
    if (outcome === "whiff") return;
    this.attack = attack;
    this.guarded = outcome === "block";
    this.strength = this.guarded ? 0.22 : 0.55 + Math.min(4, power) * 0.11;
    this.age = 0;
  }
  reset() {
    this.age = 2;
    this.strength = 0;
    this.apply(0, false);
  }
  advance(dt: number, stunned: boolean) {
    this.age = Math.min(2, this.age + Math.max(0, Math.min(0.1, dt)));
    const envelope =
      this.age >= 0.8 ? 0 : Math.exp(-this.age * (this.guarded ? 10 : 5.5));
    this.apply(this.strength * envelope, stunned);
  }
  private apply(amount: number, stunned: boolean) {
    const hook = this.attack === "hook",
      uppercut = this.attack === "uppercut",
      cross = this.attack === "cross";
    this.eyes.forEach(({ mesh, rest }) => {
      const positions = mesh.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = rest[i * 3],
          y = rest[i * 3 + 1];
        const squint = stunned
          ? 0
          : Math.max(0.06, 1 - amount * (hook && x < 0 ? 1.22 : 0.94));
        positions.setXYZ(i, x, 0.056 + (y - 0.056) * squint, rest[i * 3 + 2]);
      }
      mesh.visible = !stunned;
      positions.needsUpdate = true;
    });
    this.brows.forEach(({ mesh, position, rotation }, index) => {
      const sign = index === 0 ? 1 : -1;
      mesh.position.copy(position);
      mesh.position.y += stunned
        ? 0.025
        : amount *
          (uppercut
            ? 0.018
            : hook && index === 0
              ? -0.014
              : cross
                ? -0.006
                : 0.008);
      mesh.rotation.z =
        rotation +
        sign *
          (stunned ? -0.22 : amount * (hook ? 0.21 : uppercut ? -0.14 : 0.11));
    });
    this.mouth.position.copy(this.mouthRest);
    this.mouth.scale.set(
      1 - amount * (hook ? 0.25 : 0.12),
      1 + amount * (uppercut ? 4 : cross ? 2.8 : 1.8),
      1,
    );
    this.mouth.rotation.z = hook ? amount * -0.16 : cross ? amount * 0.075 : 0;
    this.mouth.visible = !stunned;
    this.openMouth.visible = stunned;
    this.dizzyEyes.visible = stunned;
  }
}
