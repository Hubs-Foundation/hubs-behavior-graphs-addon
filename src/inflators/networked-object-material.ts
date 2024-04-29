import { addComponent } from "bitecs";
import { EntityID, HubsWorld, Networked } from "hubs";
import { NetworkedObjectMaterial } from "../components";

export function inflateNetworkedObjectMaterial(
  world: HubsWorld,
  eid: EntityID
): EntityID {
  addComponent(world, Networked, eid);
  addComponent(world, NetworkedObjectMaterial, eid);
  return eid;
}
