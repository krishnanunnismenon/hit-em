import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Fighter } from "./Fighter";
import { stageFighters } from "./FighterStage";
import { Resources } from "./Resources";
import { applyPoseProbe } from "./PoseProbe";
import type { Strike } from "../domain/types";
import { strikeDuration } from "../domain/study";
import { GUARDS, type GuardShape } from "../domain/tactics";

async function fixture() {
  const resources = new Resources();
  const assets = await Promise.all(
    ["player", "rival"].map(async (name) => {
      const data = await readFile(
        new URL(`../../../../public/models/${name}.glb`, import.meta.url),
      );
      const parsed = await new GLTFLoader().parseAsync(
        data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
        "",
      );
      assert.equal(resources.adoptModel(parsed.scene), true);
      return parsed.scene;
    }),
  );
  const appearance = {
    skin: "#bd8653",
    gloves: "#1c65bf",
    shorts: "#202934",
    hair: "#20202a",
    boots: "#222c38",
  };
  const player = new Fighter(
    resources,
    { ...appearance, identity: "player" },
    assets[0],
  );
  const rival = new Fighter(
    resources,
    { ...appearance, identity: "rival", scale: 1.02 },
    assets[1],
  );
  stageFighters(player, rival);
  return { player, rival, resources };
}

const neutral = {
  time: 0,
  dt: 1 / 120,
  stance: "neutral" as const,
  strike: null,
  stamina: 100,
  reaction: 0,
  reactionAttack: "jab",
  variant: 0,
  knockout: null,
};

test("authored knuckles reach latched face and guard surfaces at contact, including hit-stop", async () => {
  const { player, rival, resources } = await fixture();
  try {
    const failures: string[] = [];
    for (const [striker, receiver, side] of [
      [player, rival, "player"],
      [rival, player, "rival"],
    ] as const) {
      for (const attack of ["jab", "cross", "hook", "uppercut"] as const) {
        for (const outcome of ["hit", "block"] as const) {
          for (const power of [1, 2, 3, 4]) {
            player.resetDynamics();
            rival.resetDynamics();
            player.pose({ ...neutral, dt: 1 });
            rival.pose({ ...neutral, dt: 1 });
            const target = receiver
              .attackTarget(attack, outcome, new THREE.Vector3())
              .clone();
            striker.setAim(target);
            const strike: Strike = {
              attack,
              stance: "neutral",
              outcome,
              power,
              variant: 0,
              started: 0,
              contactAt: 0.2,
              duration: 0.7,
              resolved: false,
            };
            for (let frame = 0; frame <= 24; frame++)
              striker.pose({ ...neutral, time: frame / 120, strike });
            strike.resolved = true;
            striker.pose({ ...neutral, time: 0.2, dt: 0, strike });
            const distance = striker
              .glovePosition(attack, new THREE.Vector3())
              .distanceTo(target);
            if (distance >= 0.04)
              failures.push(
                `${side}/${attack}/${outcome}/power${power}: ${distance.toFixed(3)} m`,
              );
          }
        }
      }
    }
    assert.deepEqual(
      failures,
      [],
      "every authored contact must be reachable without stretching limbs",
    );
  } finally {
    resources.dispose();
  }
});

test("GLB figures have finite geometry and remain distinct editable assemblies", async () => {
  const { player, rival, resources } = await fixture();
  try {
    const silhouettes: number[] = [];
    for (const fighter of [player, rival]) {
      let triangles = 0;
      fighter.root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const position = object.geometry.getAttribute("position");
        assert.ok(
          position && Array.from(position.array).every(Number.isFinite),
        );
        triangles += (object.geometry.index?.count ?? position.count) / 3;
      });
      assert.ok(
        triangles > 1000 && triangles < 150000,
        `fighter triangle budget: ${triangles}`,
      );
      silhouettes.push(triangles);
      assert.ok(fighter.head.children.length > 2);
    }
    assert.notEqual(
      silhouettes[0],
      silhouettes[1],
      "independent hair and head assets should not be identical geometry",
    );
  } finally {
    resources.dispose();
  }
});

