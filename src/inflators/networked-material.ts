import { addComponent } from "bitecs";
import { EntityID, HubsWorld } from "hubs";
import { NetworkedMaterial } from "../components";

export const MaterialFlags = {
  TRANSPARENT: 1 << 0,
  TONE_MAPPED: 1 << 1,
  WIREFRAME: 1 << 2,
  FLAT_SHADED: 1 << 3,
  FOG: 1 << 4,
  DEPTH_WRITE: 1 << 4,
};

export function inflateNetworkedMaterial(
  world: HubsWorld,
  eid: EntityID
): EntityID {
  addComponent(world, NetworkedMaterial, eid);

  return eid;
}
