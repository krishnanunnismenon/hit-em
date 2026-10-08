import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { OpponentId } from "../domain/opponent";
import type { Resources } from "./Resources";

export interface FighterAssets {
  player: THREE.Object3D;
  rival: THREE.Object3D;
}

/** Load the editable authored models before the fight can start. */
export async function loadFighterAssets(
  resources: Resources,
  opponent: OpponentId = "quickstep",
): Promise<FighterAssets> {
  const loader = new GLTFLoader();
  const load = async (identity: "player" | "rival" | "brick" | "encore") => {
    const gltf = await loader.loadAsync(`/models/${identity}.glb`);
    const root = gltf.scene;
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const printed = /Eye_|Eye |brow|crease|Mouth|Crown|printed/i.test(
        object.name,
      );
      object.castShadow = !printed;
      object.receiveShadow = !printed;
      if (object.name.replace(/(?:\.)?\d{3}$/, "") === "Mouth") {
        // Give the reaction mouth its own local pivot without moving its print.
        const position = object.geometry.attributes.position;
        const center = new THREE.Vector3();
        object.geometry.computeBoundingBox();
        object.geometry.boundingBox!.getCenter(center);
        for (let i = 0; i < position.count; i++) {
          position.setXYZ(
            i,
            position.getX(i) - center.x,
            position.getY(i) - center.y,
            position.getZ(i) - center.z,
          );
        }
        position.needsUpdate = true;
        object.position.add(center);
        object.geometry.computeBoundingBox();
        object.geometry.computeBoundingSphere();
      }
    });
    if (!resources.adoptModel(root))
      throw new Error("Fighter model resolved after scene disposal");
    return root;
  };
  const [player, rival] = await Promise.all([
    load("player"),
    load(opponent === "quickstep" ? "rival" : opponent),
  ]);
  return { player, rival };
}