test("striking shoulders advance and labelled contact fixtures preserve fitted reach", async () => {
  const { player, rival, resources } = await fixture();
  try {
    for (const attack of ["jab", "cross", "hook", "uppercut"] as const) {
      for (const outcome of ["hit", "block"] as const) {
        applyPoseProbe(player, rival, {
          attack,
          outcome,
          phase: "contact",
          power: 4,
        });
        const shoulder = new THREE.Vector3(
          attack === "jab" || attack === "hook" ? 0.43 : -0.43,
          0,
          0,
        );
        shoulder.applyQuaternion(player.body.quaternion);
        assert.ok(
          shoulder.z > 0.015,
          `${attack} must advance its striking shoulder`,
        );
        const target = rival.attackTarget(attack, outcome, new THREE.Vector3());
        assert.ok(
          player.glovePosition(attack, new THREE.Vector3()).distanceTo(target) <
            0.04,
          `${attack}/${outcome}: fixture must show real authored contact`,
        );
      }
      applyPoseProbe(player, rival, {
        attack,
        outcome: "hit",
        phase: "recoil",
        power: 4,
      });
      assert.ok(
        rival.head.rotation.x < -0.01,
        `${attack} must visibly recoil the head`,
      );
    }
  } finally {
    resources.dispose();
  }
});

test("all 64 techniques retain contact, fixed limb lengths, supported toes and distinct lower-body commitment", async () => {
  const { player, rival, resources } = await fixture();
  const find = (name: string) => {
    let result!: THREE.Object3D;
    player.root.traverse((o) => {
      if (o.name.replace(/(?:\.)?\d{3}$/, "") === name) result = o;
    });
    return result;
  };
  try {
    const fingerprints = new Set<string>();
    for (const attack of ["jab", "cross", "hook", "uppercut"] as const)
      for (const stance of [
        "defensive",
        "offensive",
        "neutral",
        "super",
      ] as const)
        for (const power of [1, 2, 3, 4]) {
          applyPoseProbe(player, rival, {
            attack,
            stance,
            power,
            outcome: "hit",
            phase: "contact",
          });
          const distance = player
            .glovePosition(attack, new THREE.Vector3())
            .distanceTo(rival.attackTarget(attack, "hit", new THREE.Vector3()));
          assert.ok(
            distance < 0.04,
            `${attack}/${stance}/${power}: contact error ${distance.toFixed(3)}`,
          );
          for (const side of ["L", "R"]) {
            for (const part of ["ArmUpper", "ArmLower"])
              assert.ok(Math.abs(find(part + side).scale.y - 0.5) < 0.001);
            for (const part of ["LegUpper", "LegLower"])
              assert.ok(
                Math.abs(find(part + side).scale.y - 0.43) < 0.001,
                `${attack}/${stance}/${power}: no shin stretch`,
              );
            const foot = find("Foot" + side),
              toe = new THREE.Vector3(0, -0.137, 0.17)
                .applyEuler(foot.rotation)
                .add(foot.position);
            assert.ok(toe.y >= -1e-6, "supported toe must not go below floor");
          }
          const rear = find("FootL"),
            lead = find("FootR");
          const supported = [rear, lead].some(
            (f) =>
              Math.abs(
                new THREE.Vector3(0, -0.137, 0.17)
                  .applyEuler(f.rotation)
                  .add(f.position).y,
              ) < 1e-6,
          );
          assert.ok(supported, "at least one planted toe supports every punch");
          fingerprints.add(
            [
              player.body.rotation.y,
              find("Hips").rotation.y,
              rear.rotation.y,
              lead.rotation.y,
              lead.position.z,
              find("KneeL").position.y,
            ]
              .map((x) => x.toFixed(4))
              .join("/"),
          );
        }
    assert.equal(
      fingerprints.size,
      64,
      "stance and power must alter the kinetic chain, not just glove colour or speed",
    );
  } finally {
    resources.dispose();
  }
});

