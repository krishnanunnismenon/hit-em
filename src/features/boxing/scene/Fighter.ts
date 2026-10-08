import * as THREE from "three";
import { Resources } from "./Resources";
import { buildFighterModel, type FighterAppearance } from "./FighterModel";
import { FaceReaction } from "./FaceReaction";
import { KnockoutRig } from "./KnockoutRig";
import { FighterDynamics } from "./FighterDynamics";
import { techniqueIntent, type TechniqueIntent } from "../domain/technique";
import { ActiveRig, Motor } from "./ActiveRig";
import type { Stance } from "../../../../shared/input";
import type { Strike, Outcome, Knockout } from "../domain/types";
import {
  gaitOffsets,
  type GaitOffsets,
  type RingBoxer,
} from "../domain/spacing";
import { guardGoal, type GuardShape } from "../domain/tactics";
const UP = new THREE.Vector3(0, 1, 0);
// +Z is forward: the lead hand/foot are +X; the rear Cross is camera-facing.
function strikingHand(attack: Strike["attack"]) {
  return attack === "jab" || attack === "hook" ? 1 : 0;
}
interface Arm {
  upper: THREE.Object3D;
  lower: THREE.Object3D;
  elbow: THREE.Object3D;
  glove: THREE.Group;
  wrist: THREE.Vector3;
  contact?: THREE.Vector3;
  rotation: Motor[];
}
interface Leg {
  upper: THREE.Object3D;
  lower: THREE.Object3D;
  knee: THREE.Object3D;
  foot: THREE.Group;
}
export interface FighterPose {
  time: number;
  dt: number;
  stance: Stance;
  strike: Strike | null;
  stamina: number;
  reaction: number;
  reactionAttack: string;
  reactionOutcome?: Outcome;
  variant: number;
  knockout: Knockout | null;
  reduced?: boolean;
  stunned?: boolean;
  guard?: GuardShape;
}
export class Fighter {
  readonly root: THREE.Group;
  readonly body: THREE.Group;
  readonly head: THREE.Group;
  private arms: Arm[] = [];
  private legs: Leg[] = [];
  private hips: THREE.Group;
  private dynamics = new FighterDynamics();
  private rig = new ActiveRig();
  private walking = false;
  private gait: GaitOffsets = {
    rearX: 0,
    rearZ: 0,
    leadX: 0,
    leadZ: 0,
    rearLift: 0,
    leadLift: 0,
  };
  private seeded = false;
  private intent = techniqueIntent(null, "neutral", 0);
  private rootAim = new THREE.Vector3();
  private endpoint = new THREE.Vector3();
  private guard = new THREE.Vector3();
  private bendControl = new THREE.Vector3();
  private footPivot = new THREE.Vector3();
  private inverseBody = new THREE.Quaternion();
  private anchor = new THREE.Vector3();
  private offset = new THREE.Vector3();
  private anchored = false;
  private aim = new THREE.Vector3();
  private aimed = false;
  private delta = new THREE.Vector3();
  private elbowPoint = new THREE.Vector3();
  private shoulderPoint = new THREE.Vector3();
  private target = new THREE.Vector3();
  private footTarget = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private bendAxis = new THREE.Vector3();
  private contactOffset = new THREE.Vector3();
  private gloveQuaternion = new THREE.Quaternion();
  private forward = new THREE.Vector3(0, 0, 1);
  private ray = new THREE.Raycaster();
  private surfaceOrigin = new THREE.Vector3();
  private surfaceHits: THREE.Intersection[] = [];
  private poseRotation = new THREE.Euler();
  private poseQuaternion = new THREE.Quaternion();
  private face: FaceReaction;
  private knockoutRig: KnockoutRig;
  constructor(r: Resources, o: FighterAppearance, asset?: THREE.Object3D) {
    const model = buildFighterModel(r, o, asset);
    this.root = model.root;
    this.body = model.body;
    this.head = model.head;
    this.hips = model.hips;
    this.arms = model.arms.map((arm) => ({
      ...arm,
      rotation: [new Motor(), new Motor(), new Motor()],
    }));
    this.legs = model.legs;
    this.face = new FaceReaction(r, this.head, model.mouth, model.brows);
    this.knockoutRig = new KnockoutRig(
      this.root,
      this.body,
      this.hips,
      this.head,
      model.arms,
      model.legs,
    );
    this.pose({
      time: 0,
      dt: 1,
      stance: "neutral",
      strike: null,
      stamina: 100,
      reaction: 0,
      reactionAttack: "jab",
      variant: 0,
      knockout: null,
    });
  }
  setAim(point: THREE.Vector3) {
    this.aim.copy(point);
    this.aimed = true;
  }
  attackTarget(attack: Strike["attack"], outcome: Outcome, out: THREE.Vector3) {
    this.root.updateMatrixWorld(true);
    if (outcome === "block") {
      const arm = this.arms[1 - strikingHand(attack)];
      out.copy(arm.contact ?? this.contactOffset.set(0, 0.04, 0.27));
      arm.glove.localToWorld(out);
      return out;
    }
    out.set(
      attack === "hook" ? -0.13 : -0.08,
      attack === "uppercut" ? -0.2 : -0.1,
      attack === "uppercut" ? 0.19 : 0.22,
    );
    this.head.localToWorld(out);
    this.surfaceOrigin.set(
      attack === "hook" ? -0.13 : -0.08,
      attack === "uppercut" ? -0.2 : -0.1,
      1,
    );
    this.head.localToWorld(this.surfaceOrigin);
    this.direction.set(0, 0, -1).transformDirection(this.head.matrixWorld);
    this.ray.set(this.surfaceOrigin, this.direction);
    this.surfaceHits.length = 0;
    this.ray.intersectObject(this.head, true, this.surfaceHits);
    if (this.surfaceHits.length) out.copy(this.surfaceHits[0].point);
    return out;
  }
  impact(attack: Strike["attack"], power: number, outcome: Outcome) {
    this.dynamics.impact(attack, power, outcome);
    this.face.impact(attack, power, outcome);
  }
  resetDynamics() {
    this.knockoutRig.reset();
    this.dynamics.reset();
    this.face.reset();
    this.aimed = false;
    this.seeded = false;
    this.rig.reset();
  }
  place(x: number, y: number, z: number, yaw: number) {
    this.anchor.set(x, y, z);
    this.root.position.copy(this.anchor);
    this.root.rotation.y = yaw;
    this.anchored = true;
  }
  walk(actor: RingBoxer, alpha = 1, enabled = true) {
    this.walking = enabled;
    this.place(
      actor.previousX + (actor.x - actor.previousX) * alpha,
      0.055,
      actor.previousZ + (actor.z - actor.previousZ) * alpha,
      actor.yaw,
    );
    if (enabled) gaitOffsets(actor, alpha, this.gait);
  }
  glovePosition(attack: Strike["attack"], out: THREE.Vector3) {
    this.root.updateMatrixWorld(true);
    const arm = this.arms[strikingHand(attack)];
    out.copy(arm.contact ?? this.contactOffset.set(0, 0.04, 0.27));
    return arm.glove.localToWorld(out);
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
  private joint(
    from: THREE.Vector3,
    to: THREE.Vector3,
    length: number,
    bend: THREE.Vector3,
    out: THREE.Vector3,
  ) {
    this.delta.subVectors(to, from);
    const distance = Math.min(this.delta.length(), length * 1.98);
    this.direction.copy(this.delta).normalize();
    const half = distance * 0.5;
    this.bendAxis
      .copy(bend)
      .addScaledVector(this.direction, -bend.dot(this.direction))
      .normalize();
    out
      .copy(from)
      .addScaledVector(this.direction, half)
      .addScaledVector(
        this.bendAxis,
        Math.sqrt(Math.max(0.0001, length * length - half * half)),
      );
  }
  private bodyTransform(p: FighterPose, time: number) {
    const fatigue = (100 - p.stamina) / 100,
      balance = this.dynamics;
    const breath =
      Math.sin(time * (1.7 + fatigue * 0.6) + p.variant) *
      (0.006 + fatigue * 0.006);
    const shift = Math.sin(time * 0.83 + p.variant) * 0.012;
    this.hips.position.set(
      this.rig.x.position,
      this.rig.y.position,
      this.rig.z.position,
    );
    this.hips.rotation.set(0, this.rig.hipYaw.position, 0);
    this.body.position.set(
      this.rig.x.position + shift,
      this.rig.y.position + 0.3 + breath,
      this.rig.z.position,
    );
    this.body.rotation.set(
      this.rig.pitch.position + balance.pitch.position,
      this.rig.yaw.position,
      this.rig.roll.position + balance.roll.position,
    );
  }
  private seed(p: FighterPose) {
    const i = techniqueIntent(null, p.stance, p.time, p.stamina),
      r = this.rig;
    this.intent = i;
    r.x.reset(i.pelvisX);
    r.y.reset(i.pelvisY);
    r.z.reset(i.pelvisZ);
    r.hipYaw.reset(i.pelvisYaw);
    r.yaw.reset(i.torsoYaw);
    r.pitch.reset(i.torsoPitch);
    r.roll.reset(0);
    r.rearYaw.reset(i.rearYaw);
    r.leadYaw.reset(i.leadYaw);
    r.rearHeel.reset(i.rearHeel);
    r.leadHeel.reset(i.leadHeel);
    r.rearZ.reset(i.rearZ);
    r.leadZ.reset(i.leadZ);
    r.rearX.reset(i.rearX);
    r.leadX.reset(i.leadX);
    this.bodyTransform(p, p.time);
    this.arms.forEach((arm, index) => {
      const sign = index === 0 ? -1 : 1;
      const goal = p.guard ? guardGoal(p.guard, index) : null;
      this.target
        .set(
          sign * (i.guardX + (goal?.x ?? 0)),
          i.guardY + (goal?.y ?? 0),
          i.guardZ + (goal?.z ?? 0),
        )
        .applyQuaternion(this.body.quaternion)
        .add(this.body.position);
      r.wrists[index].forEach((motor, axis) =>
        motor.reset(this.target.getComponent(axis)),
      );
      arm.rotation.forEach((m) => m.reset(0));
    });
    this.seeded = true;
  }
  private integrate(p: FighterPose, time: number, dt: number) {
    const i = techniqueIntent(p.strike, p.stance, time, p.stamina),
      r = this.rig;
    this.intent = i;
    r.x.integrate(i.pelvisX, 45, dt);
    r.y.integrate(
      i.pelvisY -
        Math.max(0, this.dynamics.brace.position) * 0.3 -
        (p.stunned ? 0.045 : 0),
      55,
      dt,
    );
    r.z.integrate(i.pelvisZ, 55, dt);
    r.hipYaw.integrate(i.pelvisYaw, 58, dt);
    r.yaw.integrate(i.torsoYaw, 65, dt);
    r.pitch.integrate(i.torsoPitch, 48, dt);
    r.roll.integrate(i.torsoRoll, 48, dt);
    r.rearYaw.integrate(i.rearYaw, 60, dt);
    r.leadYaw.integrate(i.leadYaw, 60, dt);
    r.rearHeel.integrate(i.rearHeel, 60, dt);
    r.leadHeel.integrate(i.leadHeel, 60, dt);
    r.rearZ.integrate(i.rearZ, 90, dt);
    r.leadZ.integrate(i.leadZ, 90, dt);
    r.rearX.integrate(i.rearX, 90, dt);
    r.leadX.integrate(i.leadX, 90, dt);
    // Floor/leg constraints brake the COM rather than stretching a shin to the mat.
    this.constrainSupport(i);
    this.bodyTransform(p, time);
    this.arms.forEach((arm, index) => {
      const sign = index === 0 ? -1 : 1,
        strike = p.strike;
      const striking = !!strike && index === strikingHand(strike.attack);
      const goal = p.guard ? guardGoal(p.guard, index) : null;
      this.guard
        .set(
          sign * (i.guardX + (goal?.x ?? 0)),
          i.guardY + (goal?.y ?? 0),
          i.guardZ + (goal?.z ?? 0),
        )
        .applyQuaternion(this.body.quaternion)
        .add(this.body.position);
      this.target.copy(this.guard);
      this.poseRotation.set(-0.08, sign * 0.13, sign * 0.08);
      this.gloveQuaternion.setFromEuler(this.poseRotation);
      if (striking && strike) {
        this.shoulderPoint
          .set(sign * 0.43, 0.45, 0.01)
          .applyQuaternion(this.body.quaternion)
          .add(this.body.position);
        this.direction.subVectors(this.rootAim, this.shoulderPoint).normalize();
        if (strike.attack === "hook")
          this.direction.set(-sign * 0.8, 0.03, 0.6).normalize();
        if (strike.attack === "uppercut")
          this.direction.set(sign * 0.06, 0.8, 0.6).normalize();
        this.poseQuaternion.setFromUnitVectors(this.forward, this.direction);
        this.gloveQuaternion.slerp(
          this.poseQuaternion,
          i.hand * (1 - i.returning),
        );
      }
      this.poseRotation.setFromQuaternion(this.gloveQuaternion);
      arm.rotation.forEach((motor, axis) =>
        motor.integrate(
          axis === 0
            ? this.poseRotation.x
            : axis === 1
              ? this.poseRotation.y
              : this.poseRotation.z,
          100,
          dt,
        ),
      );
      this.poseRotation.set(
        arm.rotation[0].position,
        arm.rotation[1].position,
        arm.rotation[2].position,
      );
      this.gloveQuaternion.setFromEuler(this.poseRotation);
      if (striking && strike) {
        const contact = arm.contact ?? this.contactOffset.set(0, 0.04, 0.27);
        this.contactOffset.copy(contact).applyQuaternion(this.gloveQuaternion);
        if (this.aimed)
          this.endpoint.copy(this.rootAim).sub(this.contactOffset);
        else this.endpoint.set(sign * 0.05, 2.13, 1.12);
        const u = i.hand,
          v = 1 - u;
        this.bendControl.copy(this.guard).lerp(this.endpoint, 0.5);
        if (strike.attack === "hook") {
          // Sweep round the outside, elbow level with the fist; don't lerp a hook down a straight line.
          this.bendControl.x += sign * (0.66 + i.effort * 0.39);
          this.bendControl.z -= 0.12;
          this.bendControl.y = this.endpoint.y + 0.035;
        } else if (strike.attack === "uppercut") {
          // Load below the guard, then rise through the chin. No jumping or locked knees.
          this.bendControl.y -= 0.63 + i.effort * 0.14;
          this.bendControl.z += 0.12;
        } else this.bendControl.x += sign * 0.015 * ((strike.variant % 3) - 1);
        this.target
          .copy(this.guard)
          .multiplyScalar(v * v)
          .addScaledVector(this.bendControl, 2 * v * u)
          .addScaledVector(this.endpoint, u * u);
        // Recovery retracts directly behind the guard; it does not rewind the outgoing hook/uppercut arc.
        this.target.lerp(this.guard, i.returning);
        this.target.z -= i.load * (0.025 + i.effort * 0.05);
        if (strike.attack === "uppercut") this.target.y -= i.load * 0.12;
      }
      this.target.y -=
        p.reaction * (p.reactionOutcome === "block" ? -0.025 : 0.12);
      // The hand is a driven mass. Finite force/damping replaces the old direct wrist assignment.
      r.wrists[index].forEach((motor, axis) =>
        motor.integrate(
          this.target.getComponent(axis),
          striking ? 140 : 70,
          dt,
        ),
      );
    });
  }
  private footPose(index: number, intent: TechniqueIntent) {
    const leg = this.legs[index],
      r = this.rig,
      b = this.dynamics;
    const gaitLift = this.walking
      ? index === 0
        ? this.gait.rearLift
        : this.gait.leadLift
      : 0;
    const otherGait = this.walking
      ? index === 0
        ? this.gait.leadLift
        : this.gait.rearLift
      : 0;
    const height =
      b.feet[1 - index].height > 0.0001 || otherGait > 0.0001
        ? 0
        : Math.max(
            b.feet[index].height,
            gaitLift,
            index === 1 ? intent.leadLift : intent.rearLift,
          );
    const yaw = index === 0 ? r.rearYaw.position : r.leadYaw.position;
    const heel =
      height > 0.001
        ? 0
        : Math.max(0, index === 0 ? r.rearHeel.position : r.leadHeel.position) +
          Math.max(0, b.brace.position) * (index === 0 ? 0.8 : 0.25);
    leg.foot.rotation.set(heel, yaw, 0);
    // Rotate around a supported toe. The sole never spins about a floating ankle.
    this.footPivot.set(0, -0.137, 0.17).applyEuler(leg.foot.rotation);
    leg.foot.position.set(
      (index === 0 ? r.rearX.position : r.leadX.position) +
        (this.walking ? (index === 0 ? this.gait.rearX : this.gait.leadX) : 0) +
        b.feet[index].x -
        b.lateral.position -
        this.footPivot.x,
      height - this.footPivot.y,
      (index === 0 ? r.rearZ.position : r.leadZ.position) +
        (this.walking ? (index === 0 ? this.gait.rearZ : this.gait.leadZ) : 0) +
        b.feet[index].z -
        (index === 0 ? -0.17 : 0.24) -
        b.recoil.position +
        0.17 -
        this.footPivot.z,
    );
    this.footTarget
      .set(0, 0.153, 0)
      .applyEuler(leg.foot.rotation)
      .add(leg.foot.position);
  }
  private constrainSupport(intent: TechniqueIntent) {
    const r = this.rig;
    let ceiling = 1.2;
    this.legs.forEach((_leg, index) => {
      this.footPose(index, intent);
      this.shoulderPoint
        .set((index === 0 ? -1 : 1) * 0.225, -0.055, 0)
        .applyAxisAngle(UP, r.hipYaw.position)
        .add(this.target.set(r.x.position, r.y.position, r.z.position));
      const dx = this.footTarget.x - this.shoulderPoint.x,
        dz = this.footTarget.z - this.shoulderPoint.z;
      ceiling = Math.min(
        ceiling,
        this.footTarget.y +
          0.055 +
          Math.sqrt(Math.max(0.01, 0.852 * 0.852 - dx * dx - dz * dz)),
      );
    });
    if (r.y.position > ceiling) {
      r.y.position = ceiling;
      r.y.velocity = Math.min(0, r.y.velocity);
    }
    // Centre of mass stays inside the support base (toe/heel contact margin included).
    const low = r.rearZ.position - 0.07,
      high = r.leadZ.position + 0.07;
    if (r.z.position < low || r.z.position > high) {
      r.z.position = Math.max(low, Math.min(high, r.z.position));
      r.z.velocity = 0;
    }
    const centre = (r.rearX.position + r.leadX.position) * 0.5,
      bound = (r.leadX.position - r.rearX.position) * 0.36;
    if (Math.abs(r.x.position - centre) > bound) {
      r.x.position = centre + Math.sign(r.x.position - centre) * bound;
      r.x.velocity = 0;
    }
  }
  groundPoint(out: THREE.Vector3) {
    this.hips.getWorldPosition(out);
    out.y = this.anchor.y;
    return out;
  }
  pose(p: FighterPose) {
    if (p.knockout) {
      this.knockoutRig.pose(p.knockout, p.time, p.reduced ?? false);
      this.face.advance(p.dt, true);
      return;
    }
    this.knockoutRig.reset();
    this.dynamics.advance(p.dt);
    const balance = this.dynamics;
    if (this.anchored) {
      this.offset
        .set(balance.lateral.position, 0, balance.recoil.position)
        .applyAxisAngle(UP, this.root.rotation.y);
      this.root.position.copy(this.anchor).add(this.offset);
    }
    if (!p.strike) this.aimed = false;
    if (this.aimed) {
      this.root.updateMatrixWorld(true);
      this.root.worldToLocal(this.rootAim.copy(this.aim));
    }
    if (!this.seeded) this.seed(p);
    this.rig.advance(p.dt, p.time, (time, dt) => this.integrate(p, time, dt));
    this.bodyTransform(p, p.time);
    const i = this.intent,
      r = this.rig;
    this.head.rotation.set(
      balance.pitch.position * 0.7 +
        balance.headPitch.position -
        i.drive * 0.045,
      balance.headYaw.position - this.body.rotation.y * 0.22,
      0,
    );
    this.face.advance(p.dt, p.stunned ?? false);
    this.inverseBody.copy(this.body.quaternion).invert();
    this.arms.forEach((arm, index) => {
      const sign = index === 0 ? -1 : 1,
        striking = p.strike && index === strikingHand(p.strike.attack);
      this.shoulderPoint.set(sign * 0.43, 0.45, 0.01);
      this.target
        .set(
          r.wrists[index][0].position,
          r.wrists[index][1].position,
          r.wrists[index][2].position,
        )
        .sub(this.body.position)
        .applyQuaternion(this.inverseBody);
      this.delta.subVectors(this.target, this.shoulderPoint);
      if (this.delta.length() > 0.985)
        this.target
          .copy(this.shoulderPoint)
          .addScaledVector(this.delta.normalize(), 0.985);
      arm.wrist.copy(this.target);
      if (striking && p.strike?.attack === "hook")
        this.bendAxis.set(sign, 0.12, -0.1);
      else this.bendAxis.set(sign * 0.18, -1, -0.08);
      this.joint(
        this.shoulderPoint,
        arm.wrist,
        0.5,
        this.bendAxis,
        this.elbowPoint,
      );
      this.segment(arm.upper, this.shoulderPoint, this.elbowPoint, 0.131);
      this.segment(arm.lower, this.elbowPoint, arm.wrist, 0.115);
      arm.elbow.position.copy(this.elbowPoint);
      arm.glove.position.copy(arm.wrist);
      this.poseRotation.set(
        arm.rotation[0].position,
        arm.rotation[1].position,
        arm.rotation[2].position,
      );
      this.gloveQuaternion
        .setFromEuler(this.poseRotation)
        .premultiply(this.inverseBody);
      arm.glove.quaternion.copy(this.gloveQuaternion);
    });
    this.legs.forEach((leg, index) => {
      this.footPose(index, i);
      this.shoulderPoint
        .set((index === 0 ? -1 : 1) * 0.225, -0.055, 0)
        .applyEuler(this.hips.rotation)
        .add(this.hips.position);
      this.bendAxis
        .set(index === 0 ? -0.12 : 0.12, 0.05, 1)
        .applyAxisAngle(UP, leg.foot.rotation.y * 0.55);
      this.joint(
        this.shoulderPoint,
        this.footTarget,
        0.43,
        this.bendAxis,
        this.elbowPoint,
      );
      this.segment(leg.upper, this.shoulderPoint, this.elbowPoint, 0.155);
      this.segment(leg.lower, this.elbowPoint, this.footTarget, 0.125);
      leg.knee.position.copy(this.elbowPoint);
    });
    this.root.rotation.z = 0;
  }
}
