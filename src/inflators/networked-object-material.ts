import { addComponent } from "bitecs";
import { EntityID, HubsWorld } from "hubs";
import { NetworkedObjectMaterial } from "../components";

export function inflateNetworkedObjectMaterial(
  world: HubsWorld,
  eid: EntityID
): EntityID {
  addComponent(world, NetworkedObjectMaterial, eid);
  return eid;
}