test("full punch trajectories keep floor support and give hooks a lateral arc and uppercuts a rising arc", async () => {
  const { player, rival, resources } = await fixture();
  const paths = new Map<string, THREE.Vector3[]>();
  const objects = new Map<string, THREE.Object3D>();
  player.root.traverse((o) =>
    objects.set(o.name.replace(/(?:\.)?\d{3}$/, ""), o),
  );
  try {
    for (const attack of ["jab", "cross", "hook", "uppercut"] as const)
      for (const stance of [
        "defensive",
        "offensive",
        "neutral",
        "super",
      ] as const)
        for (const power of [1, 2, 3, 4]) {
          player.resetDynamics();
          rival.resetDynamics();
          player.pose({ ...neutral, stance, dt: 1 });
          rival.pose({ ...neutral, stance: "defensive", dt: 1 });
          player.setAim(rival.attackTarget(attack, "hit", new THREE.Vector3()));
          const strike: Strike = {
            attack,
            stance,
            power,
            variant: 0,
            started: 0,
            contactAt: 0.19 + (power - 1) * 0.035,
            duration: 0.8 + power * 0.105,
            resolved: false,
            outcome: "hit",
          };
          const path: THREE.Vector3[] = [];
          for (let n = 0; n <= Math.ceil(strike.duration * 120); n++) {
            const time = n / 120;
            player.pose({ ...neutral, stance, time, strike });
            const toeHeights = ["FootL", "FootR"].map((name) => {
              const foot = objects.get(name)!;
              return new THREE.Vector3(0, -0.137, 0.17)
                .applyEuler(foot.rotation)
                .add(foot.position).y;
            });
            assert.ok(toeHeights.every((y) => y >= -1e-6));
            assert.ok(
              toeHeights.some((y) => Math.abs(y) < 1e-6),
              `${attack}/${stance}/${power}/${time}: at least one support foot`,
            );
            for (const side of ["L", "R"])
              for (const part of ["LegUpper", "LegLower"])
                assert.ok(
                  Math.abs(objects.get(part + side)!.scale.y - 0.43) < 0.001,
                  "limb lengths stay fixed throughout stepping",
                );
            if (time <= strike.contactAt && stance === "neutral" && power === 4)
              path.push(
                player.root.worldToLocal(
                  player.glovePosition(attack, new THREE.Vector3()),
                ),
              );
          }
          if (path.length) paths.set(attack, path);
        }
    const jab = paths.get("jab")!,
      hook = paths.get("hook")!,
      upper = paths.get("uppercut")!;
    const width = (path: THREE.Vector3[]) =>
      Math.max(...path.map((p) => p.x)) - Math.min(...path.map((p) => p.x));
    assert.ok(
      width(hook) > width(jab) + 0.15,
      `hook lateral span ${width(hook).toFixed(3)}, jab ${width(jab).toFixed(3)}`,
    );
    assert.ok(
      Math.min(...upper.map((p) => p.y)) <
        Math.min(...jab.map((p) => p.y)) - 0.15,
      "uppercut visibly loads below the straight-punch path",
    );
    assert.ok(
      upper.at(-1)!.y - Math.min(...upper.map((p) => p.y)) > 0.3,
      "uppercut rises into its target",
    );
  } finally {
    resources.dispose();
  }
});

test("both authored fighters express distinct received punches, retain support/limb lengths, and reset their faces", async () => {
  const { player, rival, resources } = await fixture();
  try {
    for (const fighter of [player, rival]) {
      const named = (name: string) => {
        let found!: THREE.Object3D;
        fighter.root.traverse((o) => {
          if (o.name.replace(/(?:\.)?\d{3}$/, "") === name) found = o;
        });
        return found;
      };
      const mouth = named("Mouth"),
        brows = [named("BrowL"), named("BrowR")];
      const baseline = brows.map((x) => x.rotation.z);
      const shapes = new Set<string>();
      for (const attack of ["jab", "cross", "hook", "uppercut"] as const) {
        fighter.resetDynamics();
        fighter.pose({ ...neutral, dt: 0 });
        fighter.impact(attack, 4, "hit");
        for (let i = 1; i <= 180; i++) {
          fighter.pose({ ...neutral, time: i / 120, dt: 1 / 120 });
          if (i === 6)
            shapes.add(
              [
                mouth.scale.x,
                mouth.scale.y,
                mouth.rotation.z,
                brows[0].position.y,
                brows[0].rotation.z,
              ]
                .map((x) => x.toFixed(4))
                .join("/"),
            );
          const toes = ["L", "R"].map((side) => {
            const f = named("Foot" + side);
            return new THREE.Vector3(0, -0.137, 0.17)
              .applyEuler(f.rotation)
              .add(f.position).y;
          });
          assert.ok(toes.every((y) => y >= -1e-6));
          assert.ok(toes.some((y) => Math.abs(y) < 1e-6));
          for (const side of ["L", "R"])
            for (const part of ["LegUpper", "LegLower"])
              assert.ok(Math.abs(named(part + side).scale.y - 0.43) < 0.001);
        }
      }
      assert.equal(shapes.size, 4, "all receiving expressions must differ");
      fighter.pose({ ...neutral, dt: 0, stunned: true });
      assert.equal(mouth.visible, false);
      assert.equal(
        fighter.head.getObjectByName("Dazed spiral eyes")?.visible,
        true,
      );
      fighter.pose({ ...neutral, dt: 0, stunned: false });
      assert.equal(mouth.visible, true);
      fighter.resetDynamics();
      fighter.pose({ ...neutral, dt: 0 });
      assert.equal(mouth.scale.y, 1);
      assert.deepEqual(
        brows.map((x) => x.rotation.z),
        baseline,
      );
      assert.equal(
        fighter.head.getObjectByName("Dazed spiral eyes")?.visible,
        false,
      );
    }
  } finally {
    resources.dispose();
  }
});

