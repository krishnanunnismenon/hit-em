import * as THREE from "three";
import { Resources, mesh } from "./Resources";
export class Arena {
  readonly group = new THREE.Group();
  private crowd: THREE.InstancedMesh[] = [];
  private cheer = 0;
  private cheerSeed = 0;
  private matrix = new THREE.Matrix4();
  private dummy = new THREE.Object3D();
  private crowdData: {
    x: number;
    z: number;
    y: number;
    angle: number;
    phase: number;
  }[] = [];
  constructor(private r: Resources) {
    const ink = r.material("#222829", 0.92),
      mat = r.material("#c8bba2", 0.94),
      cream = r.material("#e4d9bd", 0.9);
    mesh(
      r.box(28, 0.3, 26, 0.01),
      r.material("#252724", 0.98),
      this.group,
      [0, -0.7, 0],
    );
    mesh(r.box(7.6, 0.5, 7.2, 0.06), ink, this.group, [0, -0.3, 0]);
    mesh(r.box(7.6, 0.14, 7.2, 0.015), mat, this.group, [0, -0.015, 0]);
    for (const [x, z, color] of [
      [-3.55, -3.3, "#e4bd42"],
      [3.55, -3.3, "#e4bd42"],
      [-3.55, 3.3, "#254d8e"],
      [3.55, 3.3, "#a84131"],
    ] as const) {
      mesh(
        r.cylinder(),
        r.material("#252b2c", 0.6),
        this.group,
        [x, 0.75, z],
        [0.075, 1.7, 0.075],
      );
      mesh(
        r.box(0.31, 1.24, 0.31, 0.075),
        r.material(color, 0.58),
        this.group,
        [x, 0.8, z],
      );
    }
    const ropeColors = ["#264e88", "#d6cbb1", "#923f32"];
    for (let level = 0; level < 3; level++) {
      const material = r.material(ropeColors[level], 0.87);
      const y = 0.49 + level * 0.39;
      for (const z of [-3.3, 3.3]) {
        const m = mesh(
          r.cylinder(),
          material,
          this.group,
          [0, y, z],
          [0.035, 7.1, 0.035],
        );
        m.rotation.z = Math.PI / 2;
      }
      for (const x of [-3.55, 3.55]) {
        const m = mesh(
          r.cylinder(),
          material,
          this.group,
          [x, y, 0],
          [0.035, 6.6, 0.035],
        );
        m.rotation.x = Math.PI / 2;
      }
    }
    const wall = r.material("#464c50", 0.92);
    mesh(r.box(20, 8, 0.25, 0.02), wall, this.group, [0, 3, -7]);
    mesh(r.box(0.25, 8, 16, 0.02), wall, this.group, [-9, 3, -1]);
    mesh(r.box(0.25, 8, 16, 0.02), wall, this.group, [9, 3, -1]);
    // Sparse masonry seams; the worn material supplies surface detail.
    for (let i = 0; i < 9; i++)
      mesh(r.box(19, 0.015, 0.03, 0.002), ink, this.group, [
        0,
        i * 0.65 - 0.3,
        -6.855,
      ]);
    for (let i = 0; i < 13; i++)
      mesh(r.box(0.02, 5.8, 0.035, 0.002), ink, this.group, [
        -8.5 + i * 1.4,
        2.55,
        -6.85,
      ]);
    for (const x of [-6.2, -3.8, 3.8, 6.2])
      mesh(
        r.box(1.25, 1.9, 0.025, 0.015),
        r.material(x < 0 ? "#713e30" : "#ae976d", 0.98),
        this.group,
        [x, 2.5, -6.8],
      );
    for (const x of [-7.3, 7.3])
      mesh(
        r.cylinder(),
        r.material("#171e22", 0.75, 0.35),
        this.group,
        [x, 2.5, -6.67],
        [0.09, 6, 0.09],
      );
    const truss = r.material("#20272a", 0.62, 0.45);
    for (const z of [-5.4, -4.4])
      mesh(r.box(16, 0.16, 0.18, 0.015), truss, this.group, [0, 3.75, z]);
    for (const [x, z] of [
      [-3, -4.7],
      [2.7, -4.7],
      [0, -5.5],
    ]) {
      mesh(r.cylinder(), ink, this.group, [x, 3.65, z], [0.32, 0.17, 0.32]);
      const lamp = r.material("#ffe3a3", 0.4);
      lamp.emissive.set("#f5b759");
      lamp.emissiveIntensity = 2;
      const bulb = mesh(
        r.cylinder(),
        lamp,
        this.group,
        [x, 3.54, z],
        [0.24, 0.04, 0.24],
      );
      bulb.castShadow = false;
    }
    mesh(
      r.cylinder(),
      r.material("#252827", 0.7),
      this.group,
      [-3.1, 0.25, 2.5],
      [0.23, 0.42, 0.23],
    );
    this.buildCrowd();
    const hemi = new THREE.HemisphereLight("#e9d7bd", "#29313b", 0.7);
    this.group.add(hemi);
    const key = new THREE.SpotLight("#ffead1", 45, 24, 0.68, 0.58, 1.5);
    key.position.set(-2, 4.8, 2.2);
    key.target.position.set(0, 1, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.035;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 15;
    this.group.add(key, key.target);
    const rim = new THREE.SpotLight("#d3e3ff", 50, 22, 0.6, 0.75, 1.6);
    rim.position.set(4, 4, -3);
    rim.target.position.set(0, 1.25, 0);
    this.group.add(rim, rim.target);
    const wallGlow = new THREE.PointLight("#e69856", 18, 13, 2);
    wallGlow.position.set(0, 3, -5);
    this.group.add(wallGlow);
    const warehouseFill = new THREE.PointLight("#87a7c4", 24, 16, 2);
    warehouseFill.position.set(-3, 3.2, -4);
    this.group.add(warehouseFill);
  }
  private buildCrowd() {
    const r = this.r;
    for (let i = 0; i < 20; i++) {
      const side = i < 8 ? -1 : 1,
        index = i % 8;
      const rear = i >= 16;
      const x = rear
        ? -2.5 + (i - 16) * 1.65
        : side * (4.15 + (index % 2) * 0.45);
      const z = rear ? -4.2 : -3.4 + Math.floor(index / 2) * 1.75;
      this.crowdData.push({
        x,
        z,
        y: -0.32,
        angle: rear ? 0 : side === -1 ? Math.PI / 2 : -Math.PI / 2,
        phase: i * 1.91,
      });
    }
    const parts = [
      {
        g: r.box(0.42, 0.48, 0.27, 0.04),
        m: r.material("#344342", 0.88),
        p: [0, 0.8, 0],
        s: [1, 1, 1],
      },
      {
        g: r.box(0.26, 0.28, 0.25, 0.07),
        m: r.material("#a9845a", 0.75),
        p: [0, 1.2, 0],
        s: [1, 1, 1],
      },
      {
        g: r.box(0.026, 0.016, 0.014, 0.003),
        m: r.material("#171c20", 0.8),
        p: [-0.06, 1.23, 0.13],
        s: [1, 1, 1],
      },
      {
        g: r.box(0.026, 0.016, 0.014, 0.003),
        m: r.material("#171c20", 0.8),
        p: [0.06, 1.23, 0.13],
        s: [1, 1, 1],
      },
      {
        g: r.box(0.28, 0.09, 0.27, 0.035),
        m: r.material("#282525", 0.85),
        p: [0, 1.37, 0],
        s: [1, 1, 1],
      },
      {
        g: r.box(0.16, 0.46, 0.18, 0.03),
        m: r.material("#292e31", 0.9),
        p: [-0.12, 0.32, 0],
        s: [1, 1, 1],
      },
      {
        g: r.box(0.16, 0.46, 0.18, 0.03),
        m: r.material("#292e31", 0.9),
        p: [0.12, 0.32, 0],
        s: [1, 1, 1],
      },
      {
        g: r.box(0.13, 0.37, 0.13, 0.035),
        m: r.material("#6e634c", 0.8),
        p: [-0.29, 0.82, 0.02],
        s: [1, 1, 1],
      },
      {
        g: r.box(0.13, 0.37, 0.13, 0.035),
        m: r.material("#6e634c", 0.8),
        p: [0.29, 0.82, 0.02],
        s: [1, 1, 1],
      },
    ];
    parts.forEach((part) => {
      const batch = new THREE.InstancedMesh(
        part.g,
        part.m,
        this.crowdData.length,
      );
      batch.userData.part = part;
      batch.castShadow = false;
      this.group.add(batch);
      this.crowd.push(batch);
      this.crowdData.forEach((d, i) => {
        const color = new THREE.Color(
          i % 4 === 0
            ? "#a44e37"
            : i % 4 === 1
              ? "#436379"
              : i % 4 === 2
                ? "#9a875d"
                : "#667468",
        );
        if (part.p[1] === 0.8) batch.setColorAt(i, color);
      });
    });
    this.update(0);
  }
  react(id: number, power: number) {
    this.cheer = Math.min(0.16, power * 0.035);
    this.cheerSeed = id;
  }
  update(time: number) {
    this.cheer *= 0.88;
    this.crowd.forEach((batch) => {
      const part = batch.userData.part;
      this.crowdData.forEach((d, i) => {
        this.dummy.position.set(
          d.x,
          d.y + part.p[1] + Math.sin(time * 0.8 + d.phase) * 0.013,
          d.z,
        );
        const x = part.p[0],
          z = part.p[2];
        this.dummy.position.x += x * Math.cos(d.angle) + z * Math.sin(d.angle);
        this.dummy.position.z += -x * Math.sin(d.angle) + z * Math.cos(d.angle);
        const cheering =
          (i + this.cheerSeed) % 4 === 0 &&
          part.p[0] !== 0 &&
          part.p[1] === 0.82;
        this.dummy.rotation.set(
          cheering ? -this.cheer * 2 : 0,
          d.angle,
          cheering ? Math.sign(part.p[0]) * this.cheer * 2 : 0,
        );
        this.dummy.scale.set(...(part.s as [number, number, number]));
        this.dummy.updateMatrix();
        this.matrix.copy(this.dummy.matrix);
        batch.setMatrixAt(i, this.matrix);
      });
      batch.instanceMatrix.needsUpdate = true;
    });
  }
  async loadTexture(url: string) {
    const texture = await this.r.texture(url, 3);
    const floor = (this.group.children[2] as THREE.Mesh)
      .material as THREE.MeshStandardMaterial;
    const wall = this.r.material("#464c50", 0.92);
    wall.map = texture;
    wall.needsUpdate = true;
    floor.map = texture;
    floor.needsUpdate = true;
  }
}
