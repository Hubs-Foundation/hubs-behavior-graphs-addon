import { App, ComponentDataT, EntityID, HubsWorld } from "hubs";
import { inflateVisible } from "./visible";
import { inflateNetworkedTransform } from "./networked-transform";

export interface NetworkedObjectPropertiesParams {
  visible: boolean;
  transform: boolean;
}

const DEFAULTS = {
  visible: false,
  transform: false,
};

export function inflateNetworkedObjectProperties(
  world: HubsWorld,
  eid: EntityID,
  params?: ComponentDataT
): number {
  params = Object.assign({}, DEFAULTS, params);
  if (params.transform) {
    inflateNetworkedTransform(world, eid);
  }
  if (params.visible) {
    inflateVisible(world, eid, params);
  }
  return eid;
}