test("both fighters keep supported uncrossed feet, fixed legs and contact throughout all 192 footwork tactics", async () => {
  const { player, rival, resources } = await fixture();
  const failures: string[] = [];
  const signatures = new Set<string>();
  try {
    for (const [striker, receiver, side] of [
      [player, rival, "player"],
      [rival, player, "rival"],
    ] as const) {
      const objects = new Map<string, THREE.Object3D>();
      striker.root.traverse((o) =>
        objects.set(o.name.replace(/(?:\.)?\d{3}$/, ""), o),
      );
      for (const attack of ["jab", "cross", "hook", "uppercut"] as const)
        for (const stance of [
          "defensive",
          "offensive",
          "neutral",
          "super",
        ] as const)
          for (const power of [1, 2, 3, 4])
            for (const variant of [0, 1, 2]) {
              striker.resetDynamics();
              receiver.resetDynamics();
              striker.pose({ ...neutral, stance, dt: 0 });
              receiver.pose({ ...neutral, stance: "defensive", dt: 0 });
              const target = receiver
                .attackTarget(attack, "hit", new THREE.Vector3())
                .clone();
              striker.setAim(target);
              const a: Strike = {
                attack,
                stance,
                power,
                variant,
                started: 0,
                contactAt: 0.19 + (power - 1) * 0.035,
                duration: strikeDuration(attack, power, stance, variant),
                outcome: "hit",
                resolved: false,
              };
              const label = `${side}/${stance}/${attack}/${power}/${variant}`;
              const signature: string[] = [];
              let contactError = 0;
              const frames = Math.ceil((a.duration + 0.3) * 120);
              let previous = 0;
              for (let frame = 0; frame <= frames; frame++) {
                const time = Math.min(frame / 120, a.contactAt);
                // Sample the exact latched contact clock, then continue through complete recovery.
                const clock =
                  frame / 120 < a.contactAt
                    ? time
                    : frame === Math.ceil(a.contactAt * 120)
                      ? a.contactAt
                      : frame / 120;
                striker.pose({
                  ...neutral,
                  stance,
                  time: clock,
                  dt: clock - previous,
                  strike: clock <= a.duration ? a : null,
                });
                previous = clock;
                if (clock === a.contactAt) {
                  contactError = striker
                    .glovePosition(attack, new THREE.Vector3())
                    .distanceTo(target);
                  if (contactError >= 0.04)
                    failures.push(
                      `${label}: contact ${contactError.toFixed(4)} m`,
                    );
                }
                const feet = [objects.get("FootL")!, objects.get("FootR")!];
                const toes = feet.map((f) =>
                  new THREE.Vector3(0, -0.137, 0.17)
                    .applyEuler(f.rotation)
                    .add(f.position),
                );
                assert.ok(
                  toes.every((p) => p.y >= -1e-6),
                  `${label}: floor`,
                );
                assert.ok(
                  toes.some((p) => Math.abs(p.y) < 1e-6),
                  `${label}: support`,
                );
                assert.ok(
                  toes[1].x - toes[0].x > 0.28,
                  `${label}: uncrossed feet`,
                );
                for (const leg of ["L", "R"])
                  for (const part of ["LegUpper", "LegLower"])
                    assert.ok(
                      Math.abs(objects.get(part + leg)!.scale.y - 0.43) < 0.001,
                      `${label}: fixed limb`,
                    );
                if (frame % 12 === 0)
                  signature.push(
                    ...feet
                      .flatMap((f) => [
                        f.position.x,
                        f.position.z,
                        f.rotation.y,
                      ])
                      .map((x) => x.toFixed(4)),
                  );
              }
              if (side === "player") signatures.add(signature.join("/"));
            }
    }
    assert.deepEqual(
      failures,
      [],
      "all contact landmarks must remain reachable",
    );
    assert.equal(
      signatures.size,
      192,
      "each tactic has a distinct actual lower-body trajectory",
    );
  } finally {
    resources.dispose();
  }
});

