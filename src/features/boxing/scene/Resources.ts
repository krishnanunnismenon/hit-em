import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
export class Resources {
  private geometries = new Map<string, THREE.BufferGeometry>();
  private materials = new Map<string, THREE.MeshStandardMaterial>();
  private textures: THREE.Texture[] = [];
  private extraMaterials = new Set<THREE.Material>();
  private disposed = false;
  geometry(key: string, create: () => THREE.BufferGeometry) {
    if (!this.geometries.has(key)) this.geometries.set(key, create());
    return this.geometries.get(key)!;
  }
  ownTexture<T extends THREE.Texture>(texture: T): T {
    this.textures.push(texture);
    return texture;
  }
  ownMaterial<T extends THREE.Material>(material: T): T {
    this.extraMaterials.add(material);
    return material;
  }
  /** Takes ownership even when an async model resolves after scene disposal. */
  adoptModel(model: THREE.Object3D): boolean {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material]) {
        materials.add(material);
        for (const value of Object.values(material))
          if (value instanceof THREE.Texture) textures.add(value);
      }
    });
    if (this.disposed) {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      return false;
    }
    geometries.forEach((geometry) =>
      this.geometries.set(geometry.uuid, geometry),
    );
    materials.forEach((material) => this.extraMaterials.add(material));
    textures.forEach((texture) => {
      if (!this.textures.includes(texture)) this.textures.push(texture);
    });
    return true;
  }
  box(w: number, h: number, d: number, r = 0.06) {
    const key = [w, h, d, r].join(":");
    if (!this.geometries.has(key))
      this.geometries.set(key, new RoundedBoxGeometry(w, h, d, 2, r));
    return this.geometries.get(key)!;
  }
  torso() {
    if (!this.geometries.has("torso")) {
      const geometry = this.box(0.84, 0.66, 0.4, 0.13).clone();
      const vertices = geometry.attributes.position;
      for (let i = 0; i < vertices.count; i++)
        vertices.setX(
          i,
          vertices.getX(i) * (0.78 + 0.22 * (vertices.getY(i) / 0.66 + 0.5)),
        );
      geometry.computeVertexNormals();
      this.geometries.set("torso", geometry);
    }
    return this.geometries.get("torso")!;
  }
  plane() {
    if (!this.geometries.has("plane"))
      this.geometries.set("plane", new THREE.PlaneGeometry(1, 1));
    return this.geometries.get("plane")!;
  }
  contactShadow() {
    const key = "contact-shadow";
    const existing = [...this.extraMaterials].find((m) => m.name === key);
    if (existing) return existing;
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader:
        "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader:
        "varying vec2 vUv;void main(){float a=(1.0-smoothstep(0.08,0.5,length((vUv-0.5)*vec2(1.1,1.0))))*0.45;gl_FragColor=vec4(0.06,0.045,0.03,a);}",
    });
    material.name = key;
    this.extraMaterials.add(material);
    return material;
  }
  sphere() {
    if (!this.geometries.has("sphere"))
      this.geometries.set("sphere", new THREE.SphereGeometry(1, 20, 14));
    return this.geometries.get("sphere")!;
  }
  cylinder() {
    if (!this.geometries.has("cylinder"))
      this.geometries.set("cylinder", new THREE.CylinderGeometry(1, 1, 1, 12));
    return this.geometries.get("cylinder")!;
  }
  material(color: string, roughness = 0.42, metalness = 0.04) {
    const key = [color, roughness, metalness].join(":");
    if (!this.materials.has(key))
      this.materials.set(
        key,
        new THREE.MeshStandardMaterial({ color, roughness, metalness }),
      );
    return this.materials.get(key)!;
  }
  async texture(url: string, repeat = 1) {
    const texture = await new THREE.TextureLoader().loadAsync(url);
    if (this.disposed) {
      texture.dispose();
      throw new Error("Scene resources disposed during texture load");
    }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat, repeat);
    texture.anisotropy = 4;
    this.textures.push(texture);
    return texture;
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.extraMaterials.forEach((x) => x.dispose());
    this.geometries.forEach((x) => x.dispose());
    this.materials.forEach((x) => x.dispose());
    this.textures.forEach((x) => x.dispose());
  }
}
export function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  parent: THREE.Object3D,
  position: [number, number, number],
  scale?: [number, number, number],
) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position);
  if (scale) m.scale.set(...scale);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
