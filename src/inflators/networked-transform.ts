import { addComponent } from "bitecs";
import { EntityID, HubsWorld, Networked, NetworkedTransform } from "hubs";

export function inflateNetworkedTransform(
  world: HubsWorld,
  eid: EntityID
): EntityID {
  addComponent(world, Networked, eid);
  addComponent(world, NetworkedTransform, eid);
  return eid;
}
