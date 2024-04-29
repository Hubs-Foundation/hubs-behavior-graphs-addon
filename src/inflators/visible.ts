import { addComponent } from "bitecs";
import { ComponentDataT, EntityID, HubsWorld, Networked } from "hubs";
import { Visible, NetworkedVisible } from "../components";

const DEFAULTS = {
  visible: true,
};

export function inflateVisible(
  world: HubsWorld,
  eid: number,
  params?: ComponentDataT
): EntityID {
  params = Object.assign({}, DEFAULTS, params);
  addComponent(world, Visible, eid);
  addComponent(world, Networked, eid);
  addComponent(world, NetworkedVisible, eid);

  Visible.visible[eid] = Number(params.visible);
  NetworkedVisible.visible[eid] = Number(params.visible);

  return eid;
}