test("actual angled footwork matches at 30/60/120 Hz, freezes on pause and clears every prior swing on reset", async () => {
  const { player, rival, resources } = await fixture();
  const objects = new Map<string, THREE.Object3D>();
  player.root.traverse((o) =>
    objects.set(o.name.replace(/(?:\.)?\d{3}$/, ""), o),
  );
  const sample = () =>
    ["FootL", "FootR", "Hips"].flatMap((name) => {
      const o = objects.get(name)!;
      return [
        ...o.position.toArray(),
        o.rotation.x,
        o.rotation.y,
        o.rotation.z,
      ];
    });
  try {
    for (const stance of [
      "defensive",
      "offensive",
      "neutral",
      "super",
    ] as const) {
      const a: Strike = {
        attack: "hook",
        stance,
        power: 4,
        variant: 2,
        started: 0,
        contactAt: 0.295,
        duration: strikeDuration("hook", 4, stance, 2),
        outcome: "hit",
        resolved: false,
      };
      const runs: number[][] = [];
      for (const fps of [30, 60, 120]) {
        player.resetDynamics();
        rival.resetDynamics();
        player.pose({ ...neutral, stance, dt: 0 });
        rival.pose({ ...neutral, stance: "defensive", dt: 0 });
        const home = sample();
        player.setAim(rival.attackTarget("hook", "hit", new THREE.Vector3()));
        for (let n = 1; n <= fps / 2; n++)
          player.pose({
            ...neutral,
            stance,
            strike: a,
            time: n / fps,
            dt: 1 / fps,
          });
        const moving = sample();
        runs.push(moving);
        for (let n = 0; n < 5; n++)
          player.pose({ ...neutral, stance, strike: a, time: 0.5, dt: 0 });
        assert.deepEqual(
          sample(),
          moving,
          "pause cannot keep drifting the feet",
        );
        player.resetDynamics();
        player.pose({ ...neutral, stance, dt: 0 });
        assert.deepEqual(
          sample(),
          home,
          "reset reseeds both toe positions and cancels airborne intent",
        );
      }
      for (const run of runs.slice(1))
        run.forEach((value, index) =>
          assert.ok(
            Math.abs(value - runs[0][index]) < 1e-8,
            `${stance}: render-independent feet`,
          ),
        );
    }
  } finally {
    resources.dispose();
  }
});

test("receiving impulse during a step retains a supporting foot and fixed shins", async () => {
  const { player, rival, resources } = await fixture();
  const objects = new Map<string, THREE.Object3D>();
  player.root.traverse((o) =>
    objects.set(o.name.replace(/(?:\.)?\d{3}$/, ""), o),
  );
  try {
    const a: Strike = {
      attack: "jab",
      stance: "defensive",
      power: 2,
      variant: 1,
      started: 0,
      contactAt: 0.225,
      duration: strikeDuration("jab", 2, "defensive", 1),
      outcome: "hit",
      resolved: false,
    };
    player.resetDynamics();
    player.pose({ ...neutral, stance: "defensive", dt: 0 });
    player.setAim(rival.attackTarget("jab", "hit", new THREE.Vector3()));
    for (let frame = 1; frame <= 180; frame++) {
      if (frame === 8) player.impact("hook", 2, "hit");
      const time = frame / 120;
      player.pose({
        ...neutral,
        stance: "defensive",
        time,
        strike: time < a.duration ? a : null,
      });
      const toes = ["L", "R"].map((side) => {
        const f = objects.get("Foot" + side)!;
        return new THREE.Vector3(0, -0.137, 0.17)
          .applyEuler(f.rotation)
          .add(f.position);
      });
      assert.ok(toes.every((p) => p.y >= -1e-6));
      assert.ok(toes.some((p) => Math.abs(p.y) < 1e-6));
      for (const side of ["L", "R"])
        for (const part of ["LegUpper", "LegLower"])
          assert.ok(Math.abs(objects.get(part + side)!.scale.y - 0.43) < 0.001);
    }
  } finally {
    resources.dispose();
  }
});

