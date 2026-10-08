import * as THREE from "three";
import type { Knockout } from "../domain/types";
import { knockoutIntent, knockoutStyle } from "../domain/knockout";
import type { FighterArm, FighterLeg } from "./FighterModel";
import { smooth } from "../domain/motion";

const UP = new THREE.Vector3(0, 1, 0);
/** Articulated toy falls. Reuses the loaded meshes and fixed-length limbs.
 * One captured pose blends into choreography; conservative mesh bounds support
 * the entire fallen figure, rather than allowing head/gloves through the mat. */
export class KnockoutRig {
  private pivot = new THREE.Group();
  private current: Knockout | null = null;
  private bodyStart = new THREE.Vector3();
  private hipsStart = new THREE.Vector3();
  private bodyRotation = new THREE.Quaternion();
  private hipsRotation = new THREE.Quaternion();
  private headRotation = new THREE.Quaternion();
  private hands: THREE.Vector3[];
  private feet: THREE.Vector3[];
  private goal = new THREE.Vector3();
  private from = new THREE.Vector3();
  private to = new THREE.Vector3();
  private joint = new THREE.Vector3();
  private delta = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private bend = new THREE.Vector3();
  private offset = new THREE.Vector3();
  private turn = new THREE.Quaternion();
  private euler = new THREE.Euler();
  private inverse = new THREE.Matrix4();
  private matrix = new THREE.Matrix4();
  private corner = new THREE.Vector3();
  private meshes: { mesh: THREE.Mesh; box: THREE.Box3 }[] = [];
  constructor(
    private root: THREE.Group,
    private body: THREE.Group,
    private hips: THREE.Group,
    private head: THREE.Group,
    private arms: FighterArm[],
    private legs: FighterLeg[],
  ) {
    this.pivot.name = "Knockout pivot";
    for (const child of [...root.children]) this.pivot.add(child);
    root.add(this.pivot);
    this.hands = arms.map(() => new THREE.Vector3());
    this.feet = legs.map(() => new THREE.Vector3());
    root.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.geometry.computeBoundingBox();
      if (o.geometry.boundingBox)
        this.meshes.push({ mesh: o, box: o.geometry.boundingBox.clone() });
    });
  }
  reset() {
    this.current = null;
    this.pivot.position.set(0, 0, 0);
    this.pivot.quaternion.identity();
  }
  private capture(value: Knockout) {
    this.current = value;
    this.bodyStart.copy(this.body.position);
    this.hipsStart.copy(this.hips.position);
    this.bodyRotation.copy(this.body.quaternion);
    this.hipsRotation.copy(this.hips.quaternion);
    this.headRotation.copy(this.head.quaternion);
    this.arms.forEach((arm, n) => this.hands[n].copy(arm.glove.position));
    this.legs.forEach((leg, n) => this.feet[n].copy(leg.foot.position));
  }
  private segment(
    object: THREE.Object3D,
    from: THREE.Vector3,
    to: THREE.Vector3,
    width: number,
  ) {
    this.delta.subVectors(to, from);
    object.position.copy(from).addScaledVector(this.delta, 0.5);
    object.quaternion.setFromUnitVectors(
      UP,
      this.direction.copy(this.delta).normalize().negate(),
    );
    object.scale.set(width, this.delta.length(), width);
  }
  private solve(length: number, bend: THREE.Vector3) {
    this.delta.subVectors(this.to, this.from);
    const reach = Math.min(this.delta.length(), length * 1.98);
    this.direction.copy(this.delta).normalize();
    this.to.copy(this.from).addScaledVector(this.direction, reach);
    this.bend
      .copy(bend)
      .addScaledVector(this.direction, -bend.dot(this.direction))
      .normalize();
    this.joint
      .copy(this.from)
      .addScaledVector(this.direction, reach * 0.5)
      .addScaledVector(
        this.bend,
        Math.sqrt(length * length - reach * reach * 0.25),
      );
  }
  private supportFloor() {
    this.root.updateMatrixWorld(true);
    this.inverse.copy(this.root.matrixWorld).invert();
    let low = Infinity;
    for (const { mesh, box } of this.meshes) {
      if (!mesh.visible) continue;
      this.matrix.multiplyMatrices(this.inverse, mesh.matrixWorld);
      for (let c = 0; c < 8; c++) {
        this.corner
          .set(
            c & 1 ? box.max.x : box.min.x,
            c & 2 ? box.max.y : box.min.y,
            c & 4 ? box.max.z : box.min.z,
          )
          .applyMatrix4(this.matrix);
        low = Math.min(low, this.corner.y);
      }
    }
    if (Number.isFinite(low) && low < 0) this.pivot.position.y -= low;
    this.root.updateMatrixWorld(true);
  }
  pose(value: Knockout, time: number, reduced: boolean) {
    if (this.current !== value) this.capture(value);
    const age = Math.max(0, time - value.started),
      i = knockoutIntent(value, time, reduced);
    const blend = smooth(age / 0.18),
      fall = i.collapse;
    this.body.position
      .copy(this.bodyStart)
      .lerp(this.goal.set(0, 1.4 - i.crouch, 0.02), blend);
    this.hips.position
      .copy(this.hipsStart)
      .lerp(this.goal.set(0, 1.1 - i.crouch, 0), blend);
    this.turn.setFromEuler(this.euler.set(0, i.flail * 0.025, i.flail * 0.035));
    this.body.quaternion.copy(this.bodyRotation).slerp(this.turn, blend);
    this.hips.quaternion.copy(this.hipsRotation).slerp(this.turn, blend);
    this.turn.setFromEuler(
      this.euler.set(-0.12 * fall, i.flail * 0.1, i.flail * 0.08),
    );
    this.head.quaternion.copy(this.headRotation).slerp(this.turn, blend);
    this.arms.forEach((arm, n) => {
      const sign = n === 0 ? -1 : 1,
        a = n * 3;
      this.goal.set(i.hands[a], i.hands[a + 1], i.hands[a + 2]);
      this.to.copy(this.hands[n]).lerp(this.goal, fall);
      const wind = age * 12 + n * Math.PI;
      this.to.x += Math.cos(wind) * i.windmill * 0.26;
      this.to.y +=
        Math.sin(wind) * i.windmill * 0.36 +
        i.celebrate * (n === 0 ? 0.54 : 0.45);
      this.to.z += i.flail * 0.06;
      this.to.x += sign * i.celebrate * 0.16;
      this.from.set(sign * 0.43, 0.45, 0.01);
      this.solve(0.5, this.offset.set(sign * 0.25, -1, 0.08));
      this.segment(arm.upper, this.from, this.joint, 0.131);
      this.segment(arm.lower, this.joint, this.to, 0.115);
      arm.elbow.position.copy(this.joint);
      arm.glove.position.copy(this.to);
      arm.glove.rotation.set(
        -0.08 + fall * 0.4,
        sign * 0.13,
        sign * fall * 0.28,
      );
    });
    this.legs.forEach((leg, n) => {
      const sign = n === 0 ? -1 : 1,
        a = n * 3;
      this.goal.set(i.feet[a], i.feet[a + 1], i.feet[a + 2]);
      leg.foot.position.copy(this.feet[n]).lerp(this.goal, fall);
      // Different secondary kicks, with one final involuntary boot twitch.
      leg.foot.position.y +=
        Math.max(0, Math.sin(age * 11 + n * Math.PI)) *
        Math.abs(i.flail) *
        0.13;
      leg.foot.rotation.set(
        fall * (n === 0 ? -0.22 : 0.18),
        sign * 0.1 + (n === 1 ? i.twitch : 0),
        sign * fall * 0.07,
      );
      this.offset.set(0, 0.153, 0).applyEuler(leg.foot.rotation);
      this.to.copy(leg.foot.position).add(this.offset);
      this.from
        .set(sign * 0.225, -0.055, 0)
        .applyQuaternion(this.hips.quaternion)
        .add(this.hips.position);
      this.solve(0.43, this.goal.set(sign * 0.18, 0.05, 1));
      leg.foot.position.copy(this.to).sub(this.offset);
      this.segment(leg.upper, this.from, this.joint, 0.155);
      this.segment(leg.lower, this.joint, this.to, 0.125);
      leg.knee.position.copy(this.joint);
    });
    this.pivot.quaternion.setFromEuler(
      this.euler.set(i.pitch, i.yaw, i.roll, "YXZ"),
    );
    this.goal.set(0, 1.1, 0);
    this.pivot.position
      .copy(this.goal)
      .sub(this.offset.copy(this.goal).applyQuaternion(this.pivot.quaternion));
    this.pivot.position.x += i.travelX;
    this.pivot.position.z += i.travelZ;
    this.pivot.position.y += i.drop;
    this.supportFloor();
    const landing = knockoutStyle(value.variant).impacts[0],
      since = age - landing;
    if (!reduced && since > 0 && since < 0.55)
      this.pivot.position.y +=
        Math.abs(Math.sin(since * 17)) * 0.026 * Math.exp(-since * 7);
    this.root.updateMatrixWorld(true);
  }
}
