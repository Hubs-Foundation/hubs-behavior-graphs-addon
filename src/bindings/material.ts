import { hasComponent } from "bitecs";
import { GLTFMaterial } from "../nodes/entity-nodes";
import { Color, Euler, MeshStandardMaterial, Vector3 } from "three";
import { material2NetworkedMaterial } from "../systems/material-system";
import { EntityID, Owned, App } from "hubs";
import { NetworkedMaterial } from "../components";

export const NEEDS_UPDATE_PROPERTIES: (keyof GLTFMaterial)[] = [
  "flatShading",
  "map",
  "lightMap",
  "aoMap",
  "emissiveMap",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "alphaMap",
];

export function setMaterial(
  app: App,
  eid: EntityID,
  props: Partial<GLTFMaterial>
) {
  const world = app.world;
  let material = world.eid2mat.get(eid)! as any;
  for (const [key, value] of Object.entries(props)) {
    if (
      value instanceof Euler ||
      value instanceof Color ||
      value instanceof Vector3
    ) {
      const prop = material[key];
      prop.copy(value);
    } else {
      material[key] = value;
    }
    if (NEEDS_UPDATE_PROPERTIES.includes(key as keyof GLTFMaterial))
      material.needsUpdate = true;
  }
  if (
    hasComponent(world, NetworkedMaterial, eid) &&
    hasComponent(world, Owned, eid)
  ) {
    material2NetworkedMaterial(eid, material);
  }
}

export function getMaterial(app: App, eid: EntityID): Partial<GLTFMaterial> {
  const world = app.world;
  let material = world.eid2mat.get(eid)! as MeshStandardMaterial;
  return material;
}
