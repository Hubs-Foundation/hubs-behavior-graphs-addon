import {
  ComponentDataT,
  EntityID,
  HubsWorld,
  Networked,
  NetworkedTransform,
} from "hubs";
import { inflateVisible } from "./visible";
import { addComponent } from "bitecs";

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
    addComponent(world, Networked, eid);
    addComponent(world, NetworkedTransform, eid);
  }
  if (params.visible) {
    inflateVisible(world, eid, params);
  }
  return eid;
}
