import { addComponent } from "bitecs";
import { ComponentDataT, EntityID, HubsWorld } from "hubs";
import { NetworkedBehavior } from "../components";

export const NetworkedBehaviorData = new Map<EntityID, Map<string, JSON>>();

export function inflateNetworkedBehavior(
  world: HubsWorld,
  eid: EntityID,
  params?: ComponentDataT
): EntityID {
  addComponent(world, NetworkedBehavior, eid);
  if (params) {
    const data = NetworkedBehaviorData.get(eid) || new Map();
    for (let key in params) {
      const type = params[key].type;
      const value = params[key].value;
      if (type === "integer") {
        data.set(key, BigInt(value));
      } else {
        data.set(key, value);
      }
    }
    NetworkedBehaviorData.set(eid, data);
  }
  return eid;
}
