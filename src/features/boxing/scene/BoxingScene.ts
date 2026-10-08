import { presentationAim } from "../domain/contact";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Motor } from "./ActiveRig";
import { StunBirds } from "./StunBirds";
import { Fighter } from "./Fighter";
import { stageFighters } from "./FighterStage";
import { loadFighterAssets } from "./FighterAssets";
import { applyPoseProbe } from "./PoseProbe";
import { readPoseProbe } from "../domain/poseProbe";
import { Arena } from "./Arena";
import { Resources } from "./Resources";
import type { StudyController } from "../application/StudyController";
import type { StudyEvent, Outcome } from "../domain/types";
export interface SceneStats {
  fps: number;
  p95: number;
  drawCalls: number;
  triangles: number;
  samples: number;
  sampledSeconds: number;
  inputSamples: number;
  inputP95: number;
}
export class BoxingScene {
  private poseProbe = import.meta.env.DEV
    ? readPoseProbe(window.location.search)
    : null;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private environment: THREE.WebGLRenderTarget | null = null;
  private camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  private baseFov = 38;
  private resources = new Resources();
  private arena: Arena;
  private player!: Fighter;
  private rival!: Fighter;
  private birds: StunBirds[] = [];
  private raf = 0;
  private previous = 0;
  private disposed = false;
  private running = false;
  private observer: ResizeObserver;
  private stopEvents: () => void;
  private reactions = [0, 0];
  private reactionAttack = ["jab", "jab"];
  private reactionOutcome: Outcome[] = ["hit", "hit"];
  private cameraKick = 0;
  private cornerView = new Motor();
  private baseCamera = new THREE.Vector3(1.8, 2.4, 5.1);
  private cameraTarget = new THREE.Vector3();
  private target = new THREE.Vector3(0.2, 1.55, -0.1);
  private contact = new THREE.Vector3();
  private projected = new THREE.Vector3();
  private contactDirection = new THREE.Vector3();
  private pending: StudyEvent | null = null;
  private frames: number[] = [];
  private statsAt = 0;
  private crowdAt = 0;
  private lastStudyTime = 0;
  private walkAlpha = 1;
  private compositionTarget = new THREE.Vector3();
  private particles: THREE.Points;
  private positions = new Float32Array(18 * 3);
  private velocity = new Float32Array(18 * 3);
  private particleLife = 0;
  private trailPositions = [new Float32Array(16 * 3), new Float32Array(16 * 3)];
  private trails: THREE.Line[] = [];
  private trailActive = false;
  constructor(
    private host: HTMLElement,
    private controller: StudyController,
    private reduced: boolean,
    private onStats: (s: SceneStats) => void,
    private onContact: (x: number, y: number) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    try {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      this.renderer.domElement.setAttribute(
        "aria-label",
        "Animated toy boxers in an underground boxing ring",
      );
      this.host.appendChild(this.renderer.domElement);
      this.scene.background = new THREE.Color("#1c2226");
      this.scene.fog = new THREE.Fog("#1c2226", 10, 24);
      const room = new RoomEnvironment();
      const probe = new THREE.PMREMGenerator(this.renderer);
      try {
        this.environment = probe.fromScene(room, 0.04);
        this.scene.environment = this.environment.texture;
        this.scene.environmentIntensity = 0.22;
      } finally {
        room.dispose();
        probe.dispose();
      }
      this.arena = new Arena(this.resources);
      this.scene.add(this.arena.group);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.BufferAttribute(this.positions, 3),
      );
      this.particles = new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          color: "#ffcb46",
          size: 0.055,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      this.particles.frustumCulled = false;
      this.scene.add(this.particles);
      for (let i = 0; i < 2; i++) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(this.trailPositions[i], 3),
        );
        const line = new THREE.Line(
          geometry,
          new THREE.LineBasicMaterial({
            color: i === 0 ? "#74d5eb" : "#ff9a68",
            transparent: true,
            opacity: 0,
            depthWrite: false,
          }),
        );
        line.frustumCulled = false;
        this.trails.push(line);
        this.scene.add(line);
      }
      this.camera.position.copy(this.baseCamera);
      this.camera.lookAt(this.target);
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(host);
      this.resize();
      this.stopEvents = this.controller.onEvent((e) => this.onEvent(e));
    } catch (error) {
      this.release();
      throw error;
    }
  }
  async prepare(url: string) {
    const [assets] = await Promise.all([
      loadFighterAssets(this.resources, this.controller.state.opponent.id),
      this.arena.loadTexture(url),
    ]);
    if (this.disposed) return;
    this.player = new Fighter(
      this.resources,
      {
        identity: "player",
        skin: "#bd8653",
        gloves: "#1c65bf",
        shorts: "#202934",
        hair: "#20202a",
        boots: "#222c38",
      },
      assets.player,
    );
    this.rival = new Fighter(
      this.resources,
      {
        identity: "rival",
        skin: "#d3aa78",
        gloves: "#bb412a",
        shorts: "#e2d4b5",
        hair: "#613a27",
        boots: "#eadcc0",
        scale: 1.02,
      },
      assets.rival,
    );
    stageFighters(this.player, this.rival);
    this.scene.add(this.player.root, this.rival.root);
    this.birds = [
      new StunBirds(this.resources, "#2b73b9"),
      new StunBirds(this.resources, "#b8442b"),
    ];
    this.scene.add(...this.birds.map((b) => b.group));
    if (this.poseProbe) applyPoseProbe(this.player, this.rival, this.poseProbe);

    await this.renderer.compileAsync(this.scene, this.camera);
    if (this.disposed) return;
    this.renderer.render(this.scene, this.camera);
  }
  start() {
    if (this.disposed || this.running) return;
    this.running = true;
    document.addEventListener("visibilitychange", this.visibility);
    this.visibility();
  }
  private visibility = () => {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.previous = 0;
    if (!document.hidden && this.running && !this.disposed)
      this.raf = requestAnimationFrame(this.frame);
  };
  setReduced(value: boolean) {
    this.reduced = value;
    if (value) {
      this.cornerView.reset(0);
      this.cameraKick = 0;
      this.particleLife = 0;
      this.trailActive = false;
    }
  }
  private resize() {
    const { width, height } = this.host.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    const mobile = width < 650;
    // The lab shares the ring with comparison controls; leave room for angled feet.
    this.baseFov =
      (mobile ? 50 : 38) + (this.controller.state.training ? 4 : 0);
    this.camera.fov = this.baseFov;
    this.baseCamera.set(
      mobile ? 0.12 : 1.8,
      mobile ? 2.3 : 2.4,
      mobile ? 5.25 : 5.1,
    );
    this.target.y = mobile ? 1.65 : 1.55;
    this.camera.updateProjectionMatrix();
  }
  private positionFighters(alpha: number) {
    const space = this.controller.state.spacing;
    this.player.walk(space.player, alpha, space.enabled);
    this.rival.walk(space.rival, alpha, space.enabled);
  }
  private onEvent(e: StudyEvent) {
    if (!this.player || !this.rival) return;
    if (e.type === "knockout") {
      if (e.preview) {
        for (const fighter of [this.player, this.rival]) {
          fighter.resetDynamics();
          fighter.pose({
            time: this.controller.state.time,
            dt: 0,
            stance: "neutral",
            strike: null,
            stamina: 100,
            reaction: 0,
            reactionAttack: "jab",
            variant: 0,
            knockout: null,
          });
        }
      }
      this.cameraKick = 0;
      this.pending = null;
    }
    if (e.type === "fall-impact") {
      this.pending = e;
      this.arena.react(e.id, 3);
      if (!this.reduced) this.cameraKick = 0.035;
      return;
    }
    if (e.type === "notice" || e.type === "knockout") {
      this.onContact(
        this.host.clientWidth * 0.5,
        this.host.clientHeight * 0.28,
      );
      return;
    }
    if (e.type === "strike") {
      this.positionFighters(1);
      const striker = e.side === "player" ? this.player : this.rival;
      const receiver = e.side === "player" ? this.rival : this.player;
      const strike =
        e.side === "player"
          ? this.controller.state.playerStrike
          : this.controller.state.rivalStrike;
      receiver.attackTarget(
        strike?.attack ?? "jab",
        strike?.outcome ?? "hit",
        this.contact,
      );
      this.contactDirection.subVectors(
        receiver.root.position,
        striker.root.position,
      );
      this.contactDirection.y = 0;
      this.contactDirection.normalize();
      // Fighter solves the wrist from the authored glove contact landmark.
      if (strike?.contact)
        this.contact.set(
          strike.contact.aim.x,
          strike.contact.aim.y,
          strike.contact.aim.z,
        );
      else if (strike?.outcome === "whiff") this.contact.x += 0.3;
      striker.setAim(this.contact);
      return;
    }
    if (e.type !== "impact") return;
    const target =
      (e.recipient ?? (e.side === "player" ? "rival" : "player")) === "player"
        ? 0
        : 1;
    this.reactions[target] =
      e.outcome === "whiff"
        ? 0
        : e.outcome === "block"
          ? 0.35
          : 0.7 + e.power * 0.12;
    const strike =
      e.side === "player"
        ? this.controller.state.playerStrike
        : this.controller.state.rivalStrike;
    this.reactionAttack[target] = e.attack ?? strike?.attack ?? "jab";
    (target === 0 ? this.player : this.rival).impact(
      e.attack ?? strike?.attack ?? "jab",
      e.power,
      e.outcome ?? "hit",
    );
    this.reactionOutcome[target] = e.outcome ?? "hit";
    this.pending = e;
    if (e.outcome === "hit" || e.outcome === "counter") {
      this.arena.react(e.id, e.power);
      if (!this.reduced) this.cameraKick = Math.min(0.07, e.power * 0.014);
    }
  }
  private placeImpact(e: StudyEvent) {
    const striker = e.side === "player" ? this.player : this.rival;
    const strike =
      e.side === "player"
        ? this.controller.state.playerStrike
        : this.controller.state.rivalStrike;
    if (e.type === "fall-impact") {
      (e.recipient === "player" ? this.player : this.rival).groundPoint(
        this.contact,
      );
    } else if (this.controller.state.training && !strike) {
      const receiver = e.recipient === "player" ? this.player : this.rival;
      receiver.attackTarget(
        e.attack ?? "jab",
        e.outcome ?? "hit",
        this.contact,
      );
    } else
      striker.glovePosition(e.attack ?? strike?.attack ?? "jab", this.contact);
    this.projected.copy(this.contact).project(this.camera);
    const width = this.host.clientWidth,
      height = this.host.clientHeight;
    this.onContact(
      THREE.MathUtils.clamp(
        (this.projected.x + 1) * width * 0.5 + Math.min(140, width * 0.22),
        width * 0.2,
        width * 0.8,
      ),
      THREE.MathUtils.clamp(
        (1 - this.projected.y) * height * 0.5 - Math.min(165, height * 0.26),
        100,
        height * 0.7,
      ),
    );
    if (this.reduced || e.outcome === "whiff") return;
    this.particleLife =
      e.type === "fall-impact" ? 0.22 : e.outcome === "block" ? 0.14 : 0.28;
    (this.particles.material as THREE.PointsMaterial).color.set(
      e.type === "fall-impact" || e.outcome === "block" ? "#e7e0cc" : "#ffcb46",
    );
    for (let i = 0; i < 18; i++) {
      this.positions[i * 3] = this.contact.x;
      this.positions[i * 3 + 1] = this.contact.y;
      this.positions[i * 3 + 2] = this.contact.z;
      const strength = e.outcome === "block" ? 0.45 : 0.7 + e.power * 0.18;
      this.velocity[i * 3] = Math.sin(i * 2.4 + e.id) * strength;
      this.velocity[i * 3 + 1] = Math.cos(i * 2.1) * strength;
      this.velocity[i * 3 + 2] = Math.sin(i * 3.4) * strength * 0.6;
    }
  }
  private updateTrails(active: boolean) {
    for (let hand = 0; hand < 2; hand++) {
      const data = this.trailPositions[hand],
        line = this.trails[hand];
      (line.material as THREE.LineBasicMaterial).opacity = active ? 0.6 : 0;
      if (!active) continue;
      this.player.glovePosition(hand === 0 ? "jab" : "cross", this.contact);
      if (!this.trailActive)
        for (let i = 0; i < 16; i++) {
          data[i * 3] = this.contact.x;
          data[i * 3 + 1] = this.contact.y;
          data[i * 3 + 2] = this.contact.z;
        }
      else data.copyWithin(3, 0, 45);
      data[0] = this.contact.x;
      data[1] = this.contact.y;
      data[2] = this.contact.z;
      line.geometry.attributes.position.needsUpdate = true;
    }
    this.trailActive = active;
  }
  private frame = (now: number) => {
    if (this.disposed || document.hidden) return;
    this.raf = requestAnimationFrame(this.frame);
    const raw = this.previous ? (now - this.previous) / 1000 : 1 / 60,
      elapsed = Math.min(raw, 0.1);
    this.previous = now;
    if (this.poseProbe) {
      this.camera.position.copy(this.baseCamera);
      this.camera.lookAt(this.target);
      this.renderer.render(this.scene, this.camera);
      return;
    }
    const alpha = this.controller.advance(elapsed),
      s = this.controller.state,
      dt =
        s.phase === "paused" || s.hitStop > 0
          ? 0
          : elapsed * this.controller.playbackRate;
    const t =
      s.time + (s.phase === "sparring" && s.hitStop <= 0 ? alpha / 60 : 0);
    if (s.phase === "ready" || s.time < this.lastStudyTime) {
      this.birds.forEach((b) => b.reset());
      this.player.resetDynamics();
      this.rival.resetDynamics();
      this.reactions[0] = this.reactions[1] = 0;
      this.pending = null;
      this.particleLife = 0;
      this.cameraKick = 0;
      this.trailActive = false;
      this.cornerView.reset(0);
    }
    this.lastStudyTime = s.time;
    if (s.phase === "sparring" && !s.knockout && s.hitStop <= 0)
      this.walkAlpha = alpha;
    this.positionFighters(s.phase === "ready" ? 1 : this.walkAlpha);
    this.reactions[0] *= Math.exp(-dt * 9);
    this.reactions[1] *= Math.exp(-dt * 9);
    for (const [side, fighter] of [
      ["player", this.player],
      ["rival", this.rival],
    ] as const) {
      const strike = side === "player" ? s.playerStrike : s.rivalStrike;
      if (strike) {
        const aim = presentationAim(s, side, strike);
        if (aim) fighter.setAim(this.contact.set(aim.x, aim.y, aim.z));
      }
    }
    this.player.pose({
      time: t,
      dt,
      stance: s.stance,
      strike: s.playerStrike,
      stamina: s.stamina,
      guard: s.spacing.enabled
        ? s.stance === "defensive"
          ? "high"
          : "balanced"
        : undefined,
      reaction: this.reactions[0],
      reactionAttack: this.reactionAttack[0],
      reactionOutcome: this.reactionOutcome[0],
      variant: 0,
      knockout: s.knockout?.recipient === "player" ? s.knockout : null,
      reduced: this.reduced,
      stunned: s.stunUntil.player > s.time,
    });
    this.rival.pose({
      time: t,
      dt,
      stance:
        s.staggerUntil > s.time
          ? "neutral"
          : !s.spacing.enabled || s.spacing.guard === "high"
            ? "defensive"
            : s.spacing.tactic === "advance"
              ? "offensive"
              : "neutral",
      strike: s.rivalStrike ?? s.opponent.feint,
      stamina: s.spacing.enabled ? s.spacing.rivalStamina : 85,
      guard: !s.spacing.enabled
        ? undefined
        : s.stunUntil.rival > s.time || s.staggerUntil > s.time
          ? "open"
          : s.rivalStrike
            ? s.spacing.guard
            : s.spacing.guardNext,
      reaction: this.reactions[1],
      reactionAttack: this.reactionAttack[1],
      reactionOutcome: this.reactionOutcome[1],
      variant: 2,
      knockout: s.knockout?.recipient === "rival" ? s.knockout : null,
      reduced: this.reduced,
      stunned: s.stunUntil.rival > s.time,
    });
    this.player.root.updateMatrixWorld(true);
    this.rival.root.updateMatrixWorld(true);
    this.birds[0].update(
      this.player.head,
      t,
      s.stunUntil.player - s.time,
      this.reduced,
    );
    this.birds[1].update(
      this.rival.head,
      t,
      s.stunUntil.rival - s.time,
      this.reduced,
    );
    this.crowdAt += dt;
    if (this.crowdAt > 0.09) {
      this.arena.update(t);
      this.crowdAt = 0;
    }
    this.cameraKick *= Math.exp(-dt * 13);
    // A restrained ringside move reveals the player's face when they are stunned.
    // Reduced motion retains the usual camera; pause/hit-stop freeze this motor too.
    this.cornerView.integrate(
      !this.reduced && !s.knockout && s.stunUntil.player > s.time ? 1 : 0,
      12,
      dt,
    );
    const view = s.knockout
      ? 0
      : THREE.MathUtils.clamp(this.cornerView.position, 0, 1);
    // A wider, lower composition leaves room for the full fallen silhouette.
    // Sample combat time directly: pause, half speed and terminal poses stay coherent.
    const fallView = s.knockout
      ? this.reduced
        ? 1
        : THREE.MathUtils.smoothstep(t - s.knockout.started, 0, 0.65)
      : 0;
    const space = s.spacing;
    this.compositionTarget.copy(this.target);
    if (space.enabled) {
      this.compositionTarget.x =
        (this.player.root.position.x + this.rival.root.position.x) * 0.5;
      this.compositionTarget.z =
        (this.player.root.position.z + this.rival.root.position.z) * 0.5;
    }
    const room = space.enabled
      ? Math.max(
          0,
          Math.hypot(
            space.player.x - space.rival.x,
            space.player.z - space.rival.z,
          ) - 1.35,
        )
      : 0;
    this.cameraTarget.copy(this.compositionTarget);
    this.cameraTarget.y -= fallView * 0.45;
    this.cameraTarget.x = THREE.MathUtils.lerp(
      this.compositionTarget.x,
      s.knockout?.recipient === "player" ? -0.32 : 0.3,
      fallView,
    );
    const fov =
      this.baseFov +
      (fallView * 10 + Math.min(8, room * 6)) *
        (this.host.clientWidth < 650 ? 1 : 0);
    if (Math.abs(this.camera.fov - fov) > 1e-5) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    // Hold a three-quarter view relative to the pair as they circle, so neither
    // boxer hides the other behind their back. Essential tracking remains in reduced motion.
    const baseAngle = space.enabled
      ? space.player.yaw - 2.1
      : Math.atan2(
          this.baseCamera.x - this.target.x,
          this.baseCamera.z - this.target.z,
        );
    const angle = baseAngle + view * (space.enabled ? 1.1 : 1.4 - baseAngle);
    const radius =
      Math.hypot(
        this.baseCamera.x - this.target.x,
        this.baseCamera.z - this.target.z,
      ) +
      view * 0.35 +
      fallView * 0.55 +
      room * (this.host.clientWidth < 650 ? 1.9 : 0.65);
    // Orbit rather than cutting across the ring: keep both soles and the canaries in frame.
    this.camera.position.set(
      this.cameraTarget.x + Math.sin(angle) * radius,
      this.baseCamera.y + view * 0.05,
      this.compositionTarget.z + Math.cos(angle) * radius,
    );

    if (!this.reduced) {
      this.camera.position.x += Math.sin(t * 87) * this.cameraKick;
      this.camera.position.y += Math.cos(t * 77) * this.cameraKick * 0.6;
    }
    this.camera.lookAt(this.cameraTarget);
    this.camera.updateMatrixWorld();
    if (this.pending) {
      this.placeImpact(this.pending);
      this.pending = null;
    }
    this.updateTrails(
      !this.reduced && s.superUntil > s.time && !!s.playerStrike,
    );
    if (this.particleLife > 0) {
      this.particleLife = Math.max(0, this.particleLife - dt);
      for (let i = 0; i < 54; i++) this.positions[i] += this.velocity[i] * dt;
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
    (this.particles.material as THREE.PointsMaterial).opacity = this.reduced
      ? 0
      : this.particleLife * 2;
    this.renderer.render(this.scene, this.camera);
    this.controller.presented(performance.now());
    if (s.phase === "sparring") {
      this.frames.push(raw * 1000);
      if (this.frames.length > 7200) this.frames.shift();
    }
    this.statsAt += elapsed;
    if (this.statsAt >= 1) {
      this.statsAt = 0;
      const frames = [...this.frames].sort((a, b) => a - b);
      this.onStats({
        fps: Math.round(
          1000 /
            (frames.reduce((a, b) => a + b, 0) / (frames.length || 1) || 16.67),
        ),
        p95:
          Math.round((frames[Math.floor(frames.length * 0.95)] ?? 0) * 10) / 10,
        drawCalls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        samples: frames.length,
        sampledSeconds: Math.round(frames.reduce((a, b) => a + b, 0) / 1000),
        inputSamples: this.controller.inputTiming().count,
        inputP95: this.controller.inputTiming().p95,
      });
    }
  };
  private release() {
    this.observer?.disconnect();
    this.stopEvents?.();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Light && "shadow" in o)
        (o as THREE.DirectionalLight).shadow?.dispose();
      if (o instanceof THREE.InstancedMesh) o.dispose();
    });
    if (this.particles) {
      this.particles.geometry.dispose();
      (this.particles.material as THREE.Material).dispose();
    }
    this.trails.forEach((t) => {
      t.geometry.dispose();
      (t.material as THREE.Material).dispose();
    });
    this.environment?.dispose();
    this.environment = null;
    this.resources.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    document.removeEventListener("visibilitychange", this.visibility);
    this.release();
  }
}
