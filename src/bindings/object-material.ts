import { Mesh } from "three";
import { hasComponent } from "bitecs";
import { EntityID, Owned, Networked, App } from "hubs";
import { NetworkedObjectMaterial } from "../components";

export function setObjectMaterial(app: App, eid: EntityID, matEid: EntityID) {
  const world = app.world;
  const material = world.eid2mat.get(matEid);
  const obj = world.eid2obj.get(eid);

  if (!obj) {
    console.error(`set material: could not find entity`, eid);
    return;
  }
  if (!material) {
    console.error(`set material: could not find material`, matEid);
    return;
  }
  const mesh = obj as Mesh;
  if (!mesh.isMesh) {
    console.error(`set material: called on a non mesh`, eid);
    return;
  }
  mesh.material = material;

  if (
    hasComponent(world, NetworkedObjectMaterial, eid) &&
    hasComponent(world, Owned, eid)
  ) {
    const matEid = material.eid!;
    const matNid = Networked.id[matEid];
    NetworkedObjectMaterial.matNid[eid] = matNid;
  }
}

export function getObjectMaterial(app: App, eid: EntityID): EntityID | null {
  const world = app.world;
  const obj = world.eid2obj.get(eid);
  if (!obj) {
    return null;
  }
  const mesh = obj as Mesh;
  if (!mesh.isMesh) {
    return null;
  }
  return Array.isArray(mesh.material)
    ? mesh.material[0].eid!
    : mesh.material.eid!;
}
