import { addComponent } from "bitecs";
import { EntityID, HubsWorld } from "hubs";
import { NetworkedAnimation } from "../components";

export const ObjectAnimationActionData = new Map<EntityID, Set<EntityID>>();

export function inflateNetworkedAnimation(
  world: HubsWorld,
  eid: EntityID
): EntityID {
  addComponent(world, NetworkedAnimation, eid);
  return eid;
}
