import * as THREE from "three";
import type { Resources } from "./Resources";

export interface FighterAppearance {
  skin: string;
  gloves: string;
  shorts: string;
  hair: string;
  boots: string;
  scale?: number;
  identity?: "player" | "rival";
}
export interface FighterArm {
  upper: THREE.Object3D;
  lower: THREE.Object3D;
  elbow: THREE.Object3D;
  glove: THREE.Group;
  wrist: THREE.Vector3;
  contact: THREE.Vector3;
}
export interface FighterLeg {
  upper: THREE.Object3D;
  lower: THREE.Object3D;
  knee: THREE.Object3D;
  foot: THREE.Group;
}

/** Bind the authored GLB assembly to the existing IK presentation contract. */
export function buildFighterModel(
  _resources: Resources,
  appearance: FighterAppearance,
  asset?: THREE.Object3D,
) {
  if (!asset)
    throw new Error("The authored fighter model must load before posing");
  const find = (name: string) => {
    let result: THREE.Object3D | undefined;
    asset.traverse((object) => {
      // Blender suffixes duplicate names; GLTFLoader strips their punctuation.
      if (!result && object.name.replace(/(?:\.)?\d{3}$/, "") === name)
        result = object;
    });
    if (!result) throw new Error(`Authored fighter is missing ${name}`);
    return result;
  };
  const assembly =
    asset.children.find((o) => o.name === "Player" || o.name === "Rival") ??
    asset;
  const root = assembly as THREE.Group;
  root.scale.setScalar(appearance.scale ?? 1);
  const body = find("Body") as THREE.Group;
  const head = find("Head") as THREE.Group;
  const hips = find("Hips") as THREE.Group;
  const arms: FighterArm[] = [];
  const legs: FighterLeg[] = [];
  for (const [i, side] of ["L", "R"].entries()) {
    arms.push({
      upper: find("ArmUpper" + side),
      lower: find("ArmLower" + side),
      elbow: find("Elbow" + side),
      glove: find("Glove" + side) as THREE.Group,
      wrist: new THREE.Vector3((i === 0 ? -1 : 1) * 0.34, 0.63, 0.39),
      contact: find("Contact_" + side).position.clone(),
    });
    legs.push({
      upper: find("LegUpper" + side),
      lower: find("LegLower" + side),
      knee: find("Knee" + side),
      foot: find("Foot" + side) as THREE.Group,
    });
  }
  const brows: THREE.Mesh[] = [];
  for (const name of ["BrowL", "BrowR"]) {
    asset.traverse((object) => {
      if (
        object instanceof THREE.Mesh &&
        object.name.replace(/(?:\.)?\d{3}$/, "") === name
      )
        brows.push(object);
    });
  }
  return {
    root,
    body,
    head,
    hips,
    arms,
    legs,
    mouth: find("Mouth") as THREE.Mesh,
    brows,
  };
}
