import { hasComponent } from "bitecs";
import { Owned, EntityID, App, ComponentDataT } from "hubs";
import { NetworkedVisible, Visible } from "../components";

export function setVisible(app: App, eid: number, params: ComponentDataT) {
  const world = app.world;
  const obj = world.eid2obj.get(eid)!;
  obj.visible = params.visible;

  if (
    hasComponent(world, NetworkedVisible, eid) &&
    hasComponent(world, Owned, eid)
  ) {
    const obj = world.eid2obj.get(eid)!;
    Visible.visible[eid] = obj.visible ? 1 : 0;
    NetworkedVisible.visible[eid] = obj.visible ? 1 : 0;
  }
}
export function getVisible(app: App, eid: EntityID): ComponentDataT {
  const world = app.world;
  const obj = world.eid2obj.get(eid)!;
  return { visible: obj.visible };
}