test("all six falls on both authored figures keep fixed limbs above the mat and hold distinct final poses", async () => {
  const { player, rival, resources } = await fixture();
  const styles = (await import("../domain/knockout")).KNOCKOUT_STYLES;
  const point = new THREE.Vector3(),
    box = new THREE.Box3();
  try {
    for (const fighter of [player, rival]) {
      const finishes = new Set<string>();
      for (let variant = 0; variant < styles.length; variant++) {
        for (const reduced of [false, true]) {
          fighter.resetDynamics();
          fighter.pose({ ...neutral, dt: 1 });
          const knockout = {
            recipient: "player" as const,
            variant,
            attack: "cross" as const,
            power: 4,
            started: 0,
            duration: styles[variant].duration,
            nextImpact: 0,
            preview: true,
          };
          for (
            let frame = 0;
            frame <= Math.ceil(knockout.duration * 30);
            frame++
          ) {
            const time = frame / 30;
            fighter.pose({ ...neutral, knockout, time, dt: 1 / 30, reduced });
            fighter.root.updateMatrixWorld(true);
            box.makeEmpty();
            fighter.root.traverse((o) => {
              const name = o.name.replace(/(?:\.)?\d{3}$/, "");
              if (/^(ArmUpper|ArmLower)[LR]$/.test(name))
                assert.ok(
                  Math.abs(o.scale.y - 0.5) < 0.001,
                  `${variant}: arm length`,
                );
              if (/^(LegUpper|LegLower)[LR]$/.test(name))
                assert.ok(
                  Math.abs(o.scale.y - 0.43) < 0.001,
                  `${variant}: shin length`,
                );
              if (!(o instanceof THREE.Mesh) || !o.visible) return;
              o.geometry.computeBoundingBox();
              const bounds = o.geometry.boundingBox!;
              for (let c = 0; c < 8; c++) {
                point
                  .set(
                    c & 1 ? bounds.max.x : bounds.min.x,
                    c & 2 ? bounds.max.y : bounds.min.y,
                    c & 4 ? bounds.max.z : bounds.min.z,
                  )
                  .applyMatrix4(o.matrixWorld);
                assert.ok(Number.isFinite(point.lengthSq()));
                box.expandByPoint(point);
              }
            });
            assert.ok(
              box.min.y >= fighter.root.position.y - 1e-5,
              `fall ${variant}/${reduced} at ${time}: mesh beneath mat ${box.min.y}`,
            );
            assert.ok(box.max.y < 3.5, `fall ${variant}: unbounded lift`);
          }
          fighter.head.getWorldPosition(point);
          assert.ok(
            point.y < 1.25,
            `fall ${variant}: head must lie down, got ${point.y}`,
          );
          if (!reduced)
            finishes.add(
              [point.x, point.y, point.z].map((v) => v.toFixed(2)).join("/"),
            );
          const pivot = fighter.root.getObjectByName("Knockout pivot")!;
          const frozen = pivot.matrixWorld.clone();
          fighter.pose({
            ...neutral,
            knockout,
            time: knockout.duration + 3,
            dt: 0,
            reduced,
          });
          fighter.root.updateMatrixWorld(true);
          assert.ok(
            pivot.matrixWorld.equals(frozen),
            "finished body must stay still",
          );
          fighter.resetDynamics();
          fighter.pose({ ...neutral, dt: 1 });
          fighter.root.updateMatrixWorld(true);
          fighter.head.getWorldPosition(point);
          assert.ok(point.y > 2, "reset restores the standing rig");
          assert.ok(Math.abs(pivot.rotation.x) < 1e-10);
          assert.ok(Math.abs(pivot.rotation.z) < 1e-10);
        }
      }
      assert.equal(
        finishes.size,
        6,
        "six distinct grounded silhouettes per boxer",
      );
    }
  } finally {
    resources.dispose();
  }
});

test("fall geometry samples the same combat-clock pose at 30, 60 and 120 Hz and freezes on pause", async () => {
  const { player, resources } = await fixture();
  const styles = (await import("../domain/knockout")).KNOCKOUT_STYLES;
  try {
    for (let variant = 0; variant < 6; variant++) {
      const samples: number[][] = [];
      for (const fps of [30, 60, 120]) {
        player.resetDynamics();
        player.pose({ ...neutral, dt: 1 });
        const knockout = {
          recipient: "player" as const,
          variant,
          attack: "cross" as const,
          power: 4,
          started: 0,
          duration: styles[variant].duration,
          nextImpact: 0,
          preview: true,
        };
        for (let frame = 0; frame <= fps; frame++)
          player.pose({ ...neutral, knockout, time: frame / fps, dt: 1 / fps });
        player.root.updateMatrixWorld(true);
        const pivot = player.root.getObjectByName("Knockout pivot")!;
        samples.push(pivot.matrixWorld.elements.slice());
        const before = pivot.matrixWorld.clone();
        player.pose({ ...neutral, knockout, time: 1, dt: 0 });
        player.root.updateMatrixWorld(true);
        assert.ok(pivot.matrixWorld.equals(before));
      }
      for (let n = 1; n < samples.length; n++)
        for (let c = 0; c < 16; c++)
          assert.ok(
            Math.abs(samples[n][c] - samples[0][c]) < 1e-7,
            `fall ${variant}: render rate drift`,
          );
    }
  } finally {
    resources.dispose();
  }
});

