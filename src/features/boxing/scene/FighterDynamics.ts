import type { Attack } from "../../../../shared/input";
import type { Outcome } from "../domain/types";

const STEP = 1 / 240;
const MASS = 78;
const HOME = [-0.17, 0.24];
interface Spring {
  position: number;
  velocity: number;
}
interface Foot {
  x: number;
  fromX: number;
  toX: number;
  lift: number;
  duration: number;
  z: number;
  height: number;
  from: number;
  to: number;
  progress: number;
}
function spring(): Spring {
  return { position: 0, velocity: 0 };
}
function integrate(s: Spring, frequency: number, damping: number) {
  const omega = 2 * Math.PI * frequency;
  s.velocity +=
    (-omega * omega * s.position - 2 * damping * omega * s.velocity) * STEP;
  s.position += s.velocity * STEP;
}

/** Presentation only: kg, metre and second based impulses, damped balance and floor-constrained feet.
 * This never decides contacts or damage; the fixed combat engine owns those decisions. */
export class FighterDynamics {
  readonly recoil = spring();
  readonly lateral = spring();
  readonly pitch = spring();
  readonly roll = spring();
  readonly headPitch = spring();
  readonly headYaw = spring();
  readonly brace = spring();
  readonly feet: Foot[] = HOME.map((z) => ({
    x: 0,
    fromX: 0,
    toX: 0,
    lift: 0.025,
    duration: 0.24,
    z,
    height: 0,
    from: z,
    to: z,
    progress: 1,
  }));
  private accumulator = 0;
  private nextFoot = 0;
  private pendingStep: {
    index: number;
    distance: number;
    lateral: number;
    power: number;
  } | null = null;
  impact(attack: Attack, power: number, outcome: Outcome) {
    if (outcome === "whiff") return;
    const brace = outcome === "block" ? 0.22 : 1;
    // A guard rocks on a supported toe; each landed punch earns a short recovery step.
    this.brace.velocity += (outcome === "block" ? 0.8 : 1.4) + power * 0.2;
    if (outcome !== "block")
      this.pendingStep = {
        index: attack === "jab" || attack === "hook" ? 1 : 0,
        distance: 0.022 + power * 0.018,
        lateral: attack === "hook" ? 0.026 + power * 0.012 : 0,
        power,
      };
    const impulse = (24 + power * 22) * brace;
    this.recoil.velocity -= impulse / MASS;
    // A small share of the impulse reaches the head through a compliant neck.
    // kg m² and metre lever arm are presentation tuning values, not measured force data.
    const headAngular = (impulse * 0.022 * 0.075) / 0.035;
    this.headPitch.velocity = Math.max(
      -9,
      this.headPitch.velocity -
        headAngular * (attack === "uppercut" ? 1.2 : 0.75),
    );
    if (attack === "hook")
      this.headYaw.velocity = Math.min(
        9,
        this.headYaw.velocity + headAngular * 0.85,
      );
    this.pitch.velocity -=
      ((attack === "uppercut" ? 2.5 : 1.15) * impulse) / MASS;
    if (attack === "hook") {
      this.lateral.velocity += (impulse / MASS) * 0.48;
      this.roll.velocity += (impulse / MASS) * 2.2;
    }
  }
  reset() {
    for (const s of [
      this.recoil,
      this.lateral,
      this.pitch,
      this.roll,
      this.headPitch,
      this.headYaw,
      this.brace,
    ]) {
      s.position = 0;
      s.velocity = 0;
    }
    this.feet.forEach((foot, i) =>
      Object.assign(foot, {
        x: 0,
        fromX: 0,
        toX: 0,
        lift: 0.025,
        duration: 0.24,
        z: HOME[i],
        height: 0,
        from: HOME[i],
        to: HOME[i],
        progress: 1,
      }),
    );
    this.accumulator = 0;
    this.nextFoot = 0;
    this.pendingStep = null;
  }
  advance(elapsed: number) {
    this.accumulator += Math.max(0, Math.min(0.1, elapsed));
    while (this.accumulator + 1e-10 >= STEP) {
      this.accumulator -= STEP;
      integrate(this.recoil, 1.25, 0.72);
      integrate(this.lateral, 1.6, 0.78);
      integrate(this.pitch, 1.65, 0.64);
      integrate(this.roll, 1.8, 0.69);
      integrate(this.headPitch, 2.4, 0.66);
      integrate(this.headYaw, 2.7, 0.7);
      integrate(this.brace, 3.2, 0.8);
      // Never lift both support feet. Explicit impact steps include light punches;
      // subsequent replants follow the displaced centre of mass back to guard.
      if (this.feet.every((f) => f.progress >= 1)) {
        const request = this.pendingStep;
        const i = request?.index ?? this.nextFoot;
        const foot = this.feet[i];
        const target =
          HOME[i] + this.recoil.position - (request?.distance ?? 0);
        const targetX = request?.lateral ?? 0;
        if (
          request ||
          Math.abs(target - foot.z) > 0.012 ||
          Math.abs(foot.x) > 0.012
        ) {
          foot.from = foot.z;
          foot.to = target;
          foot.fromX = foot.x;
          foot.toX = targetX;
          foot.duration = request ? 0.2 + request.power * 0.02 : 0.24;
          foot.lift = request ? 0.015 + request.power * 0.0075 : 0.025;
          foot.progress = 0;
          this.pendingStep = null;
          this.nextFoot = 1 - i;
        } else this.nextFoot = 1 - i;
      }
      for (const foot of this.feet) {
        if (foot.progress >= 1) {
          foot.height = 0;
          continue;
        }
        foot.progress = Math.min(1, foot.progress + STEP / foot.duration);
        const t = foot.progress;
        foot.z = foot.from + (foot.to - foot.from) * t * t * (3 - 2 * t);
        foot.x = foot.fromX + (foot.toX - foot.fromX) * t * t * (3 - 2 * t);
        foot.height = 4 * t * (1 - t) * foot.lift;
      }
    }
  }
}
