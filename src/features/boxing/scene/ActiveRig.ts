/** Stable implicit Euler PD motor. Stiffness is kg/s² (translation) or kg m²/s² (rotation).
 * No pose lerps: finite mass/inertia, spring force/torque and damping integrate at 240 Hz. */
export class Motor {
  position: number;
  velocity = 0;
  constructor(
    initial = 0,
    readonly mass = 1,
  ) {
    this.position = initial;
  }
  integrate(goal: number, omega: number, dt: number) {
    const stiffness = this.mass * omega * omega,
      damping = 2 * this.mass * omega;
    this.velocity =
      (this.mass * this.velocity + dt * stiffness * (goal - this.position)) /
      (this.mass + dt * damping + dt * dt * stiffness);
    this.position += this.velocity * dt;
  }
  reset(position: number) {
    this.position = position;
    this.velocity = 0;
  }
}
export class ActiveRig {
  readonly x = new Motor(0, 78);
  readonly y = new Motor(1.135, 78);
  readonly z = new Motor(0.008, 78);
  readonly hipYaw = new Motor(-0.0715, 6);
  readonly yaw = new Motor(-0.13, 9);
  readonly pitch = new Motor(0.025, 7);
  readonly roll = new Motor(0, 7);
  readonly rearYaw = new Motor(-0.12, 0.25);
  readonly leadYaw = new Motor(0.06, 0.25);
  readonly rearHeel = new Motor(0.025, 0.25);
  readonly leadHeel = new Motor(0, 0.25);
  readonly rearZ = new Motor(-0.17, 3);
  readonly leadZ = new Motor(0.24, 3);
  readonly rearX = new Motor(-0.245, 3);
  readonly leadX = new Motor(0.245, 3);
  readonly wrists = [
    [new Motor(-0.35, 2), new Motor(1.9, 2), new Motor(0.3, 2)],
    [new Motor(0.35, 2), new Motor(1.9, 2), new Motor(0.3, 2)],
  ];
  initialized = false;
  private accumulator = 0;
  private clock = 0;
  /** One clock owns every motor so 30/60/120 Hz rendering samples the same physics trajectory. */
  advance(
    elapsed: number,
    time: number,
    step: (time: number, dt: number) => void,
  ) {
    if (elapsed <= 0) return;
    const dt = Math.min(0.1, elapsed);
    if (!this.initialized) {
      this.clock = time - dt;
      this.initialized = true;
    }
    if (Math.abs(time - this.clock - this.accumulator - dt) > 0.12)
      this.clock = time - dt - this.accumulator;
    this.accumulator += dt;
    while (this.accumulator + 1e-10 >= 1 / 240) {
      this.accumulator -= 1 / 240;
      this.clock += 1 / 240;
      step(this.clock, 1 / 240);
    }
  }
  reset() {
    this.initialized = false;
    this.accumulator = 0;
    this.clock = 0;
  }
}