test("live spacing keeps both authored boxers grounded with fixed-length legs through approaches and retreats", async () => {
  const { player, rival, resources } = await fixture();
  const { createStudy, command, step, FIXED_STEP } =
    await import("../domain/study");
  const s = createStudy(true, 8765);
  command(s, { type: "spacing-lab", enabled: true });
  const previous = new Map<THREE.Object3D, THREE.Vector3>();
  let maxPlantedSlip = 0,
    plantedSamples = 0;
  const joints = [player, rival].map((fighter) => {
    const objects = new Map<string, THREE.Object3D>();
    fighter.root.traverse((o) =>
      objects.set(o.name.replace(/(?:\.)?\d{3}$/, ""), o),
    );
    return objects;
  });
  try {
    for (let frame = 0; frame < 1800; frame++) {
      if (frame % 180 === 0)
        command(s, {
          type: "select",
          wheel: "stance",
          index: (frame / 180) % 4,
        });
      if (frame % 180 === 90) command(s, { type: "punch" });
      step(s, FIXED_STEP);
      for (const [index, fighter] of [player, rival].entries()) {
        const actor = index === 0 ? s.spacing.player : s.spacing.rival;
        fighter.walk(actor);
        fighter.pose({
          ...neutral,
          time: s.time,
          dt: FIXED_STEP,
          stance: index === 0 ? s.stance : "neutral",
          strike: index === 0 ? s.playerStrike : null,
          stamina: index === 0 ? s.stamina : s.spacing.rivalStamina,
        });
        let supported = false;
        for (const [legIndex, side] of ["L", "R"].entries()) {
          for (const part of ["LegUpper", "LegLower"]) {
            const length = joints[index].get(part + side)!.scale.y;
            assert.ok(
              Math.abs(length - 0.43) < 0.001,
              `frame${frame}/${index}/${part}: ${length}`,
            );
          }
          const foot = joints[index].get("Foot" + side)!;
          const toe = foot.localToWorld(new THREE.Vector3(0, -0.137, 0.17));
          assert.ok(
            toe.y >= 0.055 - 1e-5,
            "live toe must not pass below canvas",
          );
          if (Math.abs(toe.y - 0.055) < 1e-5) supported = true;
          const last = previous.get(foot),
            plant = actor.feet[legIndex];
          if (
            frame % 180 > 30 &&
            frame % 180 < 80 &&
            last &&
            !s.playerStrike &&
            plant.y === 0 &&
            plant.previousY === 0
          ) {
            maxPlantedSlip = Math.max(
              maxPlantedSlip,
              Math.hypot(toe.x - last.x, toe.z - last.z),
            );
            plantedSamples++;
          }
          previous.set(foot, toe);
        }
        assert.ok(
          supported,
          `frame${frame}/${index}: a foot must support the boxer`,
        );
      }
    }
    assert.ok(plantedSamples > 100);
    assert.ok(
      maxPlantedSlip < 0.005,
      `planted-foot drift: ${maxPlantedSlip.toFixed(4)} m per frame`,
    );
  } finally {
    resources.dispose();
  }
});

test("gameplay reach boundaries fit both authored boxers across stance, power and footwork", async () => {
  const { player, rival, resources } = await fixture();
  const { PUNCH_REACH } = await import("../domain/spacing");
  const errors: string[] = [];
  try {
    for (const [striker, receiver, side] of [
      [player, rival, "player"],
      [rival, player, "rival"],
    ] as const)
      for (const attack of ["jab", "cross", "hook", "uppercut"] as const)
        for (const stance of [
          "defensive",
          "offensive",
          "neutral",
          "super",
        ] as const)
          for (const power of [1, 2, 3, 4])
            for (const variant of [0, 1, 2]) {
              player.resetDynamics();
              rival.resetDynamics();
              const spread = PUNCH_REACH[attack] / 1.35;
              player.place(-0.44 * spread, 0.055, 0.57 * spread, 2.5);
              rival.place(0.37 * spread, 0.055, -0.51 * spread, -0.64);
              striker.pose({ ...neutral, stance, dt: 1 });
              receiver.pose({ ...neutral, dt: 1 });
              const target = receiver
                .attackTarget(attack, "hit", new THREE.Vector3())
                .clone();
              striker.setAim(target);
              const strike: Strike = {
                attack,
                stance,
                power,
                variant,
                started: 0,
                duration: strikeDuration(attack, power, stance, variant),
                contactAt: 0.19 + (power - 1) * 0.035,
                resolved: false,
                outcome: "hit",
              };
              for (
                let frame = 0;
                frame <= Math.ceil(strike.contactAt * 120);
                frame++
              )
                striker.pose({
                  ...neutral,
                  stance,
                  strike,
                  time: Math.min(frame / 120, strike.contactAt),
                });
              const error = striker
                .glovePosition(attack, new THREE.Vector3())
                .distanceTo(target);
              if (error >= 0.04)
                errors.push(
                  `${side}/${attack}/${stance}/${power}/${variant}: ${error.toFixed(3)}`,
                );
            }
    assert.deepEqual(
      errors,
      [],
      "a gameplay hit should have visibly reachable authored contact",
    );
  } finally {
    resources.dispose();
  }
});

test("all seven guard shapes on both authored figures show the correct hand, preserve constraints and freeze on pause", async () => {
  const { player, rival, resources } = await fixture();
  try {
    for (const fighter of [player, rival]) {
      const joints = new Map<string, THREE.Object3D>();
      fighter.root.traverse((o) =>
        joints.set(o.name.replace(/(?:\.)?\d{3}$/, ""), o),
      );
      const sample = (guard: GuardShape) => {
        fighter.resetDynamics();
        for (let frame = 0; frame < 120; frame++)
          fighter.pose({ ...neutral, time: frame / 120, guard });
        const left = fighter.root.worldToLocal(
          fighter.glovePosition("jab", new THREE.Vector3()),
        );
        const right = fighter.root.worldToLocal(
          fighter.glovePosition("cross", new THREE.Vector3()),
        );
        for (const side of ["L", "R"]) {
          for (const part of ["ArmUpper", "ArmLower"])
            assert.ok(Math.abs(joints.get(part + side)!.scale.y - 0.5) < 0.001);
          for (const part of ["LegUpper", "LegLower"])
            assert.ok(
              Math.abs(joints.get(part + side)!.scale.y - 0.43) < 0.001,
            );
        }
        const toes = ["L", "R"].map((side) => {
          const foot = joints.get("Foot" + side)!;
          return new THREE.Vector3(0, -0.137, 0.17)
            .applyEuler(foot.rotation)
            .add(foot.position);
        });
        assert.ok(
          toes.every((toe) => toe.y >= -1e-6),
          `${guard}: no floor penetration`,
        );
        assert.ok(
          toes.some((toe) => Math.abs(toe.y) < 1e-6),
          `${guard}: planted support`,
        );
        assert.ok(
          [left, right].every((v) => [v.x, v.y, v.z].every(Number.isFinite)),
        );
        const frozen = fighter.glovePosition("jab", new THREE.Vector3());
        fighter.pose({ ...neutral, time: 1, dt: 0, guard });
        assert.ok(
          frozen.distanceTo(fighter.glovePosition("jab", new THREE.Vector3())) <
            1e-9,
        );
        return { left, right, width: left.distanceTo(right) };
      };
      const shapes = new Map(
        Object.keys(GUARDS).map((key) => [key, sample(key as GuardShape)]),
      );
      const rest = shapes.get("balanced")!;
      assert.ok(
        shapes.get("left-low")!.left.y < rest.left.y - 0.2,
        "left-low lowers anatomical left glove",
      );
      assert.ok(
        shapes.get("right-low")!.right.y < rest.right.y - 0.2,
        "right-low lowers anatomical right glove",
      );
      assert.ok(
        shapes.get("wide")!.width > shapes.get("high")!.width + 0.2,
        "wide and tight guards have different visible lanes",
      );
      sample("left-low");
      fighter.resetDynamics();
      for (let frame = 0; frame < 120; frame++)
        fighter.pose({ ...neutral, time: frame / 120 });
      const reset = fighter.root.worldToLocal(
        fighter.glovePosition("jab", new THREE.Vector3()),
      );
      assert.ok(
        reset.y > shapes.get("left-low")!.left.y + 0.2,
        "reset clears guard motors",
      );
    }
  } finally {
    resources.dispose();
  }
});

test("new campaign rival assets bind the same articulated contract and preserve finite constrained poses", async () => {
  const resources = new Resources();
  try {
    for (const name of ["brick", "encore"]) {
      const data = await readFile(
        new URL(`../../../../public/models/${name}.glb`, import.meta.url),
      );
      const asset = await new GLTFLoader().parseAsync(
        data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
        "",
      );
      assert.ok(resources.adoptModel(asset.scene));
      const fighter = new Fighter(
        resources,
        {
          skin: "#bd8653",
          gloves: "#1c65bf",
          shorts: "#202934",
          hair: "#20202a",
          boots: "#222c38",
          identity: "rival",
          scale: 1.02,
        },
        asset.scene,
      );
      for (const attack of ["jab", "cross", "hook", "uppercut"] as const) {
        const strike: Strike = {
          attack,
          stance: "offensive",
          outcome: "hit",
          power: 4,
          variant: 2,
          started: 0,
          contactAt: 0.3,
          duration: 1.2,
          resolved: false,
        };
        for (let frame = 0; frame < 90; frame++)
          fighter.pose({
            time: frame / 60,
            dt: 1 / 60,
            stance: "offensive",
            strike,
            stamina: 80,
            reaction: 0,
            reactionAttack: attack,
            knockout: null,
            variant: 2,
          });
        fighter.root.updateMatrixWorld(true);
        fighter.root.traverse((o) =>
          assert.ok(o.matrixWorld.elements.every(Number.isFinite)),
        );
        const foot = new THREE.Vector3();
        fighter.root.traverse((object) => {
          if (/^Foot[LR](?:\.)?\d*$/.test(object.name)) {
            object.getWorldPosition(foot);
            assert.ok(foot.y >= 0);
          }
        });
      }
    }
  } finally {
    resources.dispose();
  }
});
